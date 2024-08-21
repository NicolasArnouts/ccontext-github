// app/api/save-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { getUserId } from "@/lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const { role, content, sessionId } = await req.json();

    // Get the highest order for the current session
    const highestOrder = await prisma.chatMessage.findFirst({
      where: { sessionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (highestOrder?.order ?? -1) + 1;

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        sessionId,
        role,
        content,
        order: newOrder,
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
