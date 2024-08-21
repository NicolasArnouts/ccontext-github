import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { getUserInfo } from "@/lib/helpers";

export async function GET(req: NextRequest) {
  const userInfo = await getUserInfo(req);

  const userTokens = await prisma.userTokens.findMany({
    where: userInfo.isAnonymous
      ? { anonymousSessionId: userInfo.id }
      : { userId: userInfo.id },
  });

  return NextResponse.json({
    isAuthenticated: !userInfo.isAnonymous,
    userId: userInfo.id,
    userTokens,
  });
}
