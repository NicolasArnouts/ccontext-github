import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import {
  getUserInfo,
  getOrCreateUserTokens,
  getInputTokens,
} from "@/lib/helpers";

export async function GET(req: NextRequest) {
  const userInfo = await getUserInfo(req);
  const { searchParams } = new URL(req.url);
  const modelId = searchParams.get("modelId");

  if (!modelId) {
    return NextResponse.json(
      { error: "Model ID is required" },
      { status: 400 }
    );
  }

  try {
    const userTokens = await getOrCreateUserTokens(userInfo, modelId);

    return NextResponse.json({ remainingTokens: userTokens.tokensLeft });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userInfo = await getUserInfo(req);
  const { message, modelId } = await req.json();

  if (!modelId || !message) {
    return NextResponse.json(
      { error: "Model ID and message are required" },
      { status: 400 }
    );
  }

  try {
    let userTokens = await getOrCreateUserTokens(userInfo, modelId);

    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json(
        { error: "Invalid model selected" },
        { status: 400 }
      );
    }

    const tokensUsed = getInputTokens(message);
    const hasEnoughTokens = userTokens.tokensLeft >= tokensUsed;

    if (hasEnoughTokens) {
      // Update tokens
      userTokens = await prisma.userTokens.update({
        where: { id: userTokens.id },
        data: {
          tokensLeft: userTokens.tokensLeft - tokensUsed,
          lastRequestTime: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: hasEnoughTokens,
      remainingTokens: userTokens.tokensLeft,
      tokensUsed,
    });
  } catch (error) {
    console.error("Error checking tokens:", error);
    return NextResponse.json(
      { error: "Failed to check tokens" },
      { status: 500 }
    );
  }
}
