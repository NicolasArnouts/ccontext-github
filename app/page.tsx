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
  const [markdownContent, setMarkdownContent] = useState<string | null>("");
  const [showChat, setShowChat] = useState(false);

  const handleMarkdownGenerated = (content: string) => {
    setMarkdownContent(content);
    setShowChat(true);
  };

  return (
    <main className="flex flex-col items-center justify-between">
      <div className="space-y-6 w-full ">
        <div className="">
          <ResizablePanelGroup direction="horizontal" className="rounded-2xl ">
            <ResizablePanel className="overflow-scroll">
              <div className="h-[85svh] overflow-scroll bg-gray-50 dark:bg-gray-700 p-4">
                <GitHubCContext onMarkdownGenerated={handleMarkdownGenerated} />
              </div>
            </ResizablePanel>
            <ResizableHandle className="p-1 bg-gray-200 dark:bg-gray-600" />
            <ResizablePanel className="h-[85svh]">
              {showChat ? (
                <div className="bg-gray-50 dark:bg-gray-600 md:rounded-none rounded-3xl h-[85svh] overflow-scroll">
                  <ChatInterface markdownContent={markdownContent} />
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-600 md:rounded-none rounded-3xl h-[85svh] overflow-scroll flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Click "Chat with AI" to start a conversation about the
                    generated content.
                  </p>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </main>
  );
}
