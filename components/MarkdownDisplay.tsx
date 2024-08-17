"use client";

import React from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";

interface MarkdownDisplayProps {
  content: string;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content }) => {
  return (
    <div className="markdown-content">
      <MarkdownPreview
        source={content}
        style={{ backgroundColor: "transparent" }}
      />
    </div>
  );
};

export default MarkdownDisplay;
