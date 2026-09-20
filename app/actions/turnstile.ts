"use server";

import {
  readTurnstileSession,
  validateTurnstileChallenge,
  type TurnstileChallengeResult,
  type TurnstileSessionStatus,
} from "@/lib/turnstile";

export async function getTurnstileSessionStatus(): Promise<TurnstileSessionStatus> {
  return readTurnstileSession();
}

export async function verifyTurnstileToken(
  token: string
): Promise<TurnstileChallengeResult> {
  return validateTurnstileChallenge(token);
}
