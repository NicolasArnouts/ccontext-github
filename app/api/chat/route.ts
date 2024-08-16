// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";
import { auth } from "@clerk/nextjs/server";
import { encoding_for_model } from "tiktoken";
import prisma from "@/lib/prismadb";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { userId } = auth();
  const { messages, model } = await req.json();

  const sessionId = userId || req.headers.get("x-session-id") || "anonymous";

  if (!userId) {
    const session = await prisma.anonymousSession.findUnique({
      where: { sessionId },
    });

    if (!session || session.chatCount > 5) {
      return new Response(JSON.stringify({ error: "Chat limit reached" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const encoder = encoding_for_model(model || "gpt-4o-mini");
  const tokenCount = messages.reduce(
    (acc: number, message: any) => acc + encoder.encode(message.content).length,
    0
  );
  encoder.free();

  if (!userId) {
    const updatedSession = await prisma.anonymousSession.update({
      where: { sessionId },
      data: { tokenUsage: { increment: tokenCount } },
    });

    if (updatedSession.tokenUsage > 300000) {
      return new Response(JSON.stringify({ error: "Token limit reached" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const result = await streamText({
    model: openai(model || "gpt-4o-mini"),
    messages: convertToCoreMessages(messages),
    // maxTokens: 100000,
  });

  return result.toDataStreamResponse();
}
