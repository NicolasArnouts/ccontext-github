import React, { useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import MarkdownDisplay from "../MarkdownDisplay";

interface SystemMessageProps {
  content: string;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ content }) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The message has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy failed",
        description: "Failed to copy the message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="justify-start mb-4">
      <div className="relative bg-gray-100 text-black dark:bg-gray-800 dark:text-white rounded-lg py-2 px-4">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2"
          onClick={handleCopyToClipboard}
        >
          <ClipboardCopy className="h-4 w-4 mr-2" />
          {isCopied ? "Copied!" : "Copy"}
        </Button>
        <div className="overflow-x-auto pr-20">
          <MarkdownDisplay content={content} />
        </div>
      </div>
    </div>
  );
};

export default SystemMessage;
