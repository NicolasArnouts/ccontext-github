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
  extractFileTreeFromOutput,
} from "@/lib/helpers";

const execAsync = promisify(exec);

export class TempEnvManager {
  private baseDir: string;
  private lifetime: number;

  constructor(lifetime = 12 * 60 * 60) {
    // 12 hours default lifetime
    // Use TEMP_ENV_BASE_DIR environment variable if set, otherwise use a default path
    this.baseDir =
      process.env.TEMP_ENV_BASE_DIR ||
      path.join(process.cwd(), "temp_environments");
    this.lifetime = lifetime;

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    console.log(`TempEnvManager initialized with baseDir: ${this.baseDir}`);

    // Set up periodic cleanup
    setInterval(() => this.cleanupExpiredRepositories(), 60 * 60 * 1000); // Run every hour
  }

  private getUserDir(userId: string | null): string {
    const dirName = userId || "anonymous";
    const userDir = path.join(this.baseDir, dirName);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true, mode: 0o755 });
    }
    return userDir;
  }

  private getRepoPath(userId: string | null, repoSlug: string): string {
    const userDir = this.getUserDir(userId);
    return path.join(userDir, repoSlug);
  }

  async createOrUpdateRepository(repoUrl: string, userId: string | null) {
    validateGitHubUrl(repoUrl);

    const slug = await generateRepoSlug(repoUrl);
    const userDir = this.getUserDir(userId);
    const repoFilePath = path.join(userDir, slug);

    let repository = userId
      ? await prismadb.repository.findFirst({
          where: { slug, userId },
        })
      : null;

    // inner function for cloning the repository
    const cloneRepo = async () => {
      console.log(`cloning repo to ${repoFilePath}`);
      await execAsync(`git clone ${repoUrl} ${repoFilePath}`);
    };

    if (repository) {
      console.log("Repository exists in the database");

      // Repository exists in the database, check if it exists on the file system
      if (!this.repoExistsInFileSystem(slug, userId)) {
        console.log("Repository doesn't exist on the file system, cloning it");
        await cloneRepo();
      } else {
        console.log("Repository exists on the file system, no action needed");
      }
    } else {
      console.log("Repository doesn't exist in the database");
      // Repository doesn't exist in the database
      if (!this.repoExistsInFileSystem(slug, userId)) {
        await cloneRepo();
      }
    }

    // Always update or create the repository entry in the database if userId is provided
    if (userId) {
      repository = await prismadb.repository.upsert({
        where: {
          slug: slug,
        },
        update: {
          url: repoUrl,
          userId: userId,
        },
        create: {
          slug: slug,
          url: repoUrl,
          userId: userId,
        },
      });

      console.log("Repository upserted:", repository);
    } else {
      repository = { slug, url: repoUrl, userId: null };
      console.log("Anonymous repository created:", repository);
    }

    return repository;
  }

  repoExistsInFileSystem(slug: string, userId: string | null): boolean {
    const repoPath = this.getRepoPath(userId, slug);
    const isExisting = fs.existsSync(repoPath);

    if (isExisting) {
      console.log("Repository exists in the file system");
    }

    return isExisting;
  }

  async runCommand(
    repositoryId: string,
    command: string,
    userId: string | null
  ): Promise<{
    stdout: string;
    stderr: string;
    markdownContent?: string;
    fileTree?: string;
  }> {
    let repository;
    if (userId) {
      repository = await prismadb.repository.findFirst({
        where: { slug: repositoryId, userId },
      });
    } else {
      const repoPath = this.getRepoPath(null, repositoryId);
      if (fs.existsSync(repoPath)) {
        repository = { slug: repositoryId, url: "", userId: null };
      }
    }

    if (!repository) {
      console.log(
        `Repository not found: ${repositoryId} for user ${
          userId || "anonymous"
        }`
      );
      throw new Error("Repository not found for this user");
    }

    console.log("Running command:", command);
    console.log("Repository:", repository);

    const repoPath = this.getRepoPath(userId, repository.slug);

    const repoExists = this.repoExistsInFileSystem(repository.slug, userId);

    console.log("repoExists:", repoExists);

    if (!repoExists) {
      console.log("Repository doesn't exist in the file system, creating it");
      await this.createOrUpdateRepository(repository.url, userId);
    }

    // Sanitize the command input
    let sanitizedCommand = sanitizeInput(command);

    // Modify the command to ensure ccontext is only called once
    const modifiedCommand = sanitizedCommand.startsWith("ccontext")
      ? sanitizedCommand
      : `ccontext ${sanitizedCommand}`;

    const fullCommand = `cd ${repoPath} && ${modifiedCommand} -gm -g`;

    // Update last accessed time if userId is provided
    if (userId) {
      await prismadb.repository.update({
        where: { slug: repositoryId },
        data: { updatedAt: new Date() },
      });
    }

    const result = await execAsync(fullCommand);

    // Extract file tree from the command output
    const fileTree = extractFileTreeFromOutput(result.stdout);

    // Get markdown content if it exists
    const markdownContent = await this.getMarkdownIfExists(repoPath);

    return { ...result, markdownContent, fileTree };
  }

  async getMarkdownIfExists(repoPath: string): Promise<string | undefined> {
    console.log("repoPath:", repoPath);

    const markdownPath = path.join(repoPath, "ccontext-output.md");

    console.log("markdownPath", markdownPath);

    if (fs.existsSync(markdownPath)) {
      console.log("Markdown file exists");

      let markdownContent = "";

      try {
        markdownContent = await fs.promises.readFile(markdownPath, "utf-8");
      } catch (error) {
        console.error("Error reading markdown file:", error);
      }

      return markdownContent;
    }
    console.log("Markdown file does not exist");

    return undefined;
  }

  async cleanupExpiredRepositories(): Promise<void> {
    const expirationDate = new Date(Date.now() - this.lifetime * 1000);
    const expiredRepos = await prismadb.repository.findMany({
      where: { updatedAt: { lt: expirationDate } },
    });

    for (const repo of expiredRepos) {
      const userDir = this.getUserDir(repo.userId);
      const repoPath = path.join(userDir, repo.slug);
      if (fs.existsSync(repoPath)) {
        await fs.promises.rm(repoPath, { recursive: true, force: true });
      }
      await prismadb.repository.delete({ where: { slug: repo.slug } });
    }

    // Cleanup anonymous repositories
    const anonymousDir = this.getUserDir(null);
    if (fs.existsSync(anonymousDir)) {
      const anonymousRepos = await fs.promises.readdir(anonymousDir);
      for (const repo of anonymousRepos) {
        const repoPath = path.join(anonymousDir, repo);
        const stats = await fs.promises.stat(repoPath);
        if (stats.mtime.getTime() < expirationDate.getTime()) {
          await fs.promises.rm(repoPath, { recursive: true, force: true });
        }
      }
    }
  }

  async getRepository(repositoryId: string, userId: string | null) {
    if (userId) {
      return await prismadb.repository.findFirst({
        where: { slug: repositoryId, userId },
      });
    } else {
      const repoPath = this.getRepoPath(null, repositoryId);
      if (fs.existsSync(repoPath)) {
        return { slug: repositoryId, url: "", userId: null };
      }
      return null;
    }
  }
}
