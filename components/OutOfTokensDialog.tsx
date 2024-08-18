"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OutOfTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const OutOfTokensDialog: React.FC<OutOfTokensDialogProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Out of Tokens</DialogTitle>
          <DialogDescription>
            You've used all your available tokens. Upgrade your plan to continue
            using the AI assistant with increased limits.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={onUpgrade}>Upgrade Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutOfTokensDialog;
