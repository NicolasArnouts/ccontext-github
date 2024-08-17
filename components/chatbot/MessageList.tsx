import React, { useEffect } from "react";
import UserMessage from "@/components/chatbot/UserMessage";
import SystemMessage from "@/components/chatbot/SystemMessage";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const { showScrollButton, scrollToBottom, messagesEndRef } =
    useScrollToBottom();

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex-1 p-4 space-y-4 overflow-auto relative">
      {messages.map((message, index) => (
        <div key={index}>
          {message.role === "user" ? (
            <UserMessage content={message.content} />
          ) : (
            <SystemMessage content={message.content} />
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      )}
      <div ref={messagesEndRef} />

      <ScrollToBottomButton onClick={scrollToBottom} />
    </div>
  );
};

export default MessageList;
