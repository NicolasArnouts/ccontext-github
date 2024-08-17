import React from "react";
import { ChatMessage } from "@prisma/client";
import UserMessage from "@/components/chatbot/UserMessage";
import SystemMessage from "@/components/chatbot/SystemMessage";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-auto">
      {messages.map((message) => (
        <div key={message.id}>
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
    </div>
  );
};

export default MessageList;
