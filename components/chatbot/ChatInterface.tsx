import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import MessageList from "@/components/chatbot/MessageList";
import ChatInput from "@/components/chatbot/ChatInput";
import ScrollToBottomButton from "@/components/chatbot/ScrollToBottomButton";
import ModelSelector from "@/components/chatbot/ModelSelector";
import { useDebounce } from "@/hooks/useDebounce";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Model {
  id: string;
  name: string;
  tags: string[];
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
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tokensLeft, setTokensLeft] = useState<number | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (markdownContent) {
      setMessages([{ role: "system", content: markdownContent }]);
    }
  }, [markdownContent]);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (selectedModel && isSignedIn) {
      fetchTokensLeft();
    }
  }, [selectedModel, isSignedIn]);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch("/api/models");
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      const data = await response.json();
      setModels(data);
      if (data.length > 0) {
        setSelectedModel(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchTokensLeft = async () => {
    try {
      const response = await fetch(`/api/user-tokens?modelId=${selectedModel}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tokens");
      }
      const data = await response.json();
      setTokensLeft(data.tokensLeft);
    } catch (error) {
      console.error("Error fetching tokens left:", error);
      setTokensLeft(null);
    }
  };

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

  const handleSendMessage = async (userInput: string) => {
    if (!selectedModel) {
      toast({
        title: "Error",
        description: "Please select a model first",
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
        body: JSON.stringify({ messages: newMessages, modelId: selectedModel }),
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

      if (isSignedIn) {
        fetchTokensLeft(); // Update tokens left after message
      }
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

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };

  if (isLoadingModels) {
    return (
      <div className="flex justify-center items-center h-full">
        Loading models...
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      ref={chatContainerRef}
    >
      <div className="p-4 bg-gray-100 dark:bg-gray-800">
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
        {isSignedIn && tokensLeft !== null && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Tokens left: {tokensLeft}
          </div>
        )}
      </div>
      <div className="relative flex-grow overflow-y-auto bg-white dark:bg-gray-900">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>
      {showScrollButton && (
        <div className="absolute bottom-20 right-4">
          <ScrollToBottomButton onClick={scrollToBottom} />
        </div>
      )}
      <div className="p-4 bg-gray-100 dark:bg-gray-800">
        <ChatInput onSubmit={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;
