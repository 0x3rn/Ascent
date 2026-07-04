"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "sonner";

interface TurnstileContextType {
  turnstileToken: string | undefined;
  isSessionVerified: boolean;
  handleUnauthorized: (e: any) => void;
  setSessionVerified: () => void;
}

const TurnstileContext = createContext<TurnstileContextType | null>(null);

export function TurnstileProvider({ children }: { children: ReactNode }) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  const handleUnauthorized = (e: any) => {
    if (e?.message?.includes("Unauthorized") || e?.message?.includes("Turnstile")) {
      setTurnstileToken(null);
      setIsSessionVerified(false);
      toast.error("Security Verification Required", {
        description: "Your session has expired. Please complete the security check to continue."
      });
    } else {
      toast.error("Error", { description: e?.message || "An unexpected error occurred." });
    }
  };

  const setSessionVerified = () => setIsSessionVerified(true);

  return (
    <TurnstileContext.Provider value={{ turnstileToken: turnstileToken || undefined, isSessionVerified, handleUnauthorized, setSessionVerified }}>
      {children}
      {!isSessionVerified && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => {
              setTurnstileToken(null);
              toast.error("Security check failed. Please try again.");
            }}
            onExpire={() => {
              setTurnstileToken(null);
              toast.error("Security check expired.", {
                description: "Please complete the check again before your next action."
              });
            }}
          />
        </div>
      )}
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  const ctx = useContext(TurnstileContext);
  if (!ctx) throw new Error("useTurnstile must be used within TurnstileProvider");
  return ctx;
}
