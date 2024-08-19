"use client";

import React from "react";

interface CalculatedTokensProps {
  tokens: number;
}

const CalculatedTokens: React.FC<CalculatedTokensProps> = ({ tokens }) => {
  return (
    <div className="bg-background border border-border p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        Calculated Tokens:
      </h3>
      <p className="text-2xl font-bold text-primary">{tokens}</p>
    </div>
  );
};

export default CalculatedTokens;
