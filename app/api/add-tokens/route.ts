import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { getUserId, isAnonUser } from "@/lib/helpers";

export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    if (isAnonUser(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { modelId, amount } = await req.json();

    if (!modelId || !amount) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updatedTokens = await prisma.userTokens.upsert({
      where: {
        userId_modelId: {
          userId,
          modelId,
        },
      },
      update: {
        tokensLeft: {
          increment: amount,
        },
      },
      create: {
        userId,
        modelId,
        tokensLeft: amount,
      },
    });

    return NextResponse.json({
      success: true,
      tokensLeft: updatedTokens.tokensLeft,
    });
  } catch (error) {
    console.error("Error adding credits:", error);
    return NextResponse.json(
      { error: "Failed to add credits" },
      { status: 500 }
    );
  }
}
