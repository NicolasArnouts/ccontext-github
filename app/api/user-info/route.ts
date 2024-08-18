import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prismadb";
import { getClientIpAddress, cleanIpAddress } from "@/lib/helpers";

export async function GET(req: NextRequest) {
  const { userId } = auth();

  if (userId) {
    // User is authenticated
    const user = await prisma.userTokens.findMany({
      where: { userId },
    });
    return NextResponse.json({ isAuthenticated: true, user });
  } else {
    // User is anonymous
    const clientIp = getClientIpAddress(req);
    const cleanedIp = cleanIpAddress(clientIp);
    const anonymousId = `anon_${cleanedIp}`;

    console.log(`Anonymous user with IP: ${clientIp}`);

    let anonymousSession = await prisma.anonymousSession.findUnique({
      where: { sessionId: anonymousId },
      include: { userTokens: true },
    });

    if (!anonymousSession) {
      anonymousSession = await prisma.anonymousSession.create({
        data: {
          sessionId: anonymousId,
          ipAddress: clientIp,
        },
        include: { userTokens: true },
      });
    }

    return NextResponse.json({
      isAuthenticated: false,
      anonymousId: anonymousSession.sessionId,
      userTokens: anonymousSession.userTokens,
    });
  }
}
