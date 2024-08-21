import React from "react";

interface ParsedFileTreeProps {
  fileTree: string;
}

const ParsedFileTree: React.FC<ParsedFileTreeProps> = ({ fileTree }) => {
  const renderFileTree = (tree: string) => {
    return tree.split("\n").map((line, index) => {
      const indent = line.search(/\S/);
      const content = line.trim();
      const isDirectory = content.startsWith("📁");
      const isExcluded = content.includes("[Excluded]");

      return (
        <div
          key={index}
          style={{ marginLeft: `${indent * 10}px` }}
          className={`${isExcluded ? "text-gray-400" : ""} ${
            isDirectory ? "font-bold" : ""
          }`}
        >
          {content}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col bg-background border border-border rounded-lg">
      {/* <h3 className="  w-full items-center text-center text-xl font-semibold text-foreground">
        File Tree:
      </h3> */}
      <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto max-h-96 p-2">
        {renderFileTree(fileTree)}
      </pre>
    </div>
  );
};

export default ParsedFileTree;
