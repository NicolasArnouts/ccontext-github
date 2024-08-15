import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import {
  generateRepoSlug,
  sanitizeInput,
  validateGitHubUrl,
} from "@/lib/helpers";
import { TempEnvManager } from "@/lib/temp-env-manager";

const tempEnvManager = new TempEnvManager();

export async function POST(req: Request) {
  try {
    // // Apply rate limiting
    // await rateLimit("clone-and-run", {
    //   interval: 60 * 1000, // 1 minute
    //   maxRequests: 5, // 5 requests per minute
    // });

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("userId:", userId);

    // getting vars from body content
    const { githubUrl, ccontextCommand } = await req.json();

    if (!validateGitHubUrl(githubUrl)) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }
    const sanitizedCommand = sanitizeInput(ccontextCommand);

    const repositoryId = await generateRepoSlug(githubUrl);
    console.log("done generating reposlug");

    try {
      let repo = await tempEnvManager.getRepository(repositoryId);

      if (!repo) {
        // repo does not exist
        // Create or update the repository
        repo = await tempEnvManager.createOrUpdateRepository(githubUrl, userId);
      }

      // check if the repo exists in the file system

      // Run ccontext command
      const { stdout, stderr } = await tempEnvManager.runCommand(
        repo.slug,
        sanitizedCommand
      );

      await prismadb.run.create({
        data: {
          repositoryId: repo.slug,
          output: stdout,
        },
      });

      return NextResponse.json({
        output: stdout,
        error: stderr,
        repositoryId: repo.slug,
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
