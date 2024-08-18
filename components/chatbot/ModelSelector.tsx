"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Model {
  id: string;
  name: string;
  tags: string[];
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models = [],
  selectedModel,
  onModelSelect,
}) => {
  if (models.length === 0) {
    return <div>No models available</div>;
  }

  return (
    <Select value={selectedModel} onValueChange={onModelSelect}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name} {model.tags.includes("Premium") && "🌟"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
