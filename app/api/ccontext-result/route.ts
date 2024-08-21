// app/api/ccontext-result/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TempEnvManager } from "@/lib/temp-env-manager";
import { getUserInfo } from "@/lib/helpers";
import fs from "fs";
import path from "path";

const tempEnvManager = new TempEnvManager();

export async function GET(req: NextRequest) {
  try {
    const userInfo = await getUserInfo(req);
    const envId = req.nextUrl.searchParams.get("envId");

    if (!envId) {
      return NextResponse.json({ error: "Missing envId" }, { status: 400 });
    }

    const repository = await tempEnvManager.getRepository(envId, userInfo.id);

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const repoPath = tempEnvManager.getRepoPath(userInfo.id, repository.slug);
    const markdownPath = path.join(repoPath, "ccontext-output.md");
    const pdfPath = path.join(repoPath, "ccontext-output.pdf");

    let markdownContent = null;
    let pdfExists = false;

    if (fs.existsSync(markdownPath)) {
      markdownContent = await fs.promises.readFile(markdownPath, "utf-8");
    }

    if (fs.existsSync(pdfPath)) {
      pdfExists = true;
    }

    return NextResponse.json({ markdownContent, pdfExists });
  } catch (error) {
    console.error("Error in ccontext-result API:", error);
    return NextResponse.json(
      { error: "Failed to fetch CContext result" },
      { status: 500 }
    );
  }
}
