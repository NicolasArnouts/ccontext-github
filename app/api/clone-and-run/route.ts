import { NextResponse } from 'next/server'
import path from 'path'
import { rateLimit } from '@/lib/rate-limit'
import prismadb from '@/lib/prismadb'
import { auth } from "@clerk/nextjs/server";
import { sanitizeInput, validateGitHubUrl } from '@/lib/helpers'
import { TempEnvManager } from '@/lib/temp-env-manager'

const tempEnvManager = new TempEnvManager();

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    await rateLimit('clone-and-run', {
      interval: 60 * 1000, // 1 minute
      maxRequests: 10 // 10 requests per minute
    });

    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { githubUrl, ccontextCommand } = await req.json()

    if (!validateGitHubUrl(githubUrl)) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
    }
    const sanitizedCommand = sanitizeInput(ccontextCommand)

    try {
      // Create a temporary environment
      const envId = await tempEnvManager.createEnvironment(githubUrl);

      // Run ccontext command
      const { stdout, stderr } = await tempEnvManager.runCommand(envId, sanitizedCommand);

      // Get the latest version tag or commit hash
      const { stdout: versionInfo } = await tempEnvManager.runCommand(envId, 'git describe --tags --always');
      const latestVersion = versionInfo.trim();

      // Store the repository and run information in the database
      const repository = await prismadb.repository.create({
        data: {
          name: path.basename(githubUrl),
          url: githubUrl,
          userId: userId,
          latestVersion: latestVersion,
        }
      });

      await prismadb.run.create({
        data: {
          repositoryId: repository.id,
          output: stdout,
        }
      });

      return NextResponse.json({ output: stdout, error: stderr })
    } finally {
      // Clean up expired environments
      await tempEnvManager.cleanupExpiredEnvironments();
    }
  } catch (error) {
    console.error('Error:', error)
    if (error.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}