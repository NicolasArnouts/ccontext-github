import React, { useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface ChatInterfaceProps {
  markdownContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { messages, append, setMessages, isLoading } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (markdownContent) {
      setMessages([
        {
          id: "markdown-content-data",
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
    (message: string) => {
      append({
        role: "user",
        content: message,
      });
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
      <div className="flex-grow overflow-auto" ref={messageListRef}>
        <MessageList messages={messages} />
        <div ref={scrollRef} />
      </div>
      <ScrollToBottomButton onClick={scrollToBottom} />
      <div>
        <ChatInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default ChatInterface;
