"use server";

import OpenAI from "openai";
import { cookies } from "next/headers";

async function verifyTurnstileSession(token?: string) {
  const cookieStore = await cookies();
  const sessionVerified = cookieStore.get("ascent_session_verified");

  if (sessionVerified?.value === "true") {
    return true;
  }

  if (!token) {
    throw new Error("Unauthorized: Turnstile token required");
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Server configuration error: Turnstile secret missing");
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const outcome = await res.json();
  if (outcome.success) {
    cookieStore.set("ascent_session_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    });
    return true;
  }

  throw new Error("Unauthorized: Turnstile verification failed");
}

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
  return text.replace(/—/g, "-").replace(/\u2014/g, "-");
}

export async function enhanceBulletPoint(bulletText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Rewrite the following resume bullet point using strong action verbs, quantifiable metrics, and concise, impactful phrasing. Use the formula: [Action Verb] + [What Was Done] + [Measurable Result/Impact].

If the input lacks metrics, infer reasonable ones based on the context.

Input: "${bulletText}"

Return ONLY the rewritten bullet point. Do not add bullet characters unless the input had one.`;
  return runDeepSeek(prompt);
}

export async function tailorToJob(
  experienceBullets: string,
  jobDescription: string,
  turnstileToken?: string
): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `I have the following resume bullet points:

"""
${experienceBullets}
"""

I want to tailor them to this job description:

"""
${jobDescription}
"""

Your task: Rewrite each bullet point to naturally incorporate relevant keywords and phrases from the job description. Keep the original structure and order. Use strong action verbs and metrics where possible. Do NOT fabricate entirely new experiences.

Return ONLY the rewritten bullet points, maintaining the same bullet format (one per line with the same bullet character). Do NOT add or remove bullets. Return EXACTLY the same number of bullets as the input.`;
  return runDeepSeek(prompt);
}

export async function fixGrammar(bulletText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Fix any grammar, spelling, or punctuation issues in the following text. Improve sentence flow and clarity. Maintain the original tone and structure. Do not rewrite from scratch.

Input: "${bulletText}"

Return ONLY the corrected text.`;
  return runDeepSeek(prompt);
}

export async function enhanceSummary(summary: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Rewrite the following professional summary to be more compelling, concise, and impactful. Keep it under 5 sentences.

Input: "${summary}"

Return ONLY the rewritten summary. No preamble, no closing remarks.`;
  return runDeepSeek(prompt);
}

export async function generateCoverLetter(
  userName: string,
  targetRole: string,
  companyName: string,
  skills: string[],
  candidateBackground: string,
  turnstileToken?: string
): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const hasBackground = candidateBackground && candidateBackground.trim().length > 0;
  const skillsLine = skills && skills.length > 0
    ? `\nThe candidate has listed these relevant skills: ${skills.join(", ")}. Weave these skills seamlessly into the body paragraphs to demonstrate qualification. Make it sound natural and human.`
    : "";

  const prompt = `You are an expert executive career coach. Write a highly persuasive, 3-4 paragraph cover letter from ${userName} applying for a ${targetRole} position at ${companyName}.

Use strong industry buzzwords and impactful action verbs, but the overall tone MUST sound entirely human, authentic, and passionate.

Do NOT use generic AI cliches like "delve", "testament", "tapestry", or "thrilled to apply".

CRITICAL: DO NOT use em-dashes (—) under any circumstances. Use commas, semicolons, or standard hyphens (-) instead.${skillsLine}

${
  hasBackground
    ? `\nReference the candidate's provided background naturally. Here is the candidate's resume information:\n\n"""\n${candidateBackground}\n"""\n`
    : `\nSince no resume background is provided, write a highly professional, generalized cover letter based solely on the target role and company. Focus on the value the candidate would bring to ${companyName} as a ${targetRole}.`
}

Return ONLY the raw cover letter body text (the paragraphs between the salutation and sign-off). No date line, no address block, no salutation, no closing sign-off — just the body paragraphs. Each paragraph separated by a blank line. No conversational filler.`;

  return runDeepSeek(prompt, 1024);
}

export async function shortenCoverLetter(currentText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an expert editor. Shorten this cover letter to a maximum of 2 highly impactful paragraphs (approx. 15 lines of text). Retain the exact same tone, structure, and key achievements. Do NOT add new information. Return ONLY the shortened letter.

Cover letter:
"""
${currentText}
"""

Return ONLY the shortened cover letter body text. Each paragraph separated by a blank line. No conversational filler.`;

  const maxTokens: number = currentText.length > 200 ? 512 : 256;
  return runDeepSeek(prompt, maxTokens);
}

// ---- SMART PASTE ----
export async function parseRawResume(rawText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an expert data extractor. Extract the user's details from the following raw text (LinkedIn export, old resume, etc.) and return ONLY a strict JSON object matching this TypeScript schema. No markdown, no conversational text, no code fences.

interface ResumeData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
  };
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    location: string;
    bullets: string; // bullet points separated by newlines starting with "- "
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
  skills: Array<{
    category: string;
    skills: string; // comma-separated
  }>;
  projects: Array<{
    name: string;
    link: string;
    skills: string;
    bullets: string;
  }>;
}

