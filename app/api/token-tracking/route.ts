// app/api/token-tracking/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { encoding_for_model } from "tiktoken";
import prisma from "@/lib/prismadb";

const MAX_ANONYMOUS_CHATS = 5;
const ANONYMOUS_TOKEN_LIMIT = 300000;

export async function POST(req: Request) {
  const { userId } = auth();
  const { message, model } = await req.json();

  const sessionId = userId || req.headers.get("x-session-id") || "anonymous";

  const encoder = encoding_for_model(model || "gpt-4o");
  const tokenCount = encoder.encode(message).length;
  encoder.free();

  if (!userId) {
    let session = await prisma.anonymousSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      session = await prisma.anonymousSession.create({
        data: { sessionId, chatCount: 1, tokenUsage: tokenCount },
      });
    } else {
      session = await prisma.anonymousSession.update({
        where: { sessionId },
        data: {
          chatCount: { increment: 1 },
          tokenUsage: { increment: tokenCount },
        },
      });
    }

    if (session.chatCount > MAX_ANONYMOUS_CHATS) {
      return NextResponse.json(
        { error: "Chat limit reached" },
        { status: 403 }
      );
    }

    if (session.tokenUsage > ANONYMOUS_TOKEN_LIMIT) {
      return NextResponse.json(
        { error: "Token limit reached" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ success: true, tokenCount });
}
