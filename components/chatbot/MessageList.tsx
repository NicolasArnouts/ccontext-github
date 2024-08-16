import React from "react";
import { Message } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import UserMessage from "./UserMessage.tsx";
import SystemMessage from "./SystemMessage";

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
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
    </div>
  );
};

export default MessageList;
