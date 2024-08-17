// app/api/chat/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { userId } = auth();
  const { messages, modelId } = await req.json();

  try {
    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json(
        { error: "Invalid model selected" },
        { status: 400 }
      );
    }

    let userTokens = await prisma.userTokens.findUnique({
      where: { userId_modelId: { userId, modelId } },
    });

    if (!userTokens) {
      userTokens = await prisma.userTokens.create({
        data: {
          userId,
          modelId,
          tokensLeft: model.tags.includes("Free") ? 1000 : 0, // Set initial tokens for free models
        },
      });
    }

    if (model.tags.includes("Premium") && !userId) {
      return NextResponse.json(
        { error: "Authentication required for premium models" },
        { status: 403 }
      );
    }

    if (userTokens.tokensLeft <= 0) {
      if (model.tags.includes("Free")) {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        if (
          !userTokens.resetTimestamp ||
          userTokens.resetTimestamp < fourHoursAgo
        ) {
          await prisma.userTokens.update({
            where: { id: userTokens.id },
            data: { tokensLeft: 1000, resetTimestamp: new Date() },
          });
        } else {
          return NextResponse.json(
            { error: "Not enough tokens. Please wait for reset." },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Not enough tokens for premium model" },
          { status: 403 }
        );
      }
    }

    const stream = await openai.chat.completions.create({
      model: model.name,
      messages: messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    let tokenCount = 0;

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          tokenCount += content.split(" ").length; // Rough estimate of tokens
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    // Update tokens used
    await prisma.userTokens.update({
      where: { id: userTokens.id },
      data: {
        tokensLeft: Math.max(0, userTokens.tokensLeft - tokenCount),
        lastRequestTime: new Date(),
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred during the chat completion." },
      { status: 500 }
    );
  }
}
