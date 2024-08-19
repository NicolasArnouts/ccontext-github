"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import ParsedFileTree from "@/components/ParsedFileTree";
import CalculatedTokens from "@/components/CalculatedTokens";
import { useGithubCContextStore } from "@/lib/store";
import { parseCommandOutput } from "@/lib/helpers-client";

interface GitHubCContextProps {
  onMarkdownGenerated: (content: string) => void;
}

const GitHubCContext: React.FC<GitHubCContextProps> = ({
  onMarkdownGenerated,
}) => {
  const {
    githubUrl,
    ccontextCommand,
    output,
    markdownContent,
    pdfExists,
    isLoading,
    envId,
    fileTree,
    calculatedTokens,
    setGithubUrl,
    setCcontextCommand,
    setOutput,
    setMarkdownContent,
    setPdfExists,
    setIsLoading,
    setEnvId,
    setFileTree,
    setCalculatedTokens,
  } = useGithubCContextStore();

  const { toast } = useToast();

  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
    console.log(e.target.value);
  };

  const handleCcontextCommandChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCcontextCommand(e.target.value);
  };

  const handleCloneAndRun = async () => {
    try {
      setIsLoading(true);
      setOutput("Processing...");
      setMarkdownContent(null);
      setPdfExists(false);
      setFileTree(null);
      setCalculatedTokens(null);
      const response = await axios.post("/api/clone-and-run", {
        githubUrl,
        ccontextCommand,
        envId,
      });
      const { fileTree, calculatedTokens } = parseCommandOutput(
        response.data.output
      );
      setOutput(response.data.output || response.data.error);
      setMarkdownContent(response.data.markdownContent || null);
      setPdfExists(response.data.pdfExists || false);
      setEnvId(response.data.repositoryId);
      setFileTree(fileTree);
      setCalculatedTokens(calculatedTokens);
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "An error occurred while processing your request.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setOutput(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const handleDownloadMarkdown = () => {
    if (markdownContent) {
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ccontext-output.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded!",
        description: "Markdown file has been downloaded.",
      });
    }
  };

  const handleDownloadPdf = () => {
    if (pdfExists && envId) {
      window.open(`/api/download-pdf?envId=${envId}`, "_blank");
      toast({
        title: "Downloaded!",
        description: "PDF file has been downloaded.",
      });
    }
  };

  const handleChatWithAI = () => {
    if (markdownContent) {
      onMarkdownGenerated(markdownContent);
    } else {
      toast({
        title: "No content available",
        description: "Please run a command to generate content first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter GitHub URL"
        id="github-url"
        value={githubUrl}
        onChange={handleGithubUrlChange}
        className="bg-background text-foreground"
      />
      <Input
        placeholder="CContext command"
        id="ccontext-command"
        value={ccontextCommand}
        onChange={handleCcontextCommandChange}
        className="bg-background text-foreground"
      />

      <Button
        onClick={handleCloneAndRun}
        className="flex w-full"
        disabled={isLoading}
      >
        {isLoading
          ? "Processing..."
          : envId
          ? "Run CContext"
          : "Clone and Run CContext"}
      </Button>
      <div className="w-full">
        <div>
          {calculatedTokens !== null && (
            <CalculatedTokens tokens={calculatedTokens} />
          )}
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            Command Output:
          </h3>
          <Textarea
            placeholder="Output will appear here..."
            value={output}
            readOnly
            className="h-64 font-mono text-sm mb-2 w-full bg-background text-foreground border-border"
          />
          {output && (
            <Button
              onClick={() => handleCopyToClipboard(output)}
              className="flex w-full mb-4"
            >
              Copy Output to Clipboard
            </Button>
          )}
        </div>
      </div>

      {fileTree && <ParsedFileTree fileTree={fileTree} />}

      {(markdownContent || pdfExists) && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            Generated Content:
          </h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {markdownContent && (
                <Button onClick={handleDownloadMarkdown} className="flex-grow">
                  Download Markdown
                </Button>
              )}
              {pdfExists && (
                <Button onClick={handleDownloadPdf} className="flex-grow">
                  Download PDF
                </Button>
              )}
              <Button onClick={handleChatWithAI} className="flex-grow">
                Chat with AI
              </Button>
            </div>
          </div>
        </div>
      )}
      {envId && (
        <div>
          <p className="text-foreground">Active Environment ID: {envId}</p>
        </div>
      )}
    </div>
  );
};

export default GitHubCContext;
