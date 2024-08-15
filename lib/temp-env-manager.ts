import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import prismadb from "@/lib/prismadb";
import {
  validateGitHubUrl,
  sanitizeInput,
  generateRepoSlug,
  getFileRepoPath,
} from "@/lib/helpers";

const execAsync = promisify(exec);

export class TempEnvManager {
  private baseDir: string;
  private lifetime: number;

  constructor(lifetime = 12 * 60 * 60) {
    // 12 hours default lifetime
    this.baseDir = "/tmp/ccontext_repos";
    this.lifetime = lifetime;

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    // Set up periodic cleanup
    setInterval(() => this.cleanupExpiredRepositories(), 60 * 60 * 1000); // Run every hour
  }

  async createOrUpdateRepository(repoUrl: string, userId: string) {
    if (!validateGitHubUrl(repoUrl)) {
      throw new Error("Invalid GitHub URL");
    }

    const slug = await generateRepoSlug(repoUrl);
    const repoFilePath = getFileRepoPath(this.baseDir, slug);

    let repository = await prismadb.repository.findFirst({
      where: { slug },
    });

    const cloneRepo = async () => {
      await execAsync(`git clone ${repoUrl} ${repoFilePath}`);
    };

    if (repository) {
      console.log("Repository exists in the database");

      // Repository exists in the database, check if it exists on the file system
      if (!fs.existsSync(repoFilePath)) {
        // Repository doesn't exist on the file system, clone it
        console.log("Repository doesn't exist on the file system, clone it");

        await cloneRepo();
      } else {
        // Repository exists on the file system, do nothing
        console.log("Repository exists on the file system, do nothing");
      }
    } else {
      console.log("Repository doesn't exist in the database");
      // Repository doesn't exist in the database
      if (!fs.existsSync(repoFilePath)) {
        // Repository doesn't exist on the file system, clone it
        await cloneRepo;
      }

      // Create the repository entry in the database
      repository = await prismadb.repository.create({
        data: {
          slug: slug,
          url: repoUrl,
          userId: userId,
        },
      });
    }

    return repository;
  }

  async runCommand(
    repositoryId: string,
    command: string
  ): Promise<{ stdout: string; stderr: string }> {
    const repository = await prismadb.repository.findUnique({
      where: { slug: repositoryId },
    });

    if (!repository) {
      throw new Error("Repository not found");
    }

    console.log("Running command:", command);
    console.log("Repository:", repository);

    const repoPath = path.join(this.baseDir, repository.slug);

    // Sanitize the command input
    const sanitizedCommand = sanitizeInput(command);

    // Modify the command to ensure ccontext is only called once
    const modifiedCommand = sanitizedCommand.startsWith("ccontext")
      ? sanitizedCommand
      : `ccontext ${sanitizedCommand}`;

    const fullCommand = `cd ${repoPath} && ${modifiedCommand}`;

    // Update last accessed time
    await prismadb.repository.update({
      where: { slug: repositoryId },
      data: { updatedAt: new Date() },
    });

    return execAsync(fullCommand, { timeout: 10 * 60 * 1000 }); // 10 minute timeout
  }

  async cleanupExpiredRepositories(): Promise<void> {
    const expirationDate = new Date(Date.now() - this.lifetime * 1000);
    const expiredRepos = await prismadb.repository.findMany({
      where: { updatedAt: { lt: expirationDate } },
    });

    for (const repo of expiredRepos) {
      const repoPath = path.join(this.baseDir, repo.slug);
      if (fs.existsSync(repoPath)) {
        await fs.promises.rm(repoPath, { recursive: true, force: true });
      }
      await prismadb.repository.delete({ where: { slug: repo.slug } });
    }
  }

  async getRepository(repositoryId: string) {
    const repository = await prismadb.repository.findUnique({
      where: { slug: repositoryId },
    });
    return repository;
  }
}
