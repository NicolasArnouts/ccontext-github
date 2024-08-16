// components/SignInModal.tsx
import React from "react";
import { SignInButton } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In Required</DialogTitle>
          <DialogDescription>
            You've reached the limit for anonymous chats. Please sign in to
            continue using the AI assistant.
          </DialogDescription>
        </DialogHeader>
        <SignInButton mode="modal">
          <Button>Sign In</Button>
        </SignInButton>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
