import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import prismadb from "@/lib/prismadb";
import { validateGitHubUrl, generateRepoSlug } from "@/lib/helpers";

const execAsync = promisify(exec);

export class TempEnvManager {
  private baseDir: string;
  private lifetime: number;

  constructor(lifetime = 12 * 60 * 60) {
    // 12 hours default lifetime
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
    if (userId?.startsWith("anon")) {
      userId = "anonymous";
    }
    const dirName = userId || "anonymous";
    const userDir = path.join(this.baseDir, dirName);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true, mode: 0o755 });
    }
    return userDir;
  }

  public getRepoPath(userId: string | null, repoSlug: string): string {
    const userDir = this.getUserDir(userId);
    return path.join(userDir, repoSlug);
  }

  cloneRepo = async (repoUrl: string, repoFilePath: string) => {
    console.log(`cloning repo to ${repoFilePath}`);
    await execAsync(`git clone ${repoUrl} ${repoFilePath}`);
  };

  async createOrUpdateRepository(repoUrl: string, userId: string) {
    validateGitHubUrl(repoUrl);

    const slug = await generateRepoSlug(repoUrl);
    const userDir = this.getUserDir(userId);
    const repoFilePath = path.join(userDir, slug);

    if (userId) {
      const anonymousSession = await prismadb.anonymousSession.findUnique({
        where: { sessionId: userId },
      });

      if (!anonymousSession) {
        await prismadb.anonymousSession.create({
          data: {
            sessionId: userId,
            ipAddress: "unknown",
          },
        });
        console.log(`Anonymous session created with ID: ${userId}`);
      }
    }

    let repository = userId
      ? await prismadb.repository.findFirst({
          where: { slug, userId },
        })
      : null;

    if (repository) {
      console.log("Repository exists in the database");

      if (!this.repoExistsInFileSystem(slug, userId)) {
        console.log("Repository doesn't exist on the file system, cloning it");
        await this.cloneRepo(repoUrl, repoFilePath);
      } else {
        console.log("Repository exists on the file system, no action needed");
      }
    } else {
      console.log("Repository doesn't exist in the database");
      if (!this.repoExistsInFileSystem(slug, userId)) {
        await this.cloneRepo(repoUrl, repoFilePath);
      }
    }

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

  // New method to be called from the API route
  async cleanupExpiredEnvironments(): Promise<void> {
    await this.cleanupExpiredRepositories();
  }
}
