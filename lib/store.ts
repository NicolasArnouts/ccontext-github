import { create } from "zustand";

interface GithubCContextState {
  githubUrl: string;
  ccontextCommand: string;
  output: string;
  markdownContent: string | null;
  pdfExists: boolean;
  isLoading: boolean;
  envId: string | null;
  tokenCost: number;
  setTokenCost: (cost: number) => void;
  setGithubUrl: (url: string) => void;
  setCcontextCommand: (command: string) => void;
  setOutput: (output: string) => void;
  setMarkdownContent: (content: string | null) => void;
  setPdfExists: (exists: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setEnvId: (id: string | null) => void;
}

export const useGithubCContextStore = create<GithubCContextState>((set) => ({
  githubUrl: "",
  ccontextCommand: "ccontext -gm",
  output: "",
  markdownContent: null,
  pdfExists: false,
  isLoading: false,
  envId: null,
  tokenCost: 0,
  setTokenCost: (cost) => set({ tokenCost: cost }),
  setGithubUrl: (url) => set({ githubUrl: url }),
  setCcontextCommand: (command) => set({ ccontextCommand: command }),
  setOutput: (output) => set({ output }),
  setMarkdownContent: (content) => set({ markdownContent: content }),
  setPdfExists: (exists) => set({ pdfExists: exists }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setEnvId: (id) => set({ envId: id }),
}));
