// app/api/token-tracking/route.ts

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
  let message, modelId;

  try {
    // Parse the request body
    const body = await req.json();
    message = body.message;
    modelId = body.modelId;

    // Log the received data for debugging
    console.log("Received POST data:", { message, modelId });

    // Check if required fields are present
    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Allow empty messages, but ensure it's a string
    message = message || "";

    let userTokens = await getOrCreateUserTokens(userInfo, modelId);

    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json(
        { error: "Invalid model selected" },
        { status: 400 }
      );
    }

    const tokensUsed = getInputTokens(message);
    console.log("tokensUsed:", tokensUsed);

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
