"use client ";

import React from "react";
import { Message } from "ai";

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${message.role === "user" ? "text-right" : "text-left"}`}
        >
          <span
            className={`inline-block p-2 rounded-lg ${
              message.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {message.content}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
