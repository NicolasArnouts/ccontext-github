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

interface PremiumModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  modelName: string;
}

const PremiumModelDialog: React.FC<PremiumModelDialogProps> = ({
  isOpen,
  onClose,
  onSignIn,
  modelName,
}) => {
  const handleSignIn = () => {
    onSignIn();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Premium Model Selected</DialogTitle>
          <DialogDescription>
            You've selected {modelName}, which is a premium model. Sign in to
            access this and other premium features.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSignIn}>Sign In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModelDialog;
