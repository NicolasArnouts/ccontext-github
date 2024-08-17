"use client";

import React, { useEffect, useRef, useState } from "react";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  markdownContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (markdownContent) {
      console.log("Markdown content received:", markdownContent);
      setMessages([{ role: "system", content: markdownContent }]);
    }
  }, [markdownContent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    setIsLoading(true);
    const message: Message = { role: "user", content: userInput };
    const newMessages = [...messages, message];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      let accumulatedContent = "";
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...newMessages, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedContent += chunk;
        assistantMessage.content = accumulatedContent;
        setMessages([...newMessages, { ...assistantMessage }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <div ref={scrollRef} />
      <ChatInput onSubmit={handleSendMessage} disabled={isLoading} />
      <ScrollToBottomButton
        onClick={() =>
          scrollRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />
    </div>
  );
};

export default ChatInterface;
