import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { encoding_for_model } from "tiktoken";
import {
  getClientIpAddress,
  getInputTokens,
  getOrCreateUserTokens,
} from "@/lib/helpers";

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

    const clientIp = getClientIpAddress(req);
    let userTokens = await getOrCreateUserTokens(userId, modelId, clientIp);

    if (model.tags.includes("Premium") && !userId) {
      return NextResponse.json(
        { error: "Authentication required for premium models" },
        { status: 403 }
      );
    }

    const encoder = encoding_for_model("gpt-4o-mini");
    const inputTokens = messages.reduce((acc, message) => {
      return acc + encoder.encode(message.content).length;
    }, 0);

    console.log("inputTokens", inputTokens);

    if (userTokens.tokensLeft < inputTokens) {
      return NextResponse.json(
        { error: "Not enough tokens for this request" },
        { status: 403 }
      );
    }

    // Update tokens for input before streaming
    userTokens = await prisma.userTokens.update({
      where: { id: userTokens.id },
      data: {
        tokensLeft: userTokens.tokensLeft - inputTokens,
        lastRequestTime: new Date(),
      },
    });

    let responseTokens = 0;
    let responseContent = "";

    const stream = await openai.chat.completions.create({
      model: model.name,
      messages: messages,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          responseTokens += encoder.encode(content).length;
          responseContent += content;
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
      },
    });

    // Prepare headers for the response
    const responseHeaders = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "X-Tokens-Used-Input": inputTokens.toString(),
    });

    // Use a TransformStream to update tokens after the stream is complete
    const tokenUpdateStream = new TransformStream({
      async flush(controller) {
        // console.log("after the stream is complete");
        console.log("responseTokens", responseTokens);

        // Update tokens for the response after streaming is complete
        const updatedUserTokens = await prisma.userTokens.update({
          where: { id: userTokens.id },
          data: {
            tokensLeft: Math.max(0, userTokens.tokensLeft - responseTokens),
            lastRequestTime: new Date(),
          },
        });

        // Save the chat message
        if (userId || clientIp) {
          await prisma.chatMessage.create({
            data: {
              userId: userId || null,
              sessionId: userId || clientIp,
              role: "assistant",
              content: responseContent,
              order: messages.length,
            },
          });
        }
      },
    });

    return new Response(readableStream.pipeThrough(tokenUpdateStream), {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred during the chat completion." },
      { status: 500 }
    );
  }
}
