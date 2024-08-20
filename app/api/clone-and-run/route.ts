import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import fs from "fs";
import path from "path";
import {
  generateRepoSlug,
  sanitizeInput,
  validateGitHubUrl,
  stripAnsiCodes,
  extractFileTreeContent,
  getUserInfo,
} from "@/lib/helpers";
import { TempEnvManager } from "@/lib/temp-env-manager";

const tempEnvManager = new TempEnvManager();

export async function POST(req: NextRequest) {
  try {
    const userInfo = await getUserInfo(req);
    console.log("userInfo:", userInfo);

    const { githubUrl, ccontextCommand } = await req.json();

    try {
      validateGitHubUrl(githubUrl);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    const sanitizedCommand = sanitizeInput(ccontextCommand);

    const repositoryId = await generateRepoSlug(githubUrl);

    try {
      let repo = await tempEnvManager.getRepository(repositoryId, userInfo.id);

      if (
        !repo ||
        !tempEnvManager.repoExistsInFileSystem(repositoryId, userInfo.id)
      ) {
        console.log("Repo does not exist in database or file system");

        repo = await tempEnvManager.createOrUpdateRepository(
          githubUrl,
          userInfo.id
        );
      }

      if (!repo) {
        throw new Error("Failed to create or retrieve repository");
      }

      const { stdout, stderr, markdownContent } =
        await tempEnvManager.runCommand(
          repo.slug,
          sanitizedCommand,
          userInfo.id
        );

      if (!userInfo.isAnonymous) {
        await prismadb.run.create({
          data: {
            repositoryId: repo.slug,
            output: stdout,
          },
        });
      }

      const cleanStdout = stripAnsiCodes(stdout);

      const parsedFileTree = markdownContent
        ? extractFileTreeContent(markdownContent)
        : null;

      const baseDir =
        "/Users/narn/Desktop/school/ccontext-github/temp_environments";
      const userDir = path.join(
        baseDir,
        userInfo.isAnonymous ? "anonymous" : userInfo.id
      );
      const repoPath = path.join(userDir, repo.slug);
      const pdfPath = path.join(repoPath, "ccontext-output.pdf");
      const pdfExists = fs.existsSync(pdfPath);

      return NextResponse.json({
        output: cleanStdout,
        repositoryId: repo.slug,
        markdownContent: markdownContent || null,
        parsedFileTree: parsedFileTree,
        pdfExists: pdfExists,
      });
    } catch (error) {
      console.error("Error during command execution:", error);
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(
        { error: "An error occurred during command execution" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error && error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
