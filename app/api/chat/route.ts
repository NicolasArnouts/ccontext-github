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
  try {
    const { userId } = auth();
    const { messages } = await req.json();

    const model = "gpt-4o-mini";

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

    const encoder = encoding_for_model(model || "gpt-4o-mini");
    const tokenCount = messages.reduce(
      (acc: number, message: any) =>
        acc + encoder.encode(message.content).length,
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

    let fullResponse = "";

    try {
      const stream = await streamText({
        model: openai(model),
        messages,import { openai } from '@ai-sdk/openai';
        import { streamText, convertToCoreMessages } from 'ai';
        
        // Allow streaming responses up to 30 seconds
        export const maxDuration = 30;
        
        export async function POST(req: Request) {
          const { messages } = await req.json();
        
          const result = await streamText({
            model: openai('gpt-4-turbo'),
            messages: convertToCoreMessages(messages),
          });
        
          return result.toDataStreamResponse();
        }
      });

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                fullResponse += chunk.content;
                controller.enqueue(chunk.content);
              }
              controller.close();
            } catch (error) {
              console.error("Error in stream processing:", error);
              controller.error(error);
            } finally {
              encoder.free();
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    } catch (streamError) {
      console.error("Error in streamText:", streamError);
      return new Response(
        JSON.stringify({ error: "Error in text streaming" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in POST route:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
