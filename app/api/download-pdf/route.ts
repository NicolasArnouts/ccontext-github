import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = auth();

  const { searchParams } = new URL(request.url);
  const envId = searchParams.get("envId");

  if (!envId) {
    return NextResponse.json(
      { error: "Missing envId parameter" },
      { status: 400 }
    );
  }

  const baseDir =
    "/Users/narn/Desktop/school/ccontext-github/temp_environments";
  const userDir = path.join(baseDir, userId || "anonymous");
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
