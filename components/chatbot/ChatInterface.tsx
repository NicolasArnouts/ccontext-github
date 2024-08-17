import React, { useEffect, useRef, useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { ChatMessage } from "@prisma/client";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import { useToast } from "@/components/ui/use-toast";

interface ChatInterfaceProps {
  markdownContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get("/api/chat-history");
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  useEffect(() => {
    if (markdownContent) {
      const systemMessage: Omit<ChatMessage, "id" | "createdAt"> = {
        role: "system",
        content: markdownContent,
        userId: user?.id || null,
        sessionId: user?.id || "anonymous",
        order: messages.length,
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        systemMessage as ChatMessage,
      ]);
    }
  }, [markdownContent, user, messages.length]);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (!user) return;

      setIsLoading(true);
      try {
        const newMessage: Omit<ChatMessage, "id" | "createdAt"> = {
          role: "user",
          content,
          userId: user.id,
          sessionId: user.id,
          order: messages.length,
        };

        const response = await axios.post("/api/chat", newMessage);
        setMessages((prevMessages) => [...prevMessages, response.data.message]);

        // Fetch AI response
        const aiResponse = await axios.post("/api/chat", {
          role: "assistant",
          content: "AI response here", // Replace with actual AI integration
          userId: user.id,
          sessionId: user.id,
          order: messages.length + 1,
        });
        setMessages((prevMessages) => [
          ...prevMessages,
          aiResponse.data.message,
        ]);
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
    [messages.length, user, toast]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <div ref={scrollRef} />
      <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      <ScrollToBottomButton
        onClick={() =>
          scrollRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />
    </div>
  );
};

export default ChatInterface;
