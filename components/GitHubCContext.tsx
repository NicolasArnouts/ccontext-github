import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import FileTree from "@/components/FileTree";

interface GitHubCContextProps {
  onMarkdownGenerated: (content: string) => void;
}

const GitHubCContext: React.FC<GitHubCContextProps> = ({
  onMarkdownGenerated,
}) => {
  const [githubUrl, setGithubUrl] = useState("");
  const [ccontextCommand, setCcontextCommand] = useState("ccontext -gm");
  const [output, setOutput] = useState("");
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [pdfExists, setPdfExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [envId, setEnvId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
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
      const response = await axios.post("/api/clone-and-run", {
        githubUrl,
        ccontextCommand,
        envId,
      });
      setOutput(response.data.output || response.data.error);
      setMarkdownContent(response.data.markdownContent || null);
      setPdfExists(response.data.pdfExists || false);
      setEnvId(response.data.repositoryId);

      if (response.data.markdownContent) {
        onMarkdownGenerated(response.data.markdownContent);
      }
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
      // Send markdown content as a system message
      onMarkdownGenerated(markdownContent);

      // Simulate sending the content to the AI and getting a response
      // In a real scenario, you'd make an API call here
      setTimeout(() => {
        const aiResponse =
          "I've received the markdown content. How can I help you with it?";
        setOutput(aiResponse);
      }, 1000);

      toast({
        title: "Chat Initialized",
        description:
          "You can now chat with the AI about the generated content.",
      });
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
        value={githubUrl}
        onChange={handleGithubUrlChange}
        className="bg-background text-foreground"
      />
      <Input
        placeholder="CContext command"
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

      {(markdownContent || pdfExists) && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            Generated Content:
          </h3>
          <div className="flex space-x-2 mb-4">
            {markdownContent && (
              <Button onClick={handleDownloadMarkdown} className="flex-1">
                Download Markdown
              </Button>
            )}
            {pdfExists && (
              <Button onClick={handleDownloadPdf} className="flex-1">
                Download PDF
              </Button>
            )}
            <Button onClick={handleChatWithAI} className="flex-1">
              Chat with AI
            </Button>
          </div>
          {markdownContent && <FileTree markdownContent={markdownContent} />}
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
