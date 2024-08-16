import React, { useEffect } from "react";
import { useChat } from "ai/react";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";

interface ChatInterfaceProps {
  markdownContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();

  useEffect(() => {
    if (markdownContent) {
      // Add the markdown content as the first message from the assistant
      setMessages([
        {
          id: "markdown-content-data",
          role: "system",
          content: markdownContent,
        },
      ]);
    }
  }, [markdownContent, setMessages]);

  return (
    <div className="flex flex-col ">
      <MessageList messages={messages} />
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

export default ChatInterface;
