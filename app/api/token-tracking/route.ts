import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { encoding_for_model } from "tiktoken";
import prisma from "@/lib/prismadb";
import { getClientIpAddress } from "@/lib/helpers";

const MAX_ANONYMOUS_CHATS = 5;
const ANONYMOUS_TOKEN_LIMIT = 100000;

export async function POST(req: Request) {
  const { userId } = auth();
  const { message } = await req.json();
  const clientIp = getClientIpAddress(req);

  const model = "gpt-4o";

  let sessionId: string;
  if (userId) {
    sessionId = userId;
  } else {
    // For anonymous users, use IP address as the session identifier
    sessionId = `anon_${clientIp}`;
  }

  const encoder = encoding_for_model(model || "gpt-4o");
  const tokenCount = encoder.encode(message).length;
  encoder.free();

  let session = await prisma.anonymousSession.findFirst({
    where: { ipAddress: clientIp },
  });

  if (!session) {
    session = await prisma.anonymousSession.create({
      data: {
        sessionId,
        ipAddress: clientIp,
        chatCount: 1,
        tokenUsage: tokenCount,
      },
    });
  } else {
    session = await prisma.anonymousSession.update({
      where: { id: session.id },
      data: {
        chatCount: { increment: 1 },
        tokenUsage: { increment: tokenCount },
        ipAddress: clientIp,
      },
    });
  }

  if (!userId && session.tokenUsage > ANONYMOUS_TOKEN_LIMIT) {
    return NextResponse.json({ error: "Token limit reached" }, { status: 403 });
  }

  const remainingTokens = userId
    ? 1000000 // Placeholder value for authenticated users
    : ANONYMOUS_TOKEN_LIMIT - session.tokenUsage;

  return NextResponse.json({
    success: true,
    tokenCount,
    remainingTokens,
    maxTokens: userId ? 1000000 : ANONYMOUS_TOKEN_LIMIT,
  });
}
