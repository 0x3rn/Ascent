import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_SESSION_COOKIE = "ascent_turnstile_session";
const TURNSTILE_SESSION_VERSION = "v1";
const TURNSTILE_SESSION_TTL_SECONDS = 60 * 60;
const TURNSTILE_TEST_SECRET_KEY =
  "1x0000000000000000000000000000000AA";

interface TurnstileVerificationResponse {
  success: boolean;
  "error-codes"?: string[];
}

export type TurnstileSessionStatus =
  | { ok: true; verified: false }
  | { ok: true; verified: true; expiresAt: number }
  | { ok: false; verified: false; message: string };

export type TurnstileChallengeResult =
  | { ok: true; expiresAt: number }
  | { ok: false; message: string };

function getTurnstileSecretKey(): string {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (secretKey) {
    return secretKey;
  }

  if (process.env.NODE_ENV !== "production") {
    return TURNSTILE_TEST_SECRET_KEY;
  }

  throw new Error(
    "Server configuration error: TURNSTILE_SECRET_KEY is not configured."
  );
}

function signSessionExpiry(expiresAt: string, secretKey: string): string {
  return createHmac("sha256", secretKey)
    .update(`${TURNSTILE_SESSION_VERSION}:${expiresAt}`)
    .digest("hex");
}

function getValidSessionExpiry(
  cookieValue: string | undefined,
  secretKey: string
): number | undefined {
  if (!cookieValue) {
    return undefined;
  }

  const parts = cookieValue.split(".");
  if (parts.length !== 3) {
    return undefined;
  }

  const [version, expiresAt, signature] = parts;
  const expiresAtMs = Number(expiresAt);

  if (
    version !== TURNSTILE_SESSION_VERSION ||
    !Number.isSafeInteger(expiresAtMs) ||
    expiresAtMs <= Date.now()
  ) {
    return undefined;
  }

  const expectedSignature = signSessionExpiry(expiresAt, secretKey);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return undefined;
  }

  return expiresAtMs;
}

function createSessionCookie(secretKey: string): {
  expiresAt: number;
  value: string;
} {
  const expiresAt = Date.now() + TURNSTILE_SESSION_TTL_SECONDS * 1000;
  const expiresAtValue = String(expiresAt);
  const signature = signSessionExpiry(expiresAtValue, secretKey);

  return {
    expiresAt,
    value: `${TURNSTILE_SESSION_VERSION}.${expiresAtValue}.${signature}`,
  };
}

export async function readTurnstileSession(): Promise<TurnstileSessionStatus> {
  let secretKey: string;

  try {
    secretKey = getTurnstileSecretKey();
  } catch {
    return {
      ok: false,
      verified: false,
      message: "Security verification is temporarily unavailable.",
    };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TURNSTILE_SESSION_COOKIE)?.value;
  const expiresAt = getValidSessionExpiry(sessionCookie, secretKey);

  if (expiresAt) {
    return { ok: true, verified: true, expiresAt };
  }

  if (sessionCookie) {
    cookieStore.delete(TURNSTILE_SESSION_COOKIE);
  }

  return { ok: true, verified: false };
}

export async function validateTurnstileChallenge(
  token: string
): Promise<TurnstileChallengeResult> {
  if (!token) {
    return {
      ok: false,
      message: "Please complete the security check.",
    };
  }

  let secretKey: string;

  try {
    secretKey = getTurnstileSecretKey();
  } catch {
    return {
      ok: false,
      message: "Security verification is temporarily unavailable.",
    };
  }

  const formData = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  let response: Response;

  try {
    response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      message: "We couldn't verify the security check. Please try again.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: "We couldn't verify the security check. Please try again.",
    };
  }

  const outcome =
    (await response.json()) as TurnstileVerificationResponse;

  if (!outcome.success) {
    return {
      ok: false,
      message: "The security check expired or was unsuccessful. Please try again.",
    };
  }

  const sessionCookie = createSessionCookie(secretKey);
  const cookieStore = await cookies();

  cookieStore.set(
    TURNSTILE_SESSION_COOKIE,
    sessionCookie.value,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: TURNSTILE_SESSION_TTL_SECONDS,
      path: "/",
      priority: "high",
    }
  );

  return { ok: true, expiresAt: sessionCookie.expiresAt };
}

export async function verifyTurnstileSession(token?: string): Promise<void> {
  const session = await readTurnstileSession();

  if (session.ok && session.verified) {
    return;
  }

  if (token) {
    const challenge = await validateTurnstileChallenge(token);
    if (challenge.ok) {
      return;
    }
  }

  throw new Error("Turnstile verification required.");
}
