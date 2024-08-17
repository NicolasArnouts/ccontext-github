"use client";

import React from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";

interface MarkdownDisplayProps {
  content: string;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content }) => {
  const { theme } = useTheme();

  return (
    <div className="markdown-content" data-color-mode={theme ? theme : "light"}>
      <MarkdownPreview
        source={content}
        style={{ backgroundColor: "transparent" }}
      />
    </div>
  );
};

export default MarkdownDisplay;
