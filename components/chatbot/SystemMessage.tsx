"use client";

import React, { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SystemMessageProps {
  content: string;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ content }) => {
  const memoizedMarkdown = useMemo(() => {
    return <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>;
  }, [content]);

  return (
    <div className="justify-start mb-4">
      <div className="bg-gray-200 dark:bg-gray-800 dark:text-white rounded-lg py-2 px-4 overflow-x-auto">
        {memoizedMarkdown}
      </div>
    </div>
  );
};

export default SystemMessage;
