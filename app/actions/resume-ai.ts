"use server";

import OpenAI from "openai";

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set");
  }
  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });
}

const STRICT_SYSTEM_PROMPT = `You are an expert resume writer. You MUST return ONLY the requested text.
- NEVER include any conversational preamble, greeting, or closing.
- NEVER say things like "Sure!", "Here you go:", "I've enhanced...", or anything similar.
- NEVER wrap your response in quotes or markdown code fences.
- CRITICAL: DO NOT use em-dashes (—) under any circumstances. Use commas, semicolons, or standard hyphens (-) instead.
- Return ONLY the raw text content that belongs in the resume field.`;

async function runDeepSeek(prompt: string, maxTokens: number = 2048): Promise<string> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: STRICT_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: maxTokens,
  });
  const text = response.choices[0]?.message?.content?.trim() ?? "";
  // Post-process: replace any remaining em-dashes
  return text.replace(/—/g, "-").replace(/\u2014/g, "-");
}

export async function enhanceBulletPoint(bulletText: string): Promise<string> {
  const prompt = `Rewrite the following resume bullet point using strong action verbs, quantifiable metrics, and concise, impactful phrasing. Use the formula: [Action Verb] + [What Was Done] + [Measurable Result/Impact].

If the input lacks metrics, infer reasonable ones based on the context.

Input: "${bulletText}"

Return ONLY the rewritten bullet point. Do not add bullet characters unless the input had one.`;
  return runDeepSeek(prompt);
}

export async function tailorToJob(
  experienceBullets: string,
  jobDescription: string
): Promise<string> {
  const prompt = `I have the following resume bullet points:

"""
${experienceBullets}
"""

I want to tailor them to this job description:

"""
${jobDescription}
"""

Your task: Rewrite each bullet point to naturally incorporate relevant keywords and phrases from the job description. Keep the original structure and order. Use strong action verbs and metrics where possible. Do NOT fabricate entirely new experiences — only tweak wording and emphasis to better align with the target role.

Return ONLY the rewritten bullet points, maintaining the same bullet format (one per line with the same bullet character). Do NOT add or remove bullets. Return EXACTLY the same number of bullets as the input.`;
  return runDeepSeek(prompt);
}

export async function fixGrammar(bulletText: string): Promise<string> {
  const prompt = `Fix any grammar, spelling, or punctuation issues in the following text. Improve sentence flow and clarity. Maintain the original tone and structure. Do not rewrite from scratch — only polish.

Input: "${bulletText}"

Return ONLY the corrected text.`;
  return runDeepSeek(prompt);
}

export async function enhanceSummary(summary: string): Promise<string> {
  const prompt = `Rewrite the following professional summary to be more compelling, concise, and impactful. Use strong language that conveys leadership, results-orientation, and domain expertise. Keep it under 5 sentences.

Input: "${summary}"

Return ONLY the rewritten summary. No preamble, no closing remarks.`;
  return runDeepSeek(prompt);
}

export async function generateCoverLetter(
  targetRole: string,
  companyName: string,
  candidateBackground: string
): Promise<string> {
  const hasBackground: boolean = !!(candidateBackground && candidateBackground.trim().length > 0);

  const prompt = `You are an expert executive career coach. Write a highly persuasive, 3-4 paragraph cover letter for a ${targetRole} position at ${companyName}.

Use strong industry buzzwords and impactful action verbs, but the overall tone MUST sound entirely human, authentic, and passionate.

Do NOT use generic AI cliches like "delve", "testament", "tapestry", or "thrilled to apply".

CRITICAL: DO NOT use em-dashes (—) under any circumstances. Use commas, semicolons, or standard hyphens (-) instead.

${
  hasBackground
    ? `Reference the candidate's provided background naturally. Here is the candidate's resume information:\n\n"""\n${candidateBackground}\n"""\n`
    : `Since no resume background is provided, write a highly professional, generalized cover letter based solely on the target role and company. Focus on the value the candidate would bring to ${companyName} as a ${targetRole}.`
}

Return ONLY the raw cover letter body text (the paragraphs between the salutation and sign-off). No date line, no address block, no salutation, no closing sign-off — just the body paragraphs. Each paragraph separated by a blank line. No conversational filler.`;

  return runDeepSeek(prompt, 1024);
}

export async function shortenCoverLetter(currentText: string): Promise<string> {
  const prompt = `You are an expert editor. Shorten this cover letter to a maximum of 2 highly impactful paragraphs (approx. 15 lines of text). Retain the exact same tone, structure, and key achievements. Do NOT add new information. Return ONLY the shortened letter.

Cover letter:
"""
${currentText}
"""

Return ONLY the shortened cover letter body text. Each paragraph separated by a blank line. No conversational filler.`;

  const maxTokens: number = currentText.length > 200 ? 512 : 256;
  return runDeepSeek(prompt, maxTokens);
}