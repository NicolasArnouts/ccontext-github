import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import {
  getUserInfo,
  getOrCreateUserTokens,
  getInputTokens,
  stripAnsiCodes,
} from "@/lib/helpers";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getMessageContent(message: ChatCompletionMessageParam): string {
  if (typeof message.content === "string") {
    return message.content;
  } else if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if ("text" in part) {
          return part.text;
        }
        return "";
      })
      .join(" ");
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const userInfo = await getUserInfo(req);
    const {
      messages,
      modelId,
    }: { messages: ChatCompletionMessageParam[]; modelId: string } =
      await req.json();

    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json(
        { error: "Invalid model selected" },
        { status: 400 }
      );
    }

    let userTokens = await getOrCreateUserTokens(userInfo, modelId);

    if (model.tags.includes("Premium") && userInfo.isAnonymous) {
      return NextResponse.json(
        { error: "Authentication required for premium models" },
        { status: 403 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided for chat completion" },
        { status: 400 }
      );
    }

    const inputTokens = messages.reduce((acc, message) => {
      const content = getMessageContent(message);
      return acc + getInputTokens(content);
    }, 0);

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

    // @ts-ignore
    const stream = await openai.chat.completions.create({
      model: model.name,
      messages: messages,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          responseTokens += getInputTokens(content);
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
      async flush() {
        // Update tokens for the response after streaming is complete
        await prisma.userTokens.update({
          where: { id: userTokens.id },
          data: {
            tokensLeft: Math.max(0, userTokens.tokensLeft - responseTokens),
            lastRequestTime: new Date(),
          },
        });

        // Save the chat message
        await prisma.chatMessage.create({
          data: {
            userId: userInfo.isAnonymous ? null : userInfo.id,
            sessionId: userInfo.id,
            role: "assistant",
            content: responseContent,
            order: messages.length,
          },
        });
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
