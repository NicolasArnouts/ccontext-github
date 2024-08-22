import axios from "axios";
import path from "path";
import prisma from "@/lib/prismadb";
import { ChatMessage } from "@prisma/client";
import { encoding_for_model } from "tiktoken";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export interface UserInfo {
  id: string;
  isAnonymous: boolean;
}

export async function getUserInfo(req: NextRequest): Promise<UserInfo> {
  const { userId } = auth();

  if (userId) {
    return { id: userId, isAnonymous: false };
  } else {
    const clientIp = getClientIpAddress(req);
    const cleanedIp = cleanIpAddress(clientIp);
    const anonymousId = `anon_${cleanedIp}`;

    await prisma.anonymousSession.upsert({
      where: { sessionId: anonymousId },
      update: { updatedAt: new Date() },
      create: {
        sessionId: anonymousId,
        ipAddress: clientIp,
      },
    });

    return { id: anonymousId, isAnonymous: true };
  }
}

export async function getOrCreateUserTokens(
  userInfo: UserInfo,
  modelId: string
) {
  if (userInfo.isAnonymous) {
    return prisma.userTokens.upsert({
      where: {
        anonymousSessionId_modelId: {
          anonymousSessionId: userInfo.id,
          modelId,
        },
      },
      update: {},
      create: {
        anonymousSessionId: userInfo.id,
        modelId,
        tokensLeft: 1000,
      },
    });
  } else {
    return prisma.userTokens.upsert({
      where: {
        userId_modelId: {
          userId: userInfo.id,
          modelId,
        },
      },
      update: {},
      create: {
        userId: userInfo.id,
        modelId,
        tokensLeft: 1000,
      },
    });
  }
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters while preserving wcmatch patterns
  return input.replace(/[;&`$()]/g, "").replace(/\\/g, "\\\\");
}

export function validateGitHubUrl(url: string): boolean {
  const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
  const isValid = githubUrlRegex.test(url);

  if (!isValid) {
    throw new Error(
      "Invalid GitHub URL. Please ensure it follows the format: https://github.com/username/repository"
    );
  }

  return isValid;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function extractRepoInfo(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
    };
  }
  return null;
}

export async function getLatestCommitFromGitHub(
  repoUrl: string
): Promise<string> {
  if (!validateGitHubUrl(repoUrl)) {
    throw new Error("Invalid GitHub URL");
  }

  const repoInfo = extractRepoInfo(repoUrl);
  if (!repoInfo) {
    throw new Error("Failed to extract repository information from URL");
  }

  const { owner, repo } = repoInfo;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/main`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CContext-App",
      },
    });

    if (response.data && response.data.sha) {
      return response.data.sha;
    } else {
      throw new Error("Unable to find commit SHA in the GitHub API response");
    }
  } catch (error) {
    console.error("Error fetching latest commit from GitHub:", error);
    throw new Error("Failed to fetch latest commit from GitHub");
  }
}

export async function generateRepoSlug(url: string): Promise<string> {
  const repoInfo = extractRepoInfo(url);
  if (!repoInfo) {
    throw new Error("Invalid GitHub URL");
  }

  const { owner, repo } = repoInfo;
  const baseSlug = `${owner}-${repo}`;
  const latestCommit = await getLatestCommitFromGitHub(url);

  return `${baseSlug}-${latestCommit}`.toLowerCase();
}

export function getFileRepoPath(baseDir: string, slug: string): string {
  return path.join(baseDir, slug);
}

export function extractFileTreeContent(markdownContent: string): string | null {
  const fileTreeRegex = /## FILE TREE ##([\s\S]*?)## END FILE TREE ##/;
  const match = markdownContent.match(fileTreeRegex);

  if (match) {
    return match[1].trim();
  }

  return null;
}

export function extractFileTreeFromOutput(output: string): string | null {
  const fileTreeRegex = /📁[\s\S]*?Total context size:/;
  const match = output.match(fileTreeRegex);
  return match ? match[0].trim() : null;
}

export function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, "");
}

const encoder = encoding_for_model("gpt-4o-mini");
export function getInputTokens(
  messages: ChatMessage | ChatMessage[] | string
): number {
  const processMessage = (message: ChatMessage): number => {
    return encoder.encode(message.content).length;
  };

  if (typeof messages === "string") {
    return encoder.encode(messages).length;
  } else if (Array.isArray(messages)) {
    return messages.reduce((acc, message) => acc + processMessage(message), 0);
  } else {
    return processMessage(messages);
  }
}

export function getClientIpAddress(req: NextRequest): string {
  const ip =
    req.ip ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  if (ip === "unknown") {
    console.warn("Unable to determine client IP address");
  }

  return ip;
}

export function cleanIpAddress(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export async function getUserId(req: NextRequest): Promise<string> {
  const userInfo = await getUserInfo(req);
  return userInfo.id;
}

export function isAnonUser(userId: string): boolean {
  return userId.startsWith("anon_");
}
