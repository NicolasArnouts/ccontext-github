import React, { useState, useCallback, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import ModelSelector from "./ModelSelector";
import { Model } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSubmit: (message: string, modelId: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled }) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const [tokensLeft, setTokensLeft] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      fetchTokensLeft();
    }
  }, [selectedModel]);

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
        description: "Failed to fetch models. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchTokensLeft = async () => {
    try {
      const response = await fetch(
        `/api/token-tracking?modelId=${selectedModel}`
      );
      if (response.ok) {
        const data = await response.json();
        setTokensLeft(data.remainingTokens);
      }
    } catch (error) {
      console.error("Error fetching tokens left:", error);
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const checkTokens = async (message: string, modelId: string) => {
    setIsCheckingTokens(true);
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
        description: "Failed to check token availability. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCheckingTokens(false);
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (inputValue.trim() && !disabled && selectedModel) {
        const hasEnoughTokens = await checkTokens(
          inputValue.trim(),
          selectedModel
        );
        if (hasEnoughTokens) {
          onSubmit(inputValue.trim(), selectedModel);
          setInputValue("");
          // Refresh token count after sending a message
          fetchTokensLeft();
        } else {
          toast({
            title: "Insufficient Tokens",
            description: "You don't have enough tokens for this request.",
            variant: "destructive",
          });
        }
      }
    },
    [inputValue, onSubmit, disabled, selectedModel, toast]
  );

  return (
    <form onSubmit={handleSubmit} className="shadow-md">
      <div className="relative flex flex-col p-2 bg-white dark:bg-gray-800">
        <div className="relative flex flex-1 w-full">
          <TextareaAutosize
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="p-2 max-h-[40dvh] w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={disabled || isCheckingTokens}
          />
          <button
            type="submit"
            className="absolute right-4 bottom-4 bg-blue-500 p-2 text-white font-bold rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={disabled || !selectedModel || isCheckingTokens}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-between items-center mt-2">
          {isLoadingModels ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Loading models...
            </div>
          ) : (
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />
          )}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Tokens left: {tokensLeft !== null ? tokensLeft : "N/A"}
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
