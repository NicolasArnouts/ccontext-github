// lib/store.ts
import { create } from "zustand";
import { Model } from "@prisma/client";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GithubCContextState {
  // GitHub CContext related state
  githubUrl: string;
  ccontextCommand: string;
  output: string;
  markdownContent: string | null;
  pdfExists: boolean;
  isLoading: boolean;
  envId: string | null;
  fileTree: string | null;
  calculatedTokens: number | null;

  // Chat interface related state
  selectedModel: string;
  models: Model[];
  messages: Message[];

  // Token related state
  tokensLeft: Record<string, number>;
  tokenCost: number;

  // GitHub CContext actions
  setGithubUrl: (url: string) => void;
  setCcontextCommand: (command: string) => void;
  setOutput: (output: string) => void;
  setMarkdownContent: (content: string | null) => void;
  setPdfExists: (exists: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setEnvId: (id: string | null) => void;
  setFileTree: (fileTree: string | null) => void;
  setCalculatedTokens: (tokens: number | null) => void;

  // Chat interface actions
  setSelectedModel: (modelId: string) => void;
  setModels: (models: Model[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;

  // Token related actions
  setTokensLeft: (modelId: string, amount: number) => void;
  setTokenCost: (cost: number) => void;
  deductTokens: (modelId: string, amount: number) => void;
}

export const useGithubCContextStore = create<GithubCContextState>((set) => ({
  // Initial state
  githubUrl: "",
  ccontextCommand: "ccontext -gm",
  output: "",
  markdownContent: null,
  pdfExists: false,
  isLoading: false,
  envId: null,
  fileTree: null,
  calculatedTokens: null,
  selectedModel: "",
  models: [],
  messages: [],
  tokensLeft: {},
  tokenCost: 0,

  // GitHub CContext actions
  setGithubUrl: (url) => set({ githubUrl: url }),
  setCcontextCommand: (command) => set({ ccontextCommand: command }),
  setOutput: (output) => set({ output }),
  setMarkdownContent: (content) => set({ markdownContent: content }),
  setPdfExists: (exists) => set({ pdfExists: exists }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setEnvId: (id) => set({ envId: id }),
  setFileTree: (fileTree) => set({ fileTree }),
  setCalculatedTokens: (tokens) => set({ calculatedTokens: tokens }),

  // Chat interface actions
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  setModels: (models) => set({ models }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateLastMessage: (content) =>
    set((state) => {
      const updatedMessages = [...state.messages];
      if (updatedMessages.length > 0) {
        updatedMessages[updatedMessages.length - 1].content += content;
      }
      return { messages: updatedMessages };
    }),
  clearMessages: () => set({ messages: [] }),

  // Token related actions
  setTokensLeft: (modelId: string, amount: number) =>
    set((state) => ({
      tokensLeft: {
        ...state.tokensLeft,
        [modelId]: amount,
      },
    })),
  setTokenCost: (cost) => set({ tokenCost: cost }),
  deductTokens: (modelId, amount) =>
    set((state) => ({
      tokensLeft: {
        ...state.tokensLeft,
        [modelId]: (state.tokensLeft[modelId] || 0) - amount,
      },
    })),
}));

// User-related state
interface UserState {
  userId: string | null;
  anonymousId: string | null;
  setUserId: (id: string | null) => void;
  setAnonymousId: (id: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  anonymousId: null,
  setUserId: (id) => set({ userId: id }),
  setAnonymousId: (id) => set({ anonymousId: id }),
}));
