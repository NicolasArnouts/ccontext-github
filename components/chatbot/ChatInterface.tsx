import React, { useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
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
      await append({
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
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={scrollRef} />
      </div>
      {error && <div className="text-red-500 p-2">Error: {error.message}</div>}
      <ScrollToBottomButton onClick={scrollToBottom} />
      <div>
        <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;
