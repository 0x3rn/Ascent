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

function isValidSessionCookie(
  cookieValue: string | undefined,
  secretKey: string
): boolean {
  if (!cookieValue) {
    return false;
  }

  const parts = cookieValue.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [version, expiresAt, signature] = parts;
  const expiresAtMs = Number(expiresAt);

  if (
    version !== TURNSTILE_SESSION_VERSION ||
    !Number.isSafeInteger(expiresAtMs) ||
    expiresAtMs <= Date.now()
  ) {
    return false;
  }

  const expectedSignature = signSessionExpiry(expiresAt, secretKey);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function createSessionCookieValue(secretKey: string): string {
  const expiresAt = String(
    Date.now() + TURNSTILE_SESSION_TTL_SECONDS * 1000
  );
  const signature = signSessionExpiry(expiresAt, secretKey);

  return `${TURNSTILE_SESSION_VERSION}.${expiresAt}.${signature}`;
}

export async function verifyTurnstileSession(token?: string): Promise<void> {
  const secretKey = getTurnstileSecretKey();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TURNSTILE_SESSION_COOKIE)?.value;

  if (isValidSessionCookie(sessionCookie, secretKey)) {
    return;
  }

  if (sessionCookie) {
    cookieStore.delete(TURNSTILE_SESSION_COOKIE);
  }

  if (!token) {
    throw new Error("Unauthorized: Turnstile verification required.");
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
    throw new Error("Turnstile verification is temporarily unavailable.");
  }

  if (!response.ok) {
    throw new Error("Turnstile verification is temporarily unavailable.");
  }

  const outcome =
    (await response.json()) as TurnstileVerificationResponse;

  if (!outcome.success) {
    const codes = outcome["error-codes"]?.join(", ") || "unknown";
    throw new Error(
      `Unauthorized: Turnstile verification failed (${codes}).`
    );
  }

  cookieStore.set(
    TURNSTILE_SESSION_COOKIE,
    createSessionCookieValue(secretKey),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: TURNSTILE_SESSION_TTL_SECONDS,
      path: "/",
      priority: "high",
    }
  );
}
