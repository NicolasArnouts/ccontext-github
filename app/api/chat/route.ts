import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import {
  getUserInfo,
  getOrCreateUserTokens,
  getInputTokens,
  stripAnsiCodes,
  UserInfo,
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

async function saveMessage(
  userInfo: UserInfo,
  role: "user" | "assistant",
  content: string,
  order: number
) {
  await prisma.chatMessage.create({
    data: {
      userId: userInfo.isAnonymous ? null : userInfo.id,
      sessionId: userInfo.id,
      role,
      content,
      order,
    },
  });
}

async function updateUserTokens(
  userTokensId: string,
  tokensUsed: number
): Promise<void> {
  await prisma.userTokens.update({
    where: { id: userTokensId },
    data: {
      tokensLeft: {
        decrement: tokensUsed,
      },
      lastRequestTime: new Date(),
    },
  });
}

export async function POST(req: NextRequest) {
  let responseTokens = 0;
  let responseContent = "";

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

    // Save user message
    await saveMessage(
      userInfo,
      "user",
      getMessageContent(messages[messages.length - 1]),
      messages.length - 1
    );

    const stream = await openai.chat.completions.create({
      model: model.name,
      messages: messages,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            const contentTokens = getInputTokens(content);

            // Check if user has enough tokens for this chunk
            if (userTokens.tokensLeft < responseTokens + contentTokens) {
              throw new Error("Not enough tokens to continue streaming");
            }

            responseTokens += contentTokens;
            responseContent += content;
            controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (error) {
          console.error("Error during streaming:", error);
          controller.error(error);
        } finally {
          if (responseTokens > 0) {
            await updateUserTokens(userTokens.id, responseTokens);
            await saveMessage(
              userInfo,
              "assistant",
              responseContent,
              messages.length
            );
          }
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Tokens-Used-Input": inputTokens.toString(),
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    let errorMessage =
      "An unexpected error occurred during the chat completion.";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Specific error handling
      if (errorMessage.includes("Not enough tokens")) {
        statusCode = 403;
      } else if (errorMessage.includes("Invalid model")) {
        statusCode = 400;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        partialResponse: responseContent,
      },
      { status: statusCode }
    );
  }
}
