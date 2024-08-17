"use client";

import React, { useState, useCallback } from "react";
import ScrollToBottomButton from "./ScrollToBottomButton";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (inputValue.trim() && !disabled) {
        onSubmit(inputValue.trim());
        setInputValue("");
      }
    },
    [inputValue, onSubmit, disabled]
  );

  return (
    <form onSubmit={handleSubmit} className=" shadow-md">
      <div className="relative flex p-2 bg-red-200">
        <div className="relative flex flex-1 flex-col  w-full p-2 ">
          <TextareaAutosize
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className=" p-2 max-h-[40dvh] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={disabled}
          />

          <div className="bg-blue-200 flex w-full gap-2 justify-between">
            <div className="bg-gray-200 p-2 flex">Choose ur option</div>

            <div className="bg-gray-200 p-2 flex">credits left</div>
          </div>
        </div>

        <div className="absolute flex items-start justify-start h-full  right-0 p-0 top-0">
          <div className="flex flex-col h-full  p-0">
            <button
              type="submit"
              className="bg-blue-500 mt-2 p-1 text-white font-bold rounded-xl px-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={disabled}
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
