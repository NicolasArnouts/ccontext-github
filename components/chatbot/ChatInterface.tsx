import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import { useDebounce } from "@/hooks/useDebounce";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  markdownContent?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ markdownContent }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [tokensLeft, setTokensLeft] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (markdownContent) {
      setMessages([{ role: "system", content: markdownContent }]);
    }
  }, [markdownContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const debouncedHandleScroll = useDebounce(handleScroll, 200);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", debouncedHandleScroll);
    return () => container.removeEventListener("scroll", debouncedHandleScroll);
  }, [debouncedHandleScroll]);

  const checkTokens = async (
    message: string,
    modelId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/token-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, modelId }),
      });
      if (!response.ok) {
        throw new Error("Failed to check tokens");
      }
      const data = await response.json();
      setTokensLeft(data.remainingTokens);
      return data.success;
    } catch (error) {
      console.error("Error checking tokens:", error);
      toast({
        title: "Error",
        description: "Failed to check token availability",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSendMessage = async (userInput: string, modelId: string) => {
    // Check if user has enough tokens
    const hasEnoughTokens = await checkTokens(userInput, modelId);
    if (!hasEnoughTokens) {
      toast({
        title: "Error",
        description: "Not enough tokens to send this message",
        variant: "destructive",
      });
      return;
    }

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
        body: JSON.stringify({ messages: newMessages, modelId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
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

      // Update tokens after receiving the response
      await checkTokens("", modelId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      ref={chatContainerRef}
    >
      <div className="relative flex-grow overflow-y-auto bg-white dark:bg-gray-900">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>
      {showScrollButton && (
        <div className="absolute bottom-20 right-4">
          <ScrollToBottomButton onClick={scrollToBottom} />
        </div>
      )}
      <div className=" bg-gray-100 dark:bg-gray-800">
        <ChatInput
          onSubmit={handleSendMessage}
          disabled={isLoading}
          tokensLeft={tokensLeft}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
