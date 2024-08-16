import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UserMessageProps {
  content: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="w-full flex justify-end mb-4 bg-red-200">
      <div className=" text-white rounded-lg py-2 px-4 max-w-full overflow-hidden	p-4 bg-blue-300  ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default UserMessage;