Raw text to parse:
"""
${rawText}
"""

Return ONLY the JSON object. No markdown code fences, no conversational text.`;

  const result = await runDeepSeek(prompt, 2048);
  // Strip any markdown code fences if the AI wrapped it
  return result.replace(/^```json\s*|```$/g, "").trim();
}

// ---- ATS SCORING ----
export async function scoreATS(
  resumeData: string,
  jobDescription: string,
  turnstileToken?: string
): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an elite Tech Recruiter and advanced ATS (Applicant Tracking System). Compare the candidate's resume against the target Job Description (JD). 

Do NOT use exact-keyword matching. Use semantic equivalents (e.g., "Built payment infrastructure" matches "Payment processing").

Evaluate based on these strict rules:
1. Section Weighting: Experience is worth 3x, Projects 2.5x, Summary 2x, Skills 1x. Do not heavily reward keywords buried only in a skills list.
2. Quantified Impact: Reward metrics (+5), percentages (+3), scale (+4), and business outcomes. Punish generic statements like "Built internal tools".
3. Keyword Stuffing: Repeated keywords yield diminishing returns (1st=100%, 2nd=20%, 3rd=0%).
4. Dual Scoring: Evaluate two separate scores (0-100):
   - ATS Compatibility: Focuses on semantic keyword coverage and structure.
   - Recruiter Appeal: Focuses on achievements, clarity, impact, progression, and ownership.

You must return a STRICT JSON object matching this exact schema, with no markdown formatting outside of the JSON:
{
  "scores": {
    "atsCompatibility": number,
    "recruiterAppeal": number,
    "compositeScore": number // Weighted: 35% Semantic Skills, 20% Experience, 15% Domain, 10% Metrics, 10% Tech Depth, 5% Structure, 5% Keywords
  },
  "skillConcepts": [
    {
      "category": string, // e.g., "Messaging Systems", "Backend Engineering"
      "matchPercentage": number,
      "matchedSkills": [string], // e.g., ["Kafka", "RabbitMQ"]
      "missingSkills": [string]
    }
  ],
  "insights": {
    "strongAreas": [string],
    "weakAreas": [string],
    "recruiterFeedback": string // e.g., "Your resume demonstrates strong backend engineering but lacks financial systems ownership."
  },
  "projectEvaluation": {
    "matchStatus": string, // One of: "Strong Match", "Partial Match", "Weak Match", "No Matching Projects", "No Projects Listed"
    "feedback": string // Detailed explanation of how well their projects align with the JD, or what is missing.
  },
  "actionableRewrites": [
    {
      "originalText": string, // A weak bullet from their resume
      "improvedText": string, // A metric-driven rewrite tailored to the JD
      "reason": string
    }
  ]
}

Resume Data:
"""
${resumeData}
"""

Job Description:
"""
${jobDescription}
"""

Return ONLY the JSON object.`;

  const result = await runDeepSeek(prompt, 2048);
  return result.replace(/^```json\s*|```$/g, "").trim();
}

// ---- INTERVIEW PREP ----
export async function generateInterviewPrep(
  targetRole: string,
  companyName: string,
  candidateBackground: string,
  turnstileToken?: string
): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an experienced hiring manager, recruiter, and interview coach.

Generate a comprehensive interview preparation guide tailored specifically to the supplied job description and candidate resume.

Your objective is to maximize the candidate's interview performance.

---

Input

Resume:
"""
${candidateBackground}
"""

Target Role / Job Description:
${targetRole}

Company Name:
${companyName}

---

Step 1

Analyze the job description.

Identify:

- required skills
- preferred skills
- responsibilities
- likely interview focus
- technical concepts
- behavioral expectations

---

Step 2

Analyze the resume.

Identify:

- strongest experiences
- strongest projects
- achievements
- leadership
- technical depth

Identify any potential weaknesses or gaps.

---

Step 3

Generate interview preparation.

Include:

## Company Research

Explain:

- what the company does
- products
- customers
- competitors
- recent trends if known

