// app/token-store/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Model } from "@prisma/client";
import { useGithubCContextStore } from "@/lib/store";
import getStripe from "@/lib/get-stripejs";

const TokenStore = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { toast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tokenAmount, setTokenAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { tokensLeft, setTokensLeft } = useGithubCContextStore();

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (isSignedIn && selectedModel) {
      fetchTokensLeft(selectedModel);
    }
  }, [isSignedIn, selectedModel]);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models");
      if (response.ok) {
        const fetchedModels = await response.json();
        setModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModel(fetchedModels[0].id);
        }
      } else {
        throw new Error("Failed to fetch models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Error",
        description: "Failed to fetch models. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchTokensLeft = async (modelId: string) => {
    try {
      const response = await fetch(`/api/token-tracking?modelId=${modelId}`);
      if (response.ok) {
        const data = await response.json();
        setTokensLeft(modelId, data.remainingTokens);
      } else {
        throw new Error("Failed to fetch tokens left");
      }
    } catch (error) {
      console.error("Error fetching tokens left:", error);
      toast({
        title: "Error",
        description: "Failed to fetch remaining tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase tokens.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelId: selectedModel, amount: tokenAmount }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        const stripe = await getStripe();
        const { error } = await stripe!.redirectToCheckout({ sessionId });

        if (error) {
          console.error("Stripe checkout error:", error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast({
        title: "Purchase Failed",
        description:
          "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCost = (model: Model, amount: number) => {
    return (model.pricePerMillionTokens * amount) / 1000000;
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Token Store</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Tokens</CardTitle>
            <CardDescription>
              Select a model and amount of tokens to purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="model-select"
                  className="block text-sm font-medium mb-1"
                >
                  Select Model
                </label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => {
                    setSelectedModel(value);
                    fetchTokensLeft(value);
                  }}
                >
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} {model.tags.includes("Premium") && "🌟"} -
                        ${model.pricePerMillionTokens}/million tokens
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="tokens-left"
                  className="block text-sm font-medium mb-1"
                >
                  Tokens left for this model
                </label>
                <Input
                  id="tokens-left"
                  type="number"
                  value={tokensLeft[selectedModel] || 0}
                  disabled={true}
                />
              </div>
              <div>
                <label
                  htmlFor="token-amount"
                  className="block text-sm font-medium mb-1"
                >
                  Tokens to purchase
                </label>
                <Input
                  id="token-amount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Number(e.target.value))}
                  min={1000}
                  step={1000}
                />
              </div>
              {selectedModel && (
                <div>
                  <p className="text-sm font-medium">
                    Cost: $
                    {calculateCost(
                      models.find((m) => m.id === selectedModel)!,
                      tokenAmount
                    ).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePurchase}
              disabled={isLoading || !isSignedIn}
            >
              {isLoading ? "Processing..." : "Purchase Tokens"}
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Token Usage Tips</CardTitle>
            <CardDescription>Make the most of your tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Premium models offer advanced capabilities but are more
                expensive.
              </li>
              <li>
                Optimize your prompts to get better results with fewer tokens.
              </li>
              <li>
                Check your token balance regularly to ensure uninterrupted
                usage.
              </li>
              <li>
                Tokens are model-specific, so plan your purchases accordingly.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenStore;
