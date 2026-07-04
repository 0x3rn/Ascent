"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTurnstile } from "@/components/turnstile-provider";

interface AiMagicButtonProps {
  onClick: () => Promise<string | void>;
  onResult: (text: string) => void;
  label?: string;
  className?: string;
}

export function AiMagicButton({
  onClick,
  onResult,
  label = "Enhance with AI",
  className,
}: AiMagicButtonProps) {
  const [loading, setLoading] = useState(false);
  const { handleUnauthorized, setSessionVerified } = useTurnstile();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await onClick();
      if (result) {
        onResult(result);
        setSessionVerified();
      }
    } catch (err: any) {
      console.error("AI enhancement failed:", err);
      handleUnauthorized(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="magic"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={cn("gap-1.5 shrink-0", className)}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Wand2 className="h-3 w-3" />
      )}
      {loading ? "Working..." : label}
    </Button>
  );
}
