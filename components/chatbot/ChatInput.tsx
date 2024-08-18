"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import ModelSelector from "@/components/chatbot/ModelSelector";
import { Model } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { useGithubCContextStore } from "@/lib/store";
import { getInputTokens, debounce } from "@/lib/helpers-client";
import SignInModal from "@/components/SignInModal";
import OutOfTokensDialog from "@/components/OutOfTokensDialog";
import PremiumModelDialog from "@/components/PremiumModelDialog";
import { useUser } from "@clerk/nextjs";

interface ChatInputProps {
  onSubmit: (message: string, modelId: string) => void;
  isStreaming?: boolean;
  previousMessages: string[];
  tokensLeft: number | null;
  onTokensUpdated: (tokens: number) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isStreaming,
  previousMessages,
  tokensLeft,
  onTokensUpdated,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showOutOfTokensDialog, setShowOutOfTokensDialog] = useState(false);
  const [showPremiumModelDialog, setShowPremiumModelDialog] = useState(false);
  const { toast } = useToast();
  const { isSignedIn } = useUser();

  const { tokenCost, selectedModel, setSelectedModel, setTokenCost } =
    useGithubCContextStore();

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      fetchTokensLeft();
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchTokensLeft();
  }, [isStreaming]);

  const fetchTokensLeft = async () => {
    try {
      const response = await fetch(
        `/api/token-tracking?modelId=${selectedModel}`
      );
      if (response.ok) {
        const data = await response.json();
        onTokensUpdated(data.remainingTokens);
      }
    } catch (error) {
      console.error("Error fetching tokens left:", error);
    }
  };

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

  const debouncedGetInputTokens = useMemo(
    () => debounce(getInputTokens, 800),
    []
  );

  const calculateTokenCost = useCallback(
    (inputTokens: number) => {
      const previousMessagesTokens = previousMessages.reduce((acc, message) => {
        return acc + getInputTokens(message);
      }, 0);
      setTokenCost(inputTokens + previousMessagesTokens);
    },
    [previousMessages, setTokenCost]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newInputValue = e.target.value;
      setInputValue(newInputValue);

      debouncedGetInputTokens(newInputValue).then((tokens) => {
        calculateTokenCost(tokens);
      });
    },
    [debouncedGetInputTokens, calculateTokenCost]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [inputValue, selectedModel]
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
      onTokensUpdated(data.remainingTokens);
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
    async (
      e:
        | React.FormEvent<HTMLFormElement>
        | React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      e.preventDefault();
      if (inputValue.trim() && selectedModel) {
        const hasEnoughTokens = await checkTokens(
          inputValue.trim(),
          selectedModel
        );
        if (hasEnoughTokens) {
          onSubmit(inputValue.trim(), selectedModel);
          setInputValue("");
          setTokenCost(0); // Reset token cost after submission
        } else {
          if (isSignedIn) {
            setShowOutOfTokensDialog(true);
          } else {
            setShowSignInModal(true);
          }
        }
      }
    },
    [inputValue, onSubmit, selectedModel, checkTokens, setTokenCost, isSignedIn]
  );

  const handleModelSelect = (modelId: string) => {
    const selectedModelData = models.find((model) => model.id === modelId);
    if (selectedModelData && selectedModelData.tags.includes("Premium")) {
      setShowPremiumModelDialog(true);
    } else {
      setSelectedModel(modelId);
    }
  };

  const handleUpgrade = () => {
    // Implement upgrade logic here
    console.log("Upgrade plan");
    // For now, we'll just close the dialog
    setShowOutOfTokensDialog(false);
    setShowPremiumModelDialog(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="shadow-md">
        <div className="relative flex flex-col pl-2 py-2 bg-white dark:bg-gray-800">
          <div className="relative flex flex-1 w-full">
            <TextareaAutosize
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="p-2 max-h-[40dvh] w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="bottom-2 bg-blue-500 p-2 text-white font-bold rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isStreaming || !selectedModel || isCheckingTokens}
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
                onModelSelect={handleModelSelect}
              />
            )}
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div className="bg-red-200">Chat cost: {tokenCost}</div>
              <div className="bg-blue-200">
                Tokens left: {tokensLeft !== null ? tokensLeft : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </form>

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <OutOfTokensDialog
        isOpen={showOutOfTokensDialog}
        onClose={() => setShowOutOfTokensDialog(false)}
        onUpgrade={handleUpgrade}
      />

      <PremiumModelDialog
        isOpen={showPremiumModelDialog}
        onClose={() => setShowPremiumModelDialog(false)}
        onUpgrade={handleUpgrade}
        modelName={
          models.find((model) => model.id === selectedModel)?.name ||
          "Premium model"
        }
      />
    </>
  );
};

export default ChatInput;
