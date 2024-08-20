// app/api/save-message/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { getUserId } from "@/lib/helpers";

export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    const { role, content, sessionId } = await req.json();

    const message = await prisma.chatMessage.create({
      data: {
        userId: userId,
        sessionId,
        role,
        content,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
