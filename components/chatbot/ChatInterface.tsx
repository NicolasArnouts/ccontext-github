import React, { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "ai/react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import SignInModal from "@/components/SignInModal";
import { Button } from "@/components/ui/button";

interface ChatInterfaceProps {
  markdownContent?: string;
}

interface SessionInfo {
  chatCount: number;
  tokenUsage: number;
  maxChats: number;
  maxTokens: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { user } = useUser();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { messages, append, setMessages, isLoading, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [chatLimitReached, setChatLimitReached] = useState(false);
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null);

  useEffect(() => {
    if (markdownContent) {
      setMessages([
        {
          id: "markdown-content",
          role: "system",
          content: markdownContent,
        },
      ]);
    }
  }, [markdownContent, setMessages]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const handleSubmit = useCallback(
    async (message: string) => {
      try {
        const response = await axios.post("/api/token-tracking", {
          message,
          model: "gpt-3.5-turbo",
        });

        if (response.data.error === "Chat limit reached") {
          setChatLimitReached(true);
          setShowSignInModal(true);
          return;
        }

        if (response.data.session) {
          setSessionInfo(response.data.session);
        }

        setRemainingTokens(response.data.remainingTokens);

        await append({
          role: "user",
          content: message,
        });
      } catch (error) {
        console.error("Error submitting message:", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setChatLimitReached(true);
          setShowSignInModal(true);
        }
      }
    },
    [append]
  );

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {!user && remainingTokens !== null && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-2 text-sm">
          Anonymous Session: {remainingTokens.toLocaleString()} /{" "}
          {sessionInfo?.maxTokens.toLocaleString()} tokens remaining
        </div>
      )}
      {user && remainingTokens !== null && (
        <div className="bg-green-100 dark:bg-green-900 p-2 text-sm">
          Authenticated User: {remainingTokens.toLocaleString()} tokens
          remaining
        </div>
      )}
      <div className="flex-grow overflow-auto" ref={messageListRef}>
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={scrollRef} />
      </div>
      {error && <div className="text-red-500 p-2">Error: {error.message}</div>}
      {chatLimitReached && (
        <div className="bg-red-100 dark:bg-red-900 p-4 text-center">
          <p className="text-lg font-semibold mb-2">Chat limit reached</p>
          <p className="mb-4">
            You've reached the maximum number of chats for anonymous users.
          </p>
          <Button onClick={() => setShowSignInModal(true)}>
            Sign in to continue
          </Button>
        </div>
      )}
      <ScrollToBottomButton onClick={scrollToBottom} />
      <div>
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isLoading || showSignInModal || chatLimitReached}
        />
      </div>
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </div>
  );
};

export default ChatInterface;
