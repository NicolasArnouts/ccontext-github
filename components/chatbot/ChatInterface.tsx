"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "ai/react";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import { useToast } from "@/components/ui/use-toast";

interface ChatInterfaceProps {
  markdownContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      api: "/api/chat",
      onError: (error) => {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      },
    });

  useEffect(() => {
    if (markdownContent) {
      console.log("Markdown content received:", markdownContent);
      append({
        role: "system",
        content: markdownContent,
      });
    }
  }, [markdownContent, append]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (userInput: string) => {
    console.log("Submitting message:", userInput);
    await append({
      role: "user",
      content: userInput,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <div ref={scrollRef} />
      <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
      <ScrollToBottomButton
        onClick={() =>
          scrollRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />
    </div>
  );
};

export default ChatInterface;
