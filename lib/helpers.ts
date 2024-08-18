import axios from "axios";
import path from "path";
import prisma from "@/lib/prismadb";
import { ChatMessage } from "@prisma/client";
import { encoding_for_model } from "tiktoken";
import { NextRequest } from "next/server";
import { NextApiRequest } from "next";

/**
 * Sanitizes input by removing potentially harmful characters.
 * @param input The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[;&|`$()]/g, "");
}

/**
 * Validates if a given URL is a valid GitHub repository URL.
 * @param url The URL to validate
 * @returns True if the URL is a valid GitHub repository URL, false otherwise
 */
export function validateGitHubUrl(url: string): boolean {
  const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
  const isgood = githubUrlRegex.test(url);

  if (!isgood) {
    throw new Error(
      "Invalid GitHub URL. Please ensure it follows the format: https://github.com/username/repository"
    );
  }

  return isgood;
}

/**
 * Gets the file extension from a filename.
 * @param filename The filename to extract the extension from
 * @returns The file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Formats a number of bytes into a human-readable string.
 * @param bytes The number of bytes
 * @param decimals The number of decimal places to show (default: 2)
 * @returns A formatted string representing the file size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Extracts the repository name and owner from a GitHub URL.
 * @param url The GitHub URL
 * @returns An object containing the owner and repo name, or null if invalid
 */
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

/**
 * Fetches the latest commit SHA from a GitHub repository.
 * @param repoUrl The GitHub repository URL
 * @returns The latest commit SHA
 * @throws Error if unable to fetch the commit SHA
 */
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

  const finalSlug = `${baseSlug}-${latestCommit}`.toLowerCase();

  return finalSlug;
}

export function getFileRepoPath(baseDir: string, slug: string): string {
  return path.join(baseDir, slug);
}

// Add any other utility functions your application might need

export function extractFileTreeContent(markdownContent: string): string | null {
  const fileTreeRegex = /## FILE TREE ##([\s\S]*?)## END FILE TREE ##/;
  const match = markdownContent.match(fileTreeRegex);

  if (match) {
    return match[1].trim();
  }

  return null;
}

/**
 * Strips ANSI color codes from a string.
 * @param str The string to strip ANSI codes from
 * @returns The string without ANSI codes
 */
export function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, "");
}

export function extractFileTreeFromOutput(output: string): string | null {
  const startMarker = " 📁";
  const endMarker = "Total context size:";

  const startIndex = output.indexOf(startMarker);
  if (startIndex === -1) return null;

  const endIndex = output.indexOf(endMarker, startIndex);
  if (endIndex === -1) return null;

  const fileTree = output.substring(startIndex, endIndex).trim();
  return fileTree;
}

export function getInputTokens(
  messages: ChatMessage | ChatMessage[] | string
): number {
  const encoder = encoding_for_model("gpt-4o-mini");

  // inner function for processing a single message
  const processMessage = (message: ChatMessage): number => {
    return encoder.encode(message.content).length;
  };

  console.log("messages", messages);

  if (typeof messages === "string") {
    return encoder.encode(messages).length;
  } else if (Array.isArray(messages)) {
    return messages.reduce((acc, message) => acc + processMessage(message), 0);
  } else {
    return processMessage(messages);
  }
}

export function getClientIpAddress(req: NextRequest | Request): string {
  let ip: string | null;

  if (req instanceof NextRequest) {
    ip = req.ip ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  } else {
    const forwardedFor = req.headers.get("x-forwarded-for");
    ip = forwardedFor ? forwardedFor.split(",")[0] : null;
  }

  if (!ip) {
    console.warn("Unable to determine client IP address");
    return "unknown";
  }

  return ip;
}

export function cleanIpAddress(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export async function getOrCreateUserTokens(
  userId: string | null,
  modelId: string
) {
  if (userId) {
    return prisma.userTokens.upsert({
      where: { userId_modelId: { userId, modelId } },
      update: {},
      create: { userId, modelId, tokensLeft: 1000 },
    });
  } else {
    throw new Error("Cannot create user tokens without a userId");
  }
}

export async function getOrCreateAnonymousUserTokens(
  anonymousId: string,
  modelId: string
) {
  let anonymousSession = await prisma.anonymousSession.findUnique({
    where: { sessionId: anonymousId },
    include: { userTokens: true },
  });

  if (!anonymousSession) {
    throw new Error("Anonymous session not found");
  }

  const userTokens = anonymousSession.userTokens.find(
    (ut) => ut.modelId === modelId
  );

  if (userTokens) {
    return userTokens;
  } else {
    return prisma.userTokens.create({
      data: {
        modelId,
        tokensLeft: 1000,
        anonymousSessionId: anonymousSession.id,
      },
    });
  }
}

export async function getOrCreateAnonymousUser(
  req: NextRequest | Request
): Promise<string> {
  const clientIp = getClientIpAddress(req);

  if (!clientIp) {
    throw new Error("Unable to determine client IP address");
  }

  const cleanIp = cleanIpAddress(clientIp);
  const anonymousId = `anon_${cleanIp}`;

  const anonymousSession = await prisma.anonymousSession.upsert({
    where: { sessionId: anonymousId },
    update: { updatedAt: new Date() },
    create: {
      sessionId: anonymousId,
      ipAddress: clientIp,
    },
  });

  return anonymousSession.sessionId;
}
