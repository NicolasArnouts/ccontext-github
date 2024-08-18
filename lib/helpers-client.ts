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

import { getEncoding } from "js-tiktoken";
export function getInputTokens(input: string): number {
  const encoding = getEncoding("cl100k_base");

  const tokens = encoding.encode(input).length;

  console.log("getInputTokens tokens", tokens);

  return tokens;
}
