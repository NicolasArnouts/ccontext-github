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
      <div className="space-y-6 w-full max-w-5xl">
        <h2 className="text-3xl font-bold">
          Chat with any github codebase you want!
        </h2>

        <div className="">
          <ResizablePanelGroup direction="horizontal" className="">
            <ResizablePanel className="bg-red-100  overflow-scroll ">
              <div className="h-[80svh] overflow-scroll">
                <GitHubCContext onMarkdownGenerated={handleMarkdownGenerated} />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel className="bg-green-100 h-[80svh] ">
              {markdownContent && (
                <div className="bg-gray-50 rounded-3xl h-[80svh] overflow-scroll">
                  <ChatInterface markdownContent={markdownContent} />
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* <GitHubCContext onMarkdownGenerated={handleMarkdownGenerated} />
        {markdownContent && (
          <div className="bg-gray-50 rounded-3xl">
            <ChatInterface markdownContent={markdownContent} />
          </div>
        )} */}

        {/* <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Admin Functions</h3>
          <CleanupButton />
        </div> */}
      </div>
    </main>
  );
}
