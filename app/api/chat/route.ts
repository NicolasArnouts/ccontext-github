import { Configuration, OpenAIApi } from "openai";
import { NextResponse } from "next/server";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini ",
      messages: messages,
    });

    return NextResponse.json(completion.data.choices[0].message);
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred during the chat completion." },
      { status: 500 }
    );
  }
}
