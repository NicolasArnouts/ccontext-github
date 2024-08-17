import React, { useEffect, useRef, useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import { useToast } from "@/components/ui/use-toast";

interface ChatInterfaceProps {
  markdownContent?: string;
}

interface Message {
  role: string;
  content: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (markdownContent) {
      const systemMessage: Message = {
        role: "system",
        content: markdownContent,
      };
      setMessages([systemMessage]);
    }
  }, [markdownContent]);

  const handleSubmit = useCallback(
    async (content: string) => {
      setIsLoading(true);
      try {
        const newMessage: Message = {
          role: "user",
          content,
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        const response = await axios.post("/api/chat", {
          messages: [...messages, newMessage],
        });

        const aiMessage: Message = {
          role: "assistant",
          content: response.data,
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);
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
    },
    [messages, toast]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
