import React, { useState, useCallback, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import ModelSelector from "./ModelSelector";
import { Model } from "@prisma/client";

interface ChatInputProps {
  onSubmit: (message: string, modelId: string) => void;
  disabled?: boolean;
  tokensLeft: number | null;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  disabled,
  tokensLeft,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

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
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (inputValue.trim() && !disabled && selectedModel) {
        onSubmit(inputValue.trim(), selectedModel);
        setInputValue("");
      }
    },
    [inputValue, onSubmit, disabled, selectedModel]
  );

  return (
    <form onSubmit={handleSubmit} className="shadow-md">
      <div className="relative flex flex-col p-2 bg-none   dark:bg-gray-800">
        <div className="relative flex flex-1 w-full ">
          <TextareaAutosize
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="p-2 max-h-[40dvh] w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={disabled}
          />
          <button
            type="submit"
            className="absolute right-4 bottom-4 bg-blue-500 p-2 text-white font-bold rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={disabled || !selectedModel}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-between items-center mt-2">
          {isLoadingModels ? (
            <div>Loading models...</div>
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
