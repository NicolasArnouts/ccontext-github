"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import ModelSelector from "@/components/chatbot/ModelSelector";
import { Model } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { useGithubCContextStore } from "@/lib/store";
import {
  getInputTokens,
  debounce,
  concatenateMessages,
  TOKEN_WARNING_THRESHOLD,
} from "@/lib/helpers-client";
import OutOfTokensDialog from "@/components/OutOfTokensDialog";
import PremiumModelDialog from "@/components/PremiumModelDialog";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string | null, modelId: string) => void;
  isStreaming?: boolean;
  previousMessages: string[];
  tokensLeft: Record<string, number>;
  onTokensUpdated: (modelId: string, tokens: number) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  isStreaming,
  previousMessages,
  tokensLeft,
  onTokensUpdated,
}) => {
  const { redirectToSignIn } = useClerk();
  const { isSignedIn } = useUser();
  const [inputValue, setInputValue] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const [showOutOfTokensDialog, setShowOutOfTokensDialog] = useState(false);
  const [showPremiumModelDialog, setShowPremiumModelDialog] = useState(false);

  const { toast } = useToast();

  const { tokenCost, selectedModel, setSelectedModel, setTokenCost, messages } =
    useGithubCContextStore();

  // Effect to calculate token cost when messages change
  useEffect(() => {
    calculateTokenCost(getInputTokens(inputValue));
  }, [messages]);

  // Effect to fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Effect to fetch tokens left when selected model changes
  useEffect(() => {
    if (selectedModel) {
      fetchTokensLeft(selectedModel);
    }
  }, [selectedModel]);

  // Function to fetch tokens left for a model
  const fetchTokensLeft = async (modelId: string) => {
    try {
      const response = await fetch(`/api/token-tracking?modelId=${modelId}`);
      if (response.ok) {
        const data = await response.json();
        onTokensUpdated(modelId, data.remainingTokens);
      }
    } catch (error) {
      console.error("Error fetching tokens left:", error);
    }
  };

  // Function to fetch available models
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
    () => debounce(getInputTokens, 300),
    []
  );

  const calculateTokenCost = useCallback(
    (inputTokens: number) => {
      const previousMessagesTokens = previousMessages.reduce((acc, message) => {
        return acc + getInputTokens(message);
      }, 0);
      setTokenCost(inputTokens + previousMessagesTokens);
    },
    [previousMessages, setTokenCost, messages]
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
      // Log the request payload for debugging
      console.log("Checking tokens:", { message, modelId });

      const response = await fetch("/api/token-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message || "", modelId }),
      });
      if (!response.ok) {
        throw new Error("Failed to check tokens");
      }
      const data = await response.json();
      onTokensUpdated(modelId, data.remainingTokens);
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
      if (selectedModel) {
        const messageToSend = inputValue.trim() || null;

        // Log for debugging
        console.log("Submitting message:", { messageToSend, selectedModel });

        const hasEnoughTokens = await checkTokens(
          messageToSend || "",
          selectedModel
        );

        console.log("Has enough tokens:", hasEnoughTokens);

        if (hasEnoughTokens) {
          onSubmit(messageToSend, selectedModel);
          setInputValue("");
          setTokenCost(0); // Reset token cost after submission
        } else {
          setShowOutOfTokensDialog(true);
        }
      } else {
        console.error("No model selected");
        toast({
          title: "Error",
          description: "Please select a model before sending a message.",
          variant: "destructive",
        });
      }
    },
    [inputValue, onSubmit, selectedModel, checkTokens, setTokenCost]
  );

  const handleSignIn = () => {
    setShowPremiumModelDialog(false);
    redirectToSignIn({
      redirectUrl: window.location.href,
    });
  };

  const handleModelSelect = (modelId: string) => {
    const selectedModelData = models.find((model) => model.id === modelId);
    if (
      selectedModelData &&
      selectedModelData.tags.includes("Premium") &&
      !isSignedIn
    ) {
      setShowPremiumModelDialog(true);
    } else {
      setSelectedModel(modelId);
    }
  };

  const handleUpgrade = () => {
    // Implement upgrade logic here
    console.log("Upgrade plan");
    // For now, we'll just close the dialogs
    setShowOutOfTokensDialog(false);
    setShowPremiumModelDialog(false);
  };

  const currentTokensLeft = selectedModel
    ? tokensLeft[selectedModel]
    : undefined;

  return (
    <>
      <form onSubmit={handleSubmit} className="shadow-md">
        <div className="relative flex flex-col pl-2 py-2 bg-white dark:bg-gray-800">
          <div className="relative flex flex-1 w-full gap-2">
            <TextareaAutosize
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="p-2 max-h-[40dvh] w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="mr-1 bottom-2 shadow-lg bg-blue-500 p-2 text-white font-bold rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isStreaming || !selectedModel || isCheckingTokens}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-row flex-wrap gap-4 sm:gap-2 justify-center sm:justify-between items-center mt-2">
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

            <div className="flex flex-col items-center gap-2 pr-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div className="">
                  Chat cost:{" "}
                  <span
                    className={cn(
                      typeof tokenCost === "number" &&
                        tokenCost > TOKEN_WARNING_THRESHOLD &&
                        "text-red-600"
                    )}
                  >
                    {typeof tokenCost === "number"
                      ? tokenCost.toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div className="">
                  Tokens left:{" "}
                  {typeof currentTokensLeft === "number"
                    ? currentTokensLeft.toLocaleString()
                    : "N/A"}
                </div>

                <Link
                  href="/token-store"
                  className="text-purple-500 hover:bg-purple-500 hover:text-white font-bold"
                >
                  Buy more tokens
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      <OutOfTokensDialog
        isOpen={showOutOfTokensDialog}
        onClose={() => setShowOutOfTokensDialog(false)}
        onUpgrade={handleUpgrade}
      />

      <PremiumModelDialog
        isOpen={showPremiumModelDialog}
        onClose={() => setShowPremiumModelDialog(false)}
        onSignIn={handleSignIn}
        modelName={
          models.find((model) => model.id === selectedModel)?.name ||
          "Premium model"
        }
      />
    </>
  );
};

export default ChatInput;
