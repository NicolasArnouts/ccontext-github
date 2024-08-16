import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log("messages:", messages);

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToCoreMessages(messages),
  });

  return result.toDataStreamResponse();
}
