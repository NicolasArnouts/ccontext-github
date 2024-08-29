"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGithubCContextStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BotMessageSquare, SlidersHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/useScreenSize";
import EnhancedCContextExplanation from "@/components/EnhancedCcontextExplanation";

// Dynamically import components that might use browser APIs
const GitHubCContext = dynamic(() => import("@/components/GitHubCContext"), {
  ssr: false,
});
const ChatInterface = dynamic(
  () => import("@/components/chatbot/ChatInterface"),
  { ssr: false }
);
const ResizablePanelGroup = dynamic(
  () =>
    import("@/components/ui/resizable").then((mod) => mod.ResizablePanelGroup),
  { ssr: false }
);
const ResizablePanel = dynamic(
  () => import("@/components/ui/resizable").then((mod) => mod.ResizablePanel),
  { ssr: false }
);
const ResizableHandle = dynamic(
  () => import("@/components/ui/resizable").then((mod) => mod.ResizableHandle),
  { ssr: false }
);

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [currentMobileView, setCurrentMobileView] = useState<"menu" | "chat">(
    "menu"
  );
  const { setMarkdownContent } = useGithubCContextStore();
  const { width } = useScreenSize();
  const [isClient, setIsClient] = useState(false);

  const isMobile = width < 768; // Adjust this breakpoint as needed

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMarkdownGenerated = (content: string) => {
    setMarkdownContent(content);
    setShowChat(true);
    if (isMobile) {
      setCurrentMobileView("chat");
    }
  };

  const handleChatWithAI = () => {
    setShowChat(true);
    if (isMobile) {
      setCurrentMobileView("chat");
    }
  };

  const handleShowMenu = () => {
    if (!isMobile) {
      setShowMenu((prev) => !prev);
    }
  };

  const toggleMobileView = () => {
    setCurrentMobileView((prev) => (prev === "menu" ? "chat" : "menu"));
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <main
      className={cn(
        "flex flex-col items-center justify-between p-4 md:p-0",
        !showChat && ""
      )}
    >
      <div className={cn(" w-full", !showChat && "sm:w-4/5 md:w-3/4 lg:w-5/6")}>
        {isMobile ? (
          <div className="relative h-full overflow-hidden rounded-3xl ">
            {currentMobileView === "menu" ? (
              <div className="flex flex-col gap-6 rounded-3xl">
                <div className="relative h-full  bg-gray-50 dark:bg-gray-700 p-4 rounded-3xl">
                  <GitHubCContext
                    onMarkdownGenerated={handleMarkdownGenerated}
                    onChatWithAI={handleChatWithAI}
                  />
                </div>
                <EnhancedCContextExplanation />
              </div>
            ) : (
              <div className="h-[85svh] bg-gray-50 dark:bg-gray-600 rounded-3xl overflow-scroll">
                <ChatInterface />
              </div>
            )}

            {currentMobileView !== "menu" && (
              <button
                onClick={toggleMobileView}
                className="hover:bg-white hover:text-black absolute top-1 left-1 px-2 py-1 font-semibold z-50 dark:hover:text-gray-300 dark:bg-gray-900 bg-gray-100  shadow-md  border bg-opacity-80 rounded-xl"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ResizablePanelGroup
              direction="horizontal"
              className="rounded-2xl p-0 gap-0 m-0"
            >
              {showMenu && (
                <ResizablePanel className="">
                  <div
                    className={cn(
                      "relative h-[85vh] bg-gray-50 dark:bg-gray-700 p-4 overflow-auto",
                      showChat ? "h-[85vh]" : "h-full"
                    )}
                  >
                    <GitHubCContext
                      onMarkdownGenerated={handleMarkdownGenerated}
                      onChatWithAI={handleChatWithAI}
                    />
                  </div>
                </ResizablePanel>
              )}
              {showChat && showMenu && (
                <ResizableHandle className="p-1 bg-gray-200 dark:bg-gray-600" />
              )}
              {showChat && (
                <ResizablePanel className={cn("h-[85vh] p-0 m-0")}>
                  <div className="relative bg-gray-50  dark:bg-gray-600 md:rounded-none rounded-3xl h-[85vh] overflow-scroll">
                    <button
                      onClick={handleShowMenu}
                      className="hover:bg-white hover:text-black absolute top-1 left-1 px-2 py-1 font-semibold z-50 dark:hover:text-gray-300 dark:bg-gray-900 bg-gray-100  shadow-md  border bg-opacity-80 rounded-xl"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
                    </button>
                    <ChatInterface />
                  </div>
                </ResizablePanel>
              )}
            </ResizablePanelGroup>

            {!showChat && <EnhancedCContextExplanation />}
          </div>
        )}
      </div>
    </main>
  );
}
