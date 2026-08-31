"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import {
  getTurnstileSessionStatus,
  verifyTurnstileToken,
} from "@/app/actions/turnstile";

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const SUCCESS_DISPLAY_MS = 1800;

type WidgetPhase =
  | "checking"
  | "challenge"
  | "verifying"
  | "success"
  | "hidden"
  | "error";

type TimerRef = {
  current: ReturnType<typeof setTimeout> | null;
};

interface TurnstileContextType {
  turnstileToken: string | undefined;
  isSessionVerified: boolean;
  handleUnauthorized: (error: unknown) => void;
  setSessionVerified: () => void;
}

const TurnstileContext = createContext<TurnstileContextType | null>(null);

export function TurnstileProvider({ children }: { children: ReactNode }) {
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionExpiresAtRef = useRef<number | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const [widgetPhase, setWidgetPhase] = useState<WidgetPhase>("checking");
  const [isSessionVerified, setIsSessionVerified] = useState(false);
  const configuredSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const siteKey =
    configuredSiteKey ||
    (process.env.NODE_ENV !== "production"
      ? TURNSTILE_TEST_SITE_KEY
      : undefined);

  const clearTimer = useCallback((timerRef: TimerRef) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const requireVerification = useCallback(() => {
    clearTimer(expiryTimerRef);
    clearTimer(successTimerRef);
    sessionExpiresAtRef.current = null;
    setIsSessionVerified(false);
    setWidgetPhase("challenge");
    setWidgetKey((current) => current + 1);
  }, [clearTimer]);

  const scheduleSessionExpiry = useCallback(
    (expiresAt: number) => {
      clearTimer(expiryTimerRef);
      sessionExpiresAtRef.current = expiresAt;

      expiryTimerRef.current = setTimeout(
        requireVerification,
        Math.max(0, expiresAt - Date.now())
      );
    },
    [clearTimer, requireVerification]
  );

  useEffect(() => {
    let isActive = true;

    void getTurnstileSessionStatus()
      .then((session) => {
        if (!isActive) return;

        if (session.ok && session.verified) {
          setIsSessionVerified(true);
          setWidgetPhase("hidden");
          scheduleSessionExpiry(session.expiresAt);
          return;
        }

        setIsSessionVerified(false);
        setWidgetPhase(session.ok ? "challenge" : "error");
      })
      .catch((error: unknown) => {
        console.error("Unable to read the security session:", error);
        if (isActive) setWidgetPhase("error");
      });

    return () => {
      isActive = false;
      clearTimer(expiryTimerRef);
      clearTimer(successTimerRef);
    };
  }, [clearTimer, scheduleSessionExpiry]);

  useEffect(() => {
    const checkForExpiredSession = () => {
      const expiresAt = sessionExpiresAtRef.current;
      if (expiresAt && Date.now() >= expiresAt) {
        requireVerification();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForExpiredSession();
      }
    };

    window.addEventListener("focus", checkForExpiredSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", checkForExpiredSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [requireVerification]);

  const handleUnauthorized = useCallback(
    (error: unknown) => {
      console.error("AI action failed:", error);

      void getTurnstileSessionStatus()
        .then((session) => {
          if (!session.ok || !session.verified) {
            requireVerification();
            toast.error("Security check expired", {
              description:
                "Please verify that you're human, then try the action again.",
            });
            return;
          }

          scheduleSessionExpiry(session.expiresAt);
          toast.error("We couldn't complete that action", {
            description:
              "Please try again. If the problem continues, wait a moment and retry.",
          });
        })
        .catch((sessionError: unknown) => {
          console.error("Unable to refresh the security session:", sessionError);
          requireVerification();
          toast.error("Security check required", {
            description:
              "Please verify that you're human, then try the action again.",
          });
        });
    },
    [requireVerification, scheduleSessionExpiry]
  );

  const setSessionVerified = useCallback(() => {
    setIsSessionVerified(true);
  }, []);

  const handleChallengeSuccess = useCallback(
    async (token: string) => {
      setWidgetPhase("verifying");

      try {
        const result = await verifyTurnstileToken(token);

        if (!result.ok) {
          setIsSessionVerified(false);
          setWidgetPhase("error");
          toast.error("Security check unsuccessful", {
            description: result.message,
          });
          successTimerRef.current = setTimeout(requireVerification, 1200);
          return;
        }

        setIsSessionVerified(true);
        scheduleSessionExpiry(result.expiresAt);
        setWidgetPhase("success");
        clearTimer(successTimerRef);
        successTimerRef.current = setTimeout(
          () => setWidgetPhase("hidden"),
          SUCCESS_DISPLAY_MS
        );
      } catch (error) {
        console.error("Unable to confirm the security challenge:", error);
        setIsSessionVerified(false);
        setWidgetPhase("error");
        toast.error("Security check couldn't be confirmed", {
          description: "Please check your connection and try again.",
        });
        successTimerRef.current = setTimeout(requireVerification, 1200);
      }
    },
    [clearTimer, requireVerification, scheduleSessionExpiry]
  );

  const shouldShowWidget =
    Boolean(siteKey) &&
    widgetPhase !== "checking" &&
    widgetPhase !== "hidden";

  return (
    <TurnstileContext.Provider
      value={{
        turnstileToken: undefined,
        isSessionVerified,
        handleUnauthorized,
        setSessionVerified,
      }}
    >
      {children}

      {!siteKey && widgetPhase !== "checking" && (
        <div
          className="fixed bottom-3 right-3 z-[9999] w-[min(22rem,calc(100vw-1.5rem))] rounded-xl bg-zinc-950 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-white/10"
          role="alert"
        >
          Security verification is temporarily unavailable. Please try again
          later.
        </div>
      )}

      {shouldShowWidget && siteKey && (
        <div
          className="fixed bottom-3 right-3 z-[9999] transition-[opacity,transform] duration-200 motion-reduce:transition-none sm:bottom-4 sm:right-4"
          aria-label="Cloudflare security verification"
          aria-live="polite"
        >
          <Turnstile
            key={widgetKey}
            siteKey={siteKey}
            options={{
              action: "ai_action",
              appearance: "always",
              execution: "render",
              refreshExpired: "auto",
              refreshTimeout: "auto",
              size: "normal",
              theme: "auto",
            }}
            onSuccess={handleChallengeSuccess}
            onExpire={requireVerification}
            onTimeout={requireVerification}
            onError={() => {
              setIsSessionVerified(false);
              setWidgetPhase("error");
              toast.error("Security check couldn't load", {
                description: "Check your connection and try again.",
              });
            }}
          />
        </div>
      )}
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  const context = useContext(TurnstileContext);
  if (!context) {
    throw new Error("useTurnstile must be used within TurnstileProvider");
  }
  return context;
}
