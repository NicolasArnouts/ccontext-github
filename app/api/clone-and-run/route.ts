// app/api/clone-and-run/route.ts
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import {
  generateRepoSlug,
  sanitizeInput,
  validateGitHubUrl,
  stripAnsiCodes,
  extractFileTreeContent,
} from "@/lib/helpers";
import { TempEnvManager } from "@/lib/temp-env-manager";

const tempEnvManager = new TempEnvManager();

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("userId:", userId);

    // getting vars from body content
    const { githubUrl, ccontextCommand } = await req.json();

    validateGitHubUrl(githubUrl);

    const sanitizedCommand = sanitizeInput(ccontextCommand);

    const repositoryId = await generateRepoSlug(githubUrl);

    try {
      let repo = await tempEnvManager.getRepository(repositoryId, userId);

      if (
        !repo ||
        !tempEnvManager.repoExistsInFileSystem(repositoryId, userId)
      ) {
        // Repo does not exist in database or file system
        console.log("Repo does not exist in database or file system");

        // Create or update the repository
        repo = await tempEnvManager.createOrUpdateRepository(githubUrl, userId);
      }

      // Run ccontext command
      const { stdout, stderr, markdownContent } =
        await tempEnvManager.runCommand(repo.slug, sanitizedCommand, userId);

      await prismadb.run.create({
        data: {
          repositoryId: repo.slug,
          output: stdout,
        },
      });

      // Strip ANSI codes from stdout and stderr
      const cleanStdout = stripAnsiCodes(stdout);

      // Extract the file tree content
      const parsedFileTree = markdownContent
        ? extractFileTreeContent(markdownContent)
        : null;

      // Check if PDF exists
      const baseDir =
        "/Users/narn/Desktop/school/ccontext-github/temp_environments";
      const userDir = path.join(baseDir, userId);
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
      return NextResponse.json(
        { error: "An error occurred during command execution" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    if (error.message === "Rate limit exceeded") {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
