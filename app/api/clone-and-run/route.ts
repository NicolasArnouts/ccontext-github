import { NextResponse } from 'next/server'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { rateLimit } from '@/lib/rate-limit'
import prismadb from '@/lib/prismadb'
import { auth } from "@clerk/nextjs/server";
import { sanitizeInput, validateGitHubUrl } from '@/lib/helpers'
import { execSync } from 'child_process'

const MAX_EXECUTION_TIME = 5 * 60 * 1000; // 5 minutes

async function executeCommand(command: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = execSync(`${command} ${args.join(' ')}`, { cwd, encoding: 'utf8' });
    return { stdout: result, stderr: '' };
  } catch (error) {
    return { stdout: '', stderr: error.message };
  }
}

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

    // Create a temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-ccontext-'));

    try {
      // Clone the repository
      await executeCommand('git', ['clone', githubUrl, tempDir], process.cwd());

      // Run ccontext command
      const { stdout, stderr } = await executeCommand('sh', ['-c', `${sanitizedCommand} -gm`], tempDir);

      // Read the generated markdown file
      const mdContent = fs.readFileSync(path.join(tempDir, 'ccontext-output.md'), 'utf8');

      // Get the latest version tag or commit hash
      const { stdout: versionInfo } = await executeCommand('git', ['describe', '--tags', '--always'], tempDir);
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
          output: mdContent,
        }
      });

      return NextResponse.json({ output: stdout, error: stderr, mdContent })
    } finally {
      // Clean up: remove the temp folder
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Error:', error)
    if (error.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}