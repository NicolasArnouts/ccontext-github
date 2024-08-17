"use client";

import { useState } from "react";
import GitHubCContext from "@/components/GitHubCContext";
import ChatInterface from "@/components/chatbot/ChatInterface";
import { useGithubCContextStore } from "@/lib/store";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const { setMarkdownContent } = useGithubCContextStore();

  const handleMarkdownGenerated = (content: string) => {
    setMarkdownContent(content);
    setShowChat(true);
  };

  return (
    <main className="flex flex-col items-center justify-between">
      <div className="space-y-6 w-full ">
        <div className="">
          <ResizablePanelGroup
            direction="horizontal"
            className="rounded-2xl p-0 gap-0 m-0"
          >
            <ResizablePanel className="overflow-scroll">
              <div className="h-[85svh] overflow-scroll bg-gray-50 dark:bg-gray-700 p-4">
                <GitHubCContext onMarkdownGenerated={handleMarkdownGenerated} />
              </div>
            </ResizablePanel>
            <ResizableHandle className="p-1 bg-gray-200 dark:bg-gray-600" />
            <ResizablePanel className="h-[85svh] p-0 m-0">
              <div className="bg-gray-50 dark:bg-gray-600 md:rounded-none rounded-3xl h-[85svh] overflow-scroll">
                <ChatInterface />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </main>
  );
}
