import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@clerk/nextjs/server";
import { getUserId, isAnonUser } from "@/lib/helpers";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  const { searchParams } = new URL(request.url);
  const envId = searchParams.get("envId");

  if (!envId) {
    return NextResponse.json(
      { error: "Missing envId parameter" },
      { status: 400 }
    );
  }

  const baseDir = process.env.TEMP_ENV_BASE_DIR;
  if (!baseDir) {
    throw new Error("TEMP_ENV_BASE_DIR environment variable not set");
  }

  const userPathName = isAnonUser(userId) ? "anonymous" : userId;
  const userDir = path.join(baseDir, userPathName);
  const repoPath = path.join(userDir, envId);
  const pdfPath = path.join(repoPath, "ccontext-output.pdf");

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const pdfBuffer = fs.readFileSync(pdfPath);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ccontext-output.pdf"`,
    },
  });
}
