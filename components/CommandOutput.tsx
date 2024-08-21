import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CalculatedTokens from "./CalculatedTokens";

interface CommandOutputProps {
  calculatedTokens: number | null;
  output: string;
  handleCopyToClipboard: (text: string) => void;
}

const CommandOutput: React.FC<CommandOutputProps> = ({
  calculatedTokens,
  output,
  handleCopyToClipboard,
}) => {
  return (
    <div className="w-full">
      <div>
        {/* {calculatedTokens !== null && (
          <CalculatedTokens tokens={calculatedTokens} />
        )} */}
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Command Output:
        </h3>
        <Textarea
          placeholder="Output will appear here..."
          value={output}
          readOnly
          className="h-64 font-mono text-sm mb-2 w-full bg-background text-foreground border-border"
        />
        {output && (
          <Button
            onClick={() => handleCopyToClipboard(output)}
            className="flex w-full mb-4"
          >
            Copy Output to Clipboard
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommandOutput;
