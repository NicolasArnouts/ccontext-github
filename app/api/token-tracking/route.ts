// app/api/token-tracking/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { getClientIpAddress } from "@/lib/helpers";

async function getOrCreateUserTokens(
  userId: string | null,
  modelId: string,
  clientIp: string
) {
  if (userId) {
    return prisma.userTokens.upsert({
      where: { userId_modelId: { userId, modelId } },
      update: {},
      create: { userId, modelId, tokensLeft: 1000 }, // Initial tokens for new users
    });
  } else {
    let anonymousSession = await prisma.anonymousSession.findFirst({
      where: { ipAddress: clientIp },
      include: { userTokens: true },
    });

    if (!anonymousSession) {
      anonymousSession = await prisma.anonymousSession.create({
        data: {
          sessionId: `anon_${clientIp}`,
          ipAddress: clientIp,
          userTokens: {
            create: { modelId, tokensLeft: 1000 }, // Initial tokens for new anonymous sessions
          },
        },
        include: { userTokens: true },
      });
    }

    const userTokens = anonymousSession.userTokens.find(
      (ut) => ut.modelId === modelId
    );
    if (userTokens) {
      return userTokens;
    } else {
      return prisma.userTokens.create({
        data: {
          modelId,
          tokensLeft: 1000,
          anonymousSessionId: anonymousSession.id,
        },
      });
    }
  }
}

export async function GET(req: Request) {
  const { userId } = auth();
  const { searchParams } = new URL(req.url);
  const modelId = searchParams.get("modelId");

  if (!modelId) {
    return NextResponse.json(
      { error: "Model ID is required" },
      { status: 400 }
    );
  }

  try {
    const clientIp = getClientIpAddress(req);
    const userTokens = await getOrCreateUserTokens(userId, modelId, clientIp);

    return NextResponse.json({ remainingTokens: userTokens.tokensLeft });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = auth();
  const { message, modelId } = await req.json();

  if (!modelId || !message) {
    return NextResponse.json(
      { error: "Model ID and message are required" },
      { status: 400 }
    );
  }

  try {
    const clientIp = getClientIpAddress(req);
    let userTokens = await getOrCreateUserTokens(userId, modelId, clientIp);

    const estimatedTokens = message.split(" ").length; // Simple estimation
    const hasEnoughTokens = userTokens.tokensLeft >= estimatedTokens;

    if (hasEnoughTokens) {
      // Update token count
      userTokens = await prisma.userTokens.update({
        where: { id: userTokens.id },
        data: {
          tokensLeft: userTokens.tokensLeft - estimatedTokens,
          lastRequestTime: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: hasEnoughTokens,
      remainingTokens: userTokens.tokensLeft,
    });
  } catch (error) {
    console.error("Error checking tokens:", error);
    return NextResponse.json(
      { error: "Failed to check tokens" },
      { status: 500 }
    );
  }
}
