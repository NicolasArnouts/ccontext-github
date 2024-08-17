import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { encoding_for_model } from "tiktoken";
import prisma from "@/lib/prismadb";
import { getClientIpAddress } from "@/lib/helpers";

const MAX_ANONYMOUS_TOKENS = 300000;
const MAX_ANONYMOUS_CHATS = 5;

export const maxDuration = 120;

export async function POST(req: Request) {
  const { userId } = auth();
  const { messages, model } = await req.json();

  const clientIp = getClientIpAddress(req);
  const sessionId = userId || `anon_${clientIp}`;

  let session;
  if (!userId) {
    session = await prisma.anonymousSession.upsert({
      where: { sessionId },
      update: {},
      create: {
        sessionId,
        ipAddress: clientIp,
      },
    });

    if (session.chatCount >= MAX_ANONYMOUS_CHATS) {
      return new Response(JSON.stringify({ error: "Chat limit reached" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const encoder = encoding_for_model(model || "gpt-4");
  const tokenCount = messages.reduce(
    (acc: number, message: any) => acc + encoder.encode(message.content).length,
    0
  );

  if (!userId) {
    const updatedSession = await prisma.anonymousSession.update({
      where: { sessionId },
      data: {
        tokenUsage: { increment: tokenCount },
        chatCount: { increment: 1 },
      },
    });

    if (updatedSession.tokenUsage > MAX_ANONYMOUS_TOKENS) {
      encoder.free();
      return new Response(JSON.stringify({ error: "Token limit reached" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Save the user's message to the database
  await prisma.chatMessage.create({
    data: {
      userId: userId || null,
      sessionId,
      role: "user",
      content: messages[messages.length - 1].content,
    },
  });

  let fullResponse = "";

  const stream = await streamText({
    model: openai(model || "gpt-4"),
    messages,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          fullResponse += chunk.content;
          controller.enqueue(chunk.content);
        }
        controller.close();

        // Save the AI's response to the database after streaming is complete
        await prisma.chatMessage.create({
          data: {
            userId: userId || null,
            sessionId,
            role: "assistant",
            content: fullResponse,
          },
        });

        // Update token usage for the AI response
        const aiResponseTokens = encoder.encode(fullResponse).length;
        if (!userId) {
          await prisma.anonymousSession.update({
            where: { sessionId },
            data: {
              tokenUsage: { increment: aiResponseTokens },
            },
          });
        }

        encoder.free();
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}
