"use client";

// components/chatbot/ChatInterface.tsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "ai/react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import SignInModal from "@/components/SignInModal";

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { user } = useUser();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const { messages, append, setMessages, isLoading, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

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
        const response = await axios.post(
          "/api/token-tracking",
          {
            message,
            model: "gpt-3.5-turbo", // or whichever model you're using
          },
          {
            headers: { "x-session-id": sessionId },
          }
        );

        if (response.data.error) {
          setShowSignInModal(true);
          return;
        }

        await append({
          role: "user",
          content: message,
        });
      } catch (error) {
        console.error("Error submitting message:", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setShowSignInModal(true);
        }
      }
    },
    [append, sessionId]
  );

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-grow overflow-auto" ref={messageListRef}>
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={scrollRef} />
      </div>
      {error && <div className="text-red-500 p-2">Error: {error.message}</div>}
      <ScrollToBottomButton onClick={scrollToBottom} />
      <div>
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isLoading || showSignInModal}
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
