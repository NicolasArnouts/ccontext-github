"use client";

import { getEncoding } from "js-tiktoken";
import { ChatCompletionMessage } from "openai/resources/index.mjs";
import { Message } from "@/lib/store";
import { ChatMessage } from "@prisma/client";
import { useMemo } from "react";

export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => Promise<ReturnType<F>> {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise((resolve) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
}

export async function getClientIpAddress(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "unknown";
  }
}

export function cleanIpAddress(ip: string): string {
  return ip.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function extractFileTreeFromOutput(output: string): string | null {
  const lines = output.split("\n");
  const fileTreeLines = lines.filter(
    (line) =>
      line.trim().startsWith("📁") ||
      line.trim().startsWith("📄") ||
      line.trim().startsWith("[Excluded]")
  );
  return fileTreeLines.length > 0 ? fileTreeLines.join("\n") : null;
}

export function parseCommandOutput(output: string) {
  const fileTree = extractFileTreeFromOutput(output);
  const calculatedTokens = extractCalculatedTokens(output);
  return { fileTree, calculatedTokens };
}

export function extractCalculatedTokens(output: string): number | null {
  const tokenRegex = /Total context size:\s*(\d+)/;
  const match = output.match(tokenRegex);
  return match ? parseInt(match[1], 10) : null;
}

export function concatenateMessages(messages: Message[]): string {
  return messages
    .map((message) => {
      const rolePrefix =
        message.role === "user"
          ? "User: "
          : message.role === "assistant"
          ? "Assistant: "
          : "System: ";
      return `${rolePrefix}${message.content}`;
    })
    .join("\n\n");
}

const encoding = getEncoding("cl100k_base");

export function getInputTokens(
  messages: ChatMessage | ChatMessage[] | string
): number {
  const processMessage = (message: ChatMessage): number => {
    try {
      // Remove or replace problematic tokens
      const cleanContent = message.content.replace(/<\|endoftext\|>/g, "");
      return encoding.encode(cleanContent).length;
    } catch (error) {
      console.warn("Error encoding message:", error);
      // Fallback to a simple character count if encoding fails
      return message.content.length;
    }
  };

  try {
    if (typeof messages === "string") {
      const cleanMessage = messages.replace(/<\|endoftext\|>/g, "");
      return encoding.encode(cleanMessage).length;
    } else if (Array.isArray(messages)) {
      return messages.reduce(
        (acc, message) => acc + processMessage(message),
        0
      );
    } else {
      return processMessage(messages);
    }
  } catch (error) {
    console.warn("Error in getInputTokens:", error);
    // Fallback to a simple character count if encoding fails
    if (typeof messages === "string") {
      return messages.length;
    } else if (Array.isArray(messages)) {
      return messages.reduce((acc, message) => acc + message.content.length, 0);
    } else {
      return messages.content.length;
    }
  }
}

export const TOKEN_WARNING_THRESHOLD = 100_000;
