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
        <TextareaAutosize
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={disabled}
        />

        <button
          type="submit"
          className="absolute bg-blue-500 p-1 items-center text-white font-bold rounded-xl px-2 right-0 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <ArrowUp className="h-6 w-6 " />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
