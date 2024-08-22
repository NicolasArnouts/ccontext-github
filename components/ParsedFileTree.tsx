import React from "react";
import { Clipboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ParsedFileTreeProps {
  fileTree: string;
}

const ParsedFileTree: React.FC<ParsedFileTreeProps> = ({ fileTree }) => {
  const { toast } = useToast();

  const renderFileTree = (tree: string) => {
    return tree.split("\n").map((line, index) => {
      const indent = line.search(/\S/);
      const content = line.trim();
      const isDirectory = content.startsWith("📁");
      const isExcluded = content.includes("[Excluded]");

      return (
        <div
          key={index}
          style={{ marginLeft: `${indent * 10}px` }}
          className={`${isExcluded ? "text-gray-400" : ""} ${
            isDirectory ? "font-bold" : ""
          }`}
        >
          {content}
        </div>
      );
    });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(fileTree).then(
      () => {
        toast({
          title: "Copied!",
          description: "File tree copied to clipboard",
        });
      },
      (err) => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Error",
          description: "Failed to copy file tree",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="relative flex flex-col bg-background border border-border rounded-lg">
      <button
        className="absolute p-2 bg-gray-200 opacity-80 hover:dark:text-gray-300 hover:dark:border-gray-300 dark:bg-gray-800 border dark:border-white z-50 rounded-xl right-1 top-1"
        onClick={handleCopyToClipboard}
      >
        <Clipboard className="h-5 w-5" />
      </button>
      <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto p-2">
        {renderFileTree(fileTree)}
      </pre>
    </div>
  );
};

export default ParsedFileTree;
