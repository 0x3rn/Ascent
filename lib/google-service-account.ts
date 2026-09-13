const GOOGLE_CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWT_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";

type ServiceAccountCredentials = {
  type: "service_account";
  client_email: string;
  private_key: string;
  private_key_id?: string;
};

type AccessTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
};

export type GoogleAccessTokenOptions = {
  cache?: boolean;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

let cachedToken: { token: string; expiresAt: number } | undefined;

function requireNonEmptyString(
  record: Record<string, unknown>,
  field: string
): string {
  const value = record[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Google service-account credentials are missing ${field}.`);
  }
  return value.trim();
}

export function parseServiceAccountCredentials(
  credentialsJson: string
): ServiceAccountCredentials {
  let parsed: unknown;
  try {
    parsed = JSON.parse(credentialsJson);
  } catch {
    throw new Error("Google service-account credentials are not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Google service-account credentials must be a JSON object.");
  }

  const record = parsed as Record<string, unknown>;
  if (record.type !== "service_account") {
    throw new Error("Google credentials must use the service_account type.");
  }

  const privateKeyId = record.private_key_id;
  if (
    privateKeyId !== undefined &&
    (typeof privateKeyId !== "string" || !privateKeyId.trim())
  ) {
    throw new Error("Google service-account private_key_id is invalid.");
  }

  return {
    type: "service_account",
    client_email: requireNonEmptyString(record, "client_email"),
    private_key: requireNonEmptyString(record, "private_key").replace(/\\n/g, "\n"),
    ...(typeof privateKeyId === "string"
      ? { private_key_id: privateKeyId.trim() }
      : {}),
  };
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeJson(value: object): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function privateKeyToPkcs8(privateKey: string): ArrayBuffer {
  const match = privateKey.match(
    /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/
  );
  if (!match) {
    throw new Error("Google service-account private_key is not a PKCS8 PEM key.");
  }

  const encoded = match[1].replace(/\s/g, "");
  let binary: string;
  try {
    binary = atob(encoded);
  } catch {
    throw new Error("Google service-account private_key contains invalid base64.");
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export async function createServiceAccountAssertion(
  credentials: ServiceAccountCredentials,
  issuedAtSeconds: number
): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
    ...(credentials.private_key_id
      ? { kid: credentials.private_key_id }
      : {}),
  };
  const claims = {
    iss: credentials.client_email,
    scope: GOOGLE_CLOUD_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + 3600,
  };
  const unsignedAssertion = `${encodeJson(header)}.${encodeJson(claims)}`;

  let signingKey: CryptoKey;
  try {
    signingKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyToPkcs8(credentials.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  } catch {
    throw new Error("Google service-account private_key could not be imported.");
  }

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    new TextEncoder().encode(unsignedAssertion)
  );
  return `${unsignedAssertion}.${base64Url(new Uint8Array(signature))}`;
}

export async function getGoogleAccessToken(
  credentialsJson: string,
  options: GoogleAccessTokenOptions = {}
): Promise<string> {
  const now = options.now?.() ?? Date.now();
  if (
    options.cache !== false &&
    cachedToken &&
    cachedToken.expiresAt - now > 60_000
  ) {
    return cachedToken.token;
  }

  const credentials = parseServiceAccountCredentials(credentialsJson);
  const assertion = await createServiceAccountAssertion(
    credentials,
    Math.floor(now / 1000)
  );
  const response = await (options.fetchImpl ?? fetch)(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(15_000),
    body: new URLSearchParams({
      grant_type: JWT_GRANT_TYPE,
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Google authentication failed with HTTP ${response.status}. Check the service-account key and system clock.`
    );
  }

  let payload: AccessTokenResponse;
  try {
    payload = (await response.json()) as AccessTokenResponse;
  } catch {
    throw new Error("Google authentication returned an invalid response.");
  }

  if (typeof payload.access_token !== "string" || !payload.access_token) {
    throw new Error("Google authentication did not return an access token.");
  }

  const expiresIn =
    typeof payload.expires_in === "number" && payload.expires_in > 0
      ? Math.min(payload.expires_in, 3600)
      : 3600;
  if (options.cache !== false) {
    cachedToken = {
      token: payload.access_token,
      expiresAt: now + expiresIn * 1000,
    };
  }
  return payload.access_token;
}
