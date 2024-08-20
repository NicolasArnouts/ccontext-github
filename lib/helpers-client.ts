"use client";

import { getEncoding } from "js-tiktoken";

const encoding = getEncoding("cl100k_base");

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

export function getInputTokens(input: string): number {
  const tokens = encoding.encode(input).length;

  return tokens;
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
  const fileTreeRegex = /📁[\s\S]*?Total context size:/;
  const match = output.match(fileTreeRegex);
  return match ? match[0].trim() : null;
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
