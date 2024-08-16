import React, { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled }) => {
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

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
        onSubmit(inputValue);
        setInputValue("");
      }
    },
    [inputValue, onSubmit, disabled]
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 shadow-md">
      <div className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white font-bold px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
