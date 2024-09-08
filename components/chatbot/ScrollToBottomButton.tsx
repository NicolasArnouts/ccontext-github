"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      className="absolute bottom-1 right-3 p-2 rounded-full border border-gray-300 shadow-md bg-gray-200 opacity-80 dark:bg-gray-950"
      onClick={onClick}
    >
      <ChevronDown className="h-4 w-4" />
    </button>
  );
};

export default ScrollToBottomButton;
