"use client";

import React from "react";

interface CalculatedTokensProps {
  tokens: number;
}

const CalculatedTokens: React.FC<CalculatedTokensProps> = ({ tokens }) => {
  return (
    <div className="flex rounded-lg">
      <span className="text-lg font-semibold text-foreground">
        context size: {tokens}
      </span>
    </div>
  );
};

export default CalculatedTokens;
