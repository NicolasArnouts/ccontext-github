"use client";

import { useState } from "react";
import GitHubCContext from "@/components/GitHubCContext";
import ChatInterface from "@/components/chatbot/ChatInterface";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  const handleMarkdownGenerated = (content: string) => {
    setMarkdownContent(content);
  };

  return (
    <main className="flex  flex-col items-center justify-between">
      <div className="space-y-6 w-full ">
        <div className="">
          <ResizablePanelGroup direction="horizontal" className="">
            <ResizablePanel className=" overflow-scroll ">
              <div className="h-[80svh] overflow-scroll">
                <GitHubCContext onMarkdownGenerated={handleMarkdownGenerated} />
              </div>
            </ResizablePanel>
            <ResizableHandle className="p-1 bg-gray-200" />
            <ResizablePanel className=" h-[80svh] ">
              {markdownContent ? (
                <div className="bg-gray-50 rounded-3xl h-[80svh] overflow-scroll">
                  <ChatInterface markdownContent={markdownContent} />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-3xl h-[80svh] overflow-scroll">
                  <ChatInterface />
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </main>
  );
}
