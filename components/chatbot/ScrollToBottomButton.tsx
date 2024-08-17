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
    <Button
      className="absolute bottom-0 right-3 rounded-full px-2 border border-gray-300 shadow-md"
      onClick={onClick}
      variant="secondary"
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
};

export default ScrollToBottomButton;
