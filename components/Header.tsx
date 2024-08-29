"use client";

import { useEffect, useState } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";

interface UserInfo {
  isAuthenticated: boolean;
  userId: string;
  userTokens: any[]; // You might want to type this more specifically based on your UserTokens model
}

const Header = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/user-info");
        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [isSignedIn]);

  return (
    <header className="border-b">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link href="/">
          <h1 className="text-2xl font-bold">GitHub CContext</h1>
          <h2 className="text-sm">Chat with any github codebase you want!</h2>
        </Link>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <div className="flex items-center gap-2">
            {isLoaded ? (
              isSignedIn ? (
                <>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="text-sm font-medium">Sign In</button>
                  </SignInButton>
                </>
              )
            ) : (
              <span className="text-sm">Loading...</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
