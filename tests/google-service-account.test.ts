import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  createServiceAccountAssertion,
  getGoogleAccessToken,
  parseServiceAccountCredentials,
} from "../lib/google-service-account.ts";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const credentials = {
  type: "service_account",
  client_email: "test@example.iam.gserviceaccount.com",
  private_key: privateKey,
  private_key_id: "test-key-id",
};

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

test("validates and normalizes service-account credentials", () => {
  const parsed = parseServiceAccountCredentials(
    JSON.stringify({ ...credentials, private_key: privateKey.replace(/\n/g, "\\n") })
  );
  assert.equal(parsed.client_email, credentials.client_email);
  assert.match(parsed.private_key, /BEGIN PRIVATE KEY/);
  assert.ok(parsed.private_key.includes("\n"));
});

test("rejects invalid JSON and missing required fields", () => {
  assert.throws(
    () => parseServiceAccountCredentials("not-json"),
    /not valid JSON/
  );
  assert.throws(
    () => parseServiceAccountCredentials(JSON.stringify({ type: "authorized_user" })),
    /service_account type/
  );
  assert.throws(
    () => parseServiceAccountCredentials(JSON.stringify({ type: "service_account" })),
    /client_email/
  );
});

test("creates a correctly scoped, one-hour RS256 assertion", async () => {
  const parsed = parseServiceAccountCredentials(JSON.stringify(credentials));
  const assertion = await createServiceAccountAssertion(parsed, 1_700_000_000);
  const [encodedHeader, encodedClaims, encodedSignature] = assertion.split(".");
  const header = decodeJwtPart(encodedHeader);
  const claims = decodeJwtPart(encodedClaims);

  assert.equal(header.alg, "RS256");
  assert.equal(header.kid, "test-key-id");
  assert.equal(claims.iss, credentials.client_email);
  assert.equal(claims.aud, "https://oauth2.googleapis.com/token");
  assert.equal(claims.scope, "https://www.googleapis.com/auth/cloud-platform");
  assert.equal(claims.iat, 1_700_000_000);
  assert.equal(claims.exp, 1_700_003_600);
  assert.ok(encodedSignature.length > 100);
});

test("rejects malformed private keys without exposing their contents", async () => {
  const parsed = parseServiceAccountCredentials(
    JSON.stringify({ ...credentials, private_key: "invalid-private-key" })
  );
  await assert.rejects(
    createServiceAccountAssertion(parsed, 1_700_000_000),
    /private_key could not be imported/
  );
});

test("posts the JWT grant and returns the access token", async () => {
  let requestBody = "";
  const fetchImpl: typeof fetch = async (input, init) => {
    assert.equal(input, "https://oauth2.googleapis.com/token");
    assert.equal(init?.method, "POST");
    requestBody = String(init?.body);
    return Response.json({
      access_token: "test-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
  };

  const token = await getGoogleAccessToken(JSON.stringify(credentials), {
    cache: false,
    fetchImpl,
    now: () => 1_700_000_000_000,
  });
  const body = new URLSearchParams(requestBody);
  assert.equal(body.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  assert.equal(body.get("assertion")?.split(".").length, 3);
  assert.equal(token, "test-access-token");
});

test("reports token endpoint and malformed-response failures safely", async () => {
  await assert.rejects(
    getGoogleAccessToken(JSON.stringify(credentials), {
      cache: false,
      fetchImpl: async () => new Response("provider details", { status: 401 }),
    }),
    /HTTP 401/
  );

  await assert.rejects(
    getGoogleAccessToken(JSON.stringify(credentials), {
      cache: false,
      fetchImpl: async () => Response.json({ token_type: "Bearer" }),
    }),
    /did not return an access token/
  );
});
