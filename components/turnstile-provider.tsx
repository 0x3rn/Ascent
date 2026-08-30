"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";
import { toast } from "sonner";

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

interface TurnstileContextType {
  turnstileToken: string | undefined;
  isSessionVerified: boolean;
  handleUnauthorized: (error: unknown) => void;
  setSessionVerified: () => void;
}

const TurnstileContext = createContext<TurnstileContextType | null>(null);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export function TurnstileProvider({ children }: { children: ReactNode }) {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const [isChallengeVisible, setIsChallengeVisible] = useState(false);
  const configuredSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const siteKey =
    configuredSiteKey ||
    (process.env.NODE_ENV !== "production"
      ? TURNSTILE_TEST_SITE_KEY
      : undefined);

  const resetVerification = useCallback(() => {
    setTurnstileToken(null);
    setIsSessionVerified(false);
    turnstileRef.current?.reset();
  }, []);

  const handleUnauthorized = useCallback(
    (error: unknown) => {
      const message = getErrorMessage(error);

      if (
        message.includes("Unauthorized") ||
        message.includes("Turnstile")
      ) {
        resetVerification();
        toast.error("Security Verification Required", {
          description:
            message ||
            "Your session has expired. Please complete the security check to continue.",
        });
      } else {
        toast.error("Error", {
          description: message || "An unexpected error occurred.",
        });
      }
    },
    [resetVerification]
  );

  const setSessionVerified = useCallback(() => {
    setIsSessionVerified(true);
    setTurnstileToken(null);
    setIsChallengeVisible(false);
  }, []);

  return (
    <TurnstileContext.Provider
      value={{
        turnstileToken: turnstileToken || undefined,
        isSessionVerified,
        handleUnauthorized,
        setSessionVerified,
      }}
    >
      {children}
      {!isSessionVerified && !siteKey && (
        <div
          className="fixed bottom-4 left-1/2 z-[9999] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-xl dark:border-red-900/70 dark:bg-zinc-950 dark:text-red-300"
          role="alert"
        >
          Security verification is temporarily unavailable.
        </div>
      )}
      {!isSessionVerified && siteKey && (
        <div
          className={`fixed bottom-3 left-1/2 z-[9999] -translate-x-1/2 transition duration-200 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0 ${
            isChallengeVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
          aria-hidden={!isChallengeVisible}
        >
          <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white p-1 shadow-[0_16px_45px_rgba(15,23,42,0.22)] dark:border-zinc-700 dark:bg-zinc-900">
            <Turnstile
              ref={turnstileRef}
              className="overflow-hidden rounded-lg"
              siteKey={siteKey}
              options={{
                action: "ai_action",
                appearance: "interaction-only",
                execution: "render",
                refreshExpired: "auto",
                refreshTimeout: "auto",
                theme: "auto",
              }}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setIsChallengeVisible(false);
              }}
              onBeforeInteractive={() => setIsChallengeVisible(true)}
              onAfterInteractive={() => setIsChallengeVisible(false)}
              onExpire={() => setTurnstileToken(null)}
              onTimeout={() => {
                setTurnstileToken(null);
                setIsChallengeVisible(true);
              }}
              onError={() => {
                setTurnstileToken(null);
                setIsChallengeVisible(true);
                toast.error("Security verification failed", {
                  description: "Please try the verification again.",
                });
              }}
            />
          </div>
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
