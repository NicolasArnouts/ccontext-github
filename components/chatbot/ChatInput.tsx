import React, { useState, useCallback, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import ModelSelector from "./ModelSelector";
import { Model } from "@prisma/client";

interface ChatInputProps {
  onSubmit: (message: string, modelId: string) => void;
  disabled?: boolean;
  models: Model[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  disabled,
  models,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    if (models && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

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
      <div className="relative flex p-2 bg-gray-100 dark:bg-gray-800">
        <div className="relative flex flex-1 flex-col w-full p-2">
          <TextareaAutosize
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="p-2 max-h-[40dvh] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={disabled}
          />

          <div className="flex w-full gap-2 justify-between pt-2">
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />

            <div className="p-2 flex">
              {/* Display tokens left here */}
              Tokens left: {/* Add logic to display tokens left */}
            </div>
          </div>
        </div>

        <div className="absolute flex items-start justify-start h-full right-0 p-0 top-0">
          <div className="flex flex-col h-full p-0">
            <button
              type="submit"
              className="bg-blue-500 mt-2 p-1 text-white font-bold rounded-xl px-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={disabled || !selectedModel}
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
