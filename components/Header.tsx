"use client";

import { useEffect } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import { useUserStore } from "@/lib/store";

const Header = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userId, anonymousId, setUserId, setAnonymousId } = useUserStore();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/user-info");
        const data = await response.json();

        if (data.isAuthenticated) {
          setUserId(data.user.id);
          setAnonymousId(null);
        } else {
          setUserId(null);
          setAnonymousId(data.anonymousId);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    if (isLoaded) {
      if (isSignedIn) {
        setUserId(user.id);
        setAnonymousId(null);
      } else {
        fetchUserInfo();
      }
    }
  }, [isLoaded, isSignedIn, user, setUserId, setAnonymousId]);

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
                  {/* <span className="text-sm">User ID: {user.id}</span> */}
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  {/* <span className="text-sm">
                    Anonymous ID: {anonymousId || "Loading..."}
                  </span> */}
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
