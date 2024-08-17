"use client";

// components/Header.tsx
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ModeToggle";

const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto flex justify-between items-center py-4">
        <div>
          <h1 className="text-2xl font-bold">GitHub CContext</h1>
          <h2 className="text-sm">Chat with any github codebase you want!</h2>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
