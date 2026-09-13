import OpenAI from "openai";
import { getGoogleAccessToken } from "../lib/google-service-account.ts";

process.loadEnvFile(".env.local");

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!projectId || !credentialsJson) {
  throw new Error("The local Google Cloud environment variables are missing.");
}

const accessToken = await getGoogleAccessToken(credentialsJson);
const gemini = new OpenAI({
  apiKey: accessToken,
  baseURL:
    `https://aiplatform.googleapis.com/v1/` +
    `projects/${projectId}/locations/global/endpoints/openapi`,
});
const response = await gemini.chat.completions.create({
  model: "google/gemini-3.7-flash",
  messages: [{ role: "user", content: "Reply with exactly: auth verified" }],
  max_tokens: 256,
  temperature: 0,
});
const content = response.choices[0]?.message?.content?.trim();

if (!content) {
  throw new Error("Vertex AI authenticated, but returned an empty response.");
}

console.log("Google authentication and Vertex AI request verified successfully.");