---

## Resume Deep Dive

Predict what interviewers will ask about each experience.

---

## Technical Questions

Generate questions that directly relate to the resume.

Do not ask questions about technologies absent from the resume unless the job strongly requires them.

---

## Behavioral Questions

Generate STAR-style behavioral questions.

Examples:

Tell me about a disagreement.

Tell me about a failure.

Tell me about a production incident.

Tell me about a difficult stakeholder.

---

## System Design

If appropriate.

Generate realistic design questions.

Scale based on experience level.

---

## Coding Topics

Identify the most likely coding interview topics.

Prioritize:

- arrays
- strings
- trees
- graphs
- concurrency
- SQL
- APIs

according to the role.

---

## Company-specific Questions

Predict likely company-specific questions.

For example:

Stripe:
Payments
Distributed systems
Reliability
APIs

Google:
Algorithms
Scalability

Meta:
Product thinking

Amazon:
Leadership Principles

---

## Candidate Weaknesses

Identify:

- weak resume areas
- missing technologies
- unclear achievements

Suggest how to answer honestly.

Never recommend lying.

---

## Questions to Ask the Interviewer

Generate 10 thoughtful questions.

---

## Final Advice

Provide:

Top strengths

Top risks

Last-minute preparation checklist

---

Writing Style

Detailed

Supportive

Actionable

Specific

Professional

CRITICAL: Return Markdown format only. No conversational filler or wrapping text.`;

  return runDeepSeek(prompt, 3000);
}


// ---- MOCK INTERVIEW ACTIONS ----

export async function initMockInterview(resumeData: string, targetRole: string, companyName: string, turnstileToken?: string): Promise<any> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an elite Interviewer. We are starting a mock interview.
Target Role: ${targetRole}
Company: ${companyName}

Candidate Resume:
"""
${resumeData}
"""

Task:
1. Analyze the resume and job to form an interview plan (10 questions covering Intro, Resume Deep Dive, Technical, System Design, Behavioral, Company Fit).
2. Generate an "Interview Overview" markdown summary.
3. Ask the very first question (Introduction).

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "overviewMarkdown": "Markdown string containing estimated time, sections, and brief summary",
  "firstQuestion": "The exact first question to ask the candidate"
}`;

  try {
    const result = await runDeepSeek(prompt, 2048);
    const jsonStr = result.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function chatMockInterview(chatHistory: any[], currentAnswer: string, resumeData: string, targetRole: string, companyName: string, turnstileToken?: string): Promise<any> {
  await verifyTurnstileSession(turnstileToken);
  const historyStr = JSON.stringify(chatHistory, null, 2);
  
  const prompt = `You are an elite Interviewer conducting a mock interview for a ${targetRole} at ${companyName}.
You are currently evaluating the candidate's latest answer and deciding the next step.
If the answer is weak, ask a follow-up. If it is strong, move to the next question category. Aim for a total of ~10 main questions.

Candidate Resume:
${resumeData}

Chat History (Context):
${historyStr}

Candidate's Latest Answer:
"${currentAnswer}"

Task:
1. Evaluate the answer (Score 1-10, Strengths, Weaknesses, Suggested Better Answer). Format this as Markdown.
2. Determine if the interview should end (has it reached ~10 questions and natural conclusion?).
3. If not ending, generate the next interview question.

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "feedbackMarkdown": "Markdown evaluation of the candidate's latest answer",
  "nextQuestion": "The next question to ask (or empty if complete)",
  "isInterviewComplete": boolean
}`;

  try {
    const result = await runDeepSeek(prompt, 2048);
    const jsonStr = result.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateMockInterviewReport(chatHistory: any[], resumeData: string, targetRole: string, companyName: string, turnstileToken?: string): Promise<any> {
  await verifyTurnstileSession(turnstileToken);
  const historyStr = JSON.stringify(chatHistory, null, 2);
  
  const prompt = `You are an elite Interviewer. The mock interview for ${targetRole} at ${companyName} has concluded.
Generate the final comprehensive report based on the candidate's performance.

Candidate Resume:
${resumeData}

Chat History:
${historyStr}

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "overallScore": number,
  "categoryScores": [
    { "category": string, "score": number }
  ],
  "strongestAnswers": [
    { "topic": string, "feedback": string }
  ],
  "weakestAreas": [
    string
  ],
  "idealAnswersMarkdown": "Markdown containing ideal answers for key questions asked",
  "studyPlanMarkdown": "Markdown personalized study plan"
}`;

  try {
    const result = await runDeepSeek(prompt, 3000);
    const jsonStr = result.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
