"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import { useDebounce } from "@/hooks/useDebounce";
import { useGithubCContextStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export const useChatInterface = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    markdownContent,
    tokensLeft,
    setTokensLeft,
    selectedModel,
    setSelectedModel,
    messages,
    setMessages,
    clearMessages,
  } = useGithubCContextStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const debouncedHandleScroll = useDebounce(handleScroll, 200);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", debouncedHandleScroll);
    return () => container.removeEventListener("scroll", debouncedHandleScroll);
  }, [debouncedHandleScroll]);

  const updateTokensLeft = useCallback(async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch(
        `/api/token-tracking?modelId=${selectedModel}`
      );
      if (!response.ok) throw new Error("Failed to fetch updated token count");
      const data = await response.json();
      setTokensLeft(selectedModel, data.remainingTokens);
    } catch (error) {
      console.error("Error updating tokens left:", error);
    }
  }, [selectedModel, setTokensLeft]);

  const handleSendMessage = async (
    userInput: string | null,
    modelId: string
  ) => {
    setIsLoading(true);
    setSelectedModel(modelId);

    let newMessages: Message[] = [...messages];

    if (userInput !== null) {
      const userMessage: Message = { role: "user", content: userInput };
      newMessages.push(userMessage);
    }
    setMessages(newMessages);
    scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, modelId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage.content += chunk;
        setMessages([...newMessages, { ...assistantMessage }]);
        scrollToBottom();
      }

      await updateTokensLeft();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokensUpdated = (modelId: string, amount: number) => {
    setTokensLeft(modelId, amount);
  };

  const handleClearChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return {
    isLoading,
    showScrollButton,
    messages,
    messagesEndRef,
    chatContainerRef,
    scrollToBottom,
    handleSendMessage,
    tokensLeft,
    handleTokensUpdated,
    handleClearChat,
  };
};

const ChatInterface: React.FC = () => {
  const {
    isLoading,
    showScrollButton,
    messages,
    messagesEndRef,
    chatContainerRef,
    scrollToBottom,
    handleSendMessage,
    tokensLeft,
    handleTokensUpdated,
    handleClearChat,
  } = useChatInterface();

  return (
    <div
      className="relative flex flex-col h-full overflow-auto"
      ref={chatContainerRef}
    >
      <div className="relative flex-grow overflow-y-auto bg-white dark:bg-gray-900">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>

      <div className="relative bg-gray-100 dark:bg-gray-800">
        <div className="absolute -top-7 left-0 z-50 pl-2">
          <button
            onClick={handleClearChat}
            className=" px-2 py-1 dark:hover:text-gray-300 dark:bg-gray-900 bg-gray-100 bg-opacity-80 text-xs font-semibold rounded-lg border border-gray-300 shadow-md hover:bg-white hover:text-black"
          >
            Clear Chat
          </button>
        </div>
        <div className="absolute top-0 right-0 z-50">
          <ScrollToBottomButton onClick={scrollToBottom} />
        </div>

        <ChatInput
          onSubmit={handleSendMessage}
          isStreaming={isLoading}
          previousMessages={messages.map((msg) => msg.content)}
          tokensLeft={tokensLeft}
          onTokensUpdated={handleTokensUpdated}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
