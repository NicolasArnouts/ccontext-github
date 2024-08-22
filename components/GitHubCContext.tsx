import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import ParsedFileTree from "@/components/ParsedFileTree";
import { useGithubCContextStore } from "@/lib/store";
import { parseCommandOutput } from "@/lib/helpers-client";
import CommandOutput from "@/components/CommandOutput";
import { useChatInterface } from "@/components/chatbot/ChatInterface";

interface GitHubCContextProps {
  onMarkdownGenerated: (content: string) => void;
}

const GitHubCContext: React.FC<GitHubCContextProps> = ({
  onMarkdownGenerated,
}) => {
  const {
    githubUrl,
    markdownContent,
    pdfExists,
    isLoading,
    envId,
    fileTree,
    calculatedTokens,
    messages,
    selectedModel,
    setGithubUrl,
    setMarkdownContent,
    setPdfExists,
    setIsLoading,
    setEnvId,
    setFileTree,
    setCalculatedTokens,
    setMessages,
  } = useGithubCContextStore();

  const [maxTokens, setMaxTokens] = useState("100000");
  const [includes, setIncludes] = useState("");
  const [excludes, setExcludes] = useState("");
  const [isCloned, setIsCloned] = useState(false);
  const [output, setOutput] = useState("");

  const { toast } = useToast();
  const { handleSendMessage } = useChatInterface();

  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
  };

  const handleClone = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/clone", { githubUrl });
      setEnvId(response.data.repositoryId);
      setIsCloned(true);
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "An error occurred while cloning the repository.";
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

  const handleRunCContext = async () => {
    try {
      setIsLoading(true);
      setMarkdownContent(null);
      setPdfExists(false);
      setFileTree(null);
      setCalculatedTokens(null);

      let cmdOutput = "";

      const params = {
        envId,
        includes,
        excludes,
        maxTokens,
      };

      const eventSource = new EventSource(
        `/api/run-ccontext?${new URLSearchParams(params).toString()}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.output) {
          cmdOutput += data.output;
          setOutput(cmdOutput);
          const { fileTree, calculatedTokens } = parseCommandOutput(cmdOutput);
          if (fileTree) {
            console.log("File tree found!", fileTree);
            setFileTree(fileTree);
          }
          if (calculatedTokens) {
            console.log("calculatedTokens", calculatedTokens);
            setCalculatedTokens(calculatedTokens);
          }
        } else if (data.status === "success") {
          fetchFinalResult();
        } else if (data.status === "error") {
          toast({
            title: "Error",
            description: `CContext command failed with code ${data.code}`,
            variant: "destructive",
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setIsLoading(false);
      };

      eventSource.addEventListener("close", () => {
        console.log('EventSource "close" event');
        eventSource.close();
        setIsLoading(false);
        const { fileTree, calculatedTokens } = parseCommandOutput(output);
        setFileTree(fileTree);
        setCalculatedTokens(calculatedTokens);
        fetchFinalResult();
      });
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "An error occurred while running CContext.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setOutput(errorMessage);
      setIsLoading(false);
    }
  };

  const fetchFinalResult = async () => {
    try {
      const response = await axios.get(`/api/ccontext-result?envId=${envId}`);
      setMarkdownContent(response.data.markdownContent || null);
      setPdfExists(response.data.pdfExists || false);
    } catch (error) {
      console.error("Error fetching final result:", error);
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
      setMessages([...messages, { role: "user", content: markdownContent }]);
      // handleSendMessage(markdownContent, selectedModel);
    } else {
      toast({
        title: "No content available",
        description: "Please run CContext to generate content first.",
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
      <Button
        onClick={handleClone}
        className="flex w-full"
        disabled={isLoading}
      >
        {isLoading ? "Cloning..." : "Clone Repository"}
      </Button>

      {isCloned && (
        <>
          <Input
            placeholder="Excludes (separated by |) e.g. *.md|*.txt|**/node_modules/*"
            id="excludes"
            value={excludes}
            onChange={(e) => setExcludes(e.target.value)}
            className="bg-background text-foreground"
          />
          <Input
            placeholder="Includes (separated by |) e.g. *.md|*.txt|**/node_modules/*"
            id="includes"
            value={includes}
            onChange={(e) => setIncludes(e.target.value)}
            className="bg-background text-foreground"
          />
          <Button
            onClick={handleRunCContext}
            className="flex w-full"
            disabled={isLoading}
          >
            {isLoading ? "Running CContext..." : "Run CContext"}
          </Button>
        </>
      )}

      {calculatedTokens && (
        <div className="flex flex-wrap justify-center text-center items-center gap-2">
          <span className="text-sm">Repo Tokens:</span>
          <span className="font-bold">{calculatedTokens.toLocaleString()}</span>
        </div>
      )}

      {(markdownContent || pdfExists) && (
        <div>
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

      {fileTree && <ParsedFileTree fileTree={fileTree} />}

      {/* <CommandOutput
        calculatedTokens={calculatedTokens}
        output={output}
        handleCopyToClipboard={handleCopyToClipboard}
      /> */}
    </div>
  );
};

export default GitHubCContext;
