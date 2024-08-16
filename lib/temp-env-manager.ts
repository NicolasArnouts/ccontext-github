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
  extractFileTreeContent,
  extractFileTreeFromOutput,
} from "@/lib/helpers";

const execAsync = promisify(exec);

export class TempEnvManager {
  private baseDir: string;
  private lifetime: number;

  constructor(lifetime = 12 * 60 * 60) {
    // 12 hours default lifetime
    this.baseDir =
      "/Users/narn/Desktop/school/ccontext-github/temp_environments";
    this.lifetime = lifetime;

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    // Set up periodic cleanup
    setInterval(() => this.cleanupExpiredRepositories(), 60 * 60 * 1000); // Run every hour
  }

  private getUserDir(userId: string): string {
    const userDir = path.join(this.baseDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }

  private getRepoPath(userId: string, repoSlug: string): string {
    const userDir = this.getUserDir(userId);
    const repoPath = path.join(userDir, repoSlug);

    return repoPath;
  }

  async createOrUpdateRepository(repoUrl: string, userId: string) {
    if (!validateGitHubUrl(repoUrl)) {
      throw new Error("Invalid GitHub URL");
    }

    const slug = await generateRepoSlug(repoUrl);
    const userDir = this.getUserDir(userId);
    const repoFilePath = path.join(userDir, slug);

    let repository = await prismadb.repository.findFirst({
      where: { slug, userId },
    });

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

  repoExistsInFileSystem(slug: string, userId: string): boolean {
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
    userId: string
  ): Promise<{
    stdout: string;
    stderr: string;
    markdownContent?: string;
    fileTree?: string;
  }> {
    const repository = await prismadb.repository.findFirst({
      where: { slug: repositoryId, userId },
    });

    if (!repository) {
      throw new Error("Repository not found for this user");
    }

    console.log("Running command:", command);
    console.log("Repository:", repository);

    const userDir = this.getUserDir(userId);
    const repoPath = path.join(userDir, repository.slug);

    const repoExists = this.repoExistsInFileSystem(repository.slug, userId);

    console.log("repoExists:", repoExists);

    // Sanitize the command input
    let sanitizedCommand = sanitizeInput(command);

    // Modify the command to ensure ccontext is only called once
    const modifiedCommand = sanitizedCommand.startsWith("ccontext")
      ? sanitizedCommand
      : `ccontext ${sanitizedCommand}`;

    const fullCommand = `cd ${repoPath} && ${modifiedCommand} -gm -g`;

    // Update last accessed time
    await prismadb.repository.update({
      where: { slug: repositoryId },
      data: { updatedAt: new Date() },
    });

    const result = await execAsync(fullCommand);

    // Extract file tree from the command output
    const fileTree = extractFileTreeFromOutput(result.stdout) || "";

    // Get markdown content if it exists
    const markdownContent = await this.getMarkdownIfExists(repoPath);

    return { ...result, markdownContent, fileTree };
  }

  async getMarkdownIfExists(repoPath: string): Promise<string | undefined> {
    console.log("repoPath:", repoPath);

    const markdownPath = path.join(repoPath, "ccontext-output.md");

    console.log("markdownPath", markdownPath);

    if (fs.existsSync(markdownPath)) {
      console.log("IT EXISTSSSSWS!!!!!!!!!!!");

      let markdownContent = "";

      try {
        markdownContent = await fs.promises.readFile(markdownPath, "utf-8");
      } catch (error) {
        console.error("Error reading markdown file:", error);
      }

      return markdownContent;
    }
    console.log("IT does not exist ;((");

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
  }

  async getRepository(repositoryId: string, userId: string) {
    const repository = await prismadb.repository.findFirst({
      where: { slug: repositoryId, userId },
    });
    return repository;
  }
}
