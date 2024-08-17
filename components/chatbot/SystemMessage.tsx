"use client";

import React, { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MarkdownDisplay from "../MarkdownDisplay";

interface SystemMessageProps {
  content: string;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ content }) => {
  const memoizedMarkdown = useMemo(() => {
    // return <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>;

    return (
      <div className="overflow-x-auto">{MarkdownDisplay({ content })}</div>
    );
  }, [content]);

  return (
    <div className="justify-start mb-4">
      <div className="relative bg-gray-100 dark:bg-gray-800 dark:text-white rounded-lg py-2 px-4 ">
        {memoizedMarkdown}
      </div>
    </div>
  );
};

export default SystemMessage;
