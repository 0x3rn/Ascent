"use server";

import OpenAI from "openai";
import { getGoogleAccessToken } from "@/lib/google-service-account";
import { verifyTurnstileSession } from "@/lib/turnstile";
import { validateAtsResult } from "@/lib/ats";
import {
  calculateInterviewSummary,
  completeInterviewEvaluation,
  parseInterviewEvaluation,
  parseInterviewScoreAudit,
  sanitizeInterviewHistory,
  type MockInterviewMessage,
  type MockInterviewReport,
  type StrongInterviewAnswer,
} from "@/lib/mock-interview";

// DEEPSEEK - DISABLED FOR NOW

// function getDeepSeek() {
//   return new OpenAI({
//     apiKey: process.env.DEEPSEEK_API_KEY,
//     baseURL: "https://api.deepseek.com",
//   });
// }

// GOOGLE VERTEX AI / GEMINI

async function getGemini() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not configured.");
  }

  if (!credentialsJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  const accessToken = await getGoogleAccessToken(credentialsJson);

  return new OpenAI({
    apiKey: accessToken,
    baseURL:
      `https://aiplatform.googleapis.com/v1/` +
      `projects/${projectId}/locations/global/endpoints/openapi`,
  });
}

const STRICT_SYSTEM_PROMPT = `You are an expert resume writer. You MUST return ONLY the requested text.
- NEVER include any conversational preamble, greeting, or closing.
- NEVER say things like "Sure!", "Here you go:", "I've enhanced...", or anything similar.
- NEVER wrap your response in quotes or markdown code fences.
- CRITICAL: DO NOT use em dashes under any circumstances. Use commas, semicolons, or standard hyphens (-) instead.
- Return ONLY the raw text content that belongs in the resume field.
- NEVER invent metrics, outcomes, responsibilities, credentials, tools, employers, or project details that the user did not provide.`;

const INTERVIEW_SYSTEM_PROMPT = `You are a rigorous, calibrated career interviewer and evaluator.
- Evaluate candidates against the target role, seniority, question, and evidence provided.
- Apply the same scoring discipline to every career, including technical, creative, operational, commercial, legal, medical, educational, public-service, and skilled-trade roles.
- Do not reward confidence, jargon, length, or polished structure when the underlying judgment is unsound.
- Do not invent achievements, credentials, metrics, laws, policies, or employer practices.
- Treat role-specific professional duties and material risks as substantive scoring issues.
- Return only the exact format requested by the user prompt.
- Do not use em dashes.`;

const INTERVIEW_SCORING_RUBRIC = `CAREER-AGNOSTIC SCORING RUBRIC

Score these five dimensions from 0 to 100:
- relevance: Directly answers the question and covers its important parts.
- judgment: Makes sound decisions, recognizes consequences, and applies safeguards appropriate to the profession.
- evidence: Uses credible specifics, examples, reasoning, or outcomes without inventing facts.
- roleCompetence: Demonstrates the knowledge and standards expected for this role and seniority.
- communication: Communicates clearly and coherently. Style cannot compensate for incorrect judgment.

Severity must be assigned before scoring:
- none: No material flaw. Small improvements may still exist.
- minor: A limited omission that does not undermine the central answer. Final score is capped at 89.
- major: A central error, missing essential control, materially poor decision, unsupported claim, or failure to answer the main question. Final score is capped at 69.
- critical: The answer endorses or normalizes conduct that violates a non-negotiable duty of the role or creates serious foreseeable harm. This includes, where relevant, unlawful or unethical conduct, patient or public safety failures, safeguarding failures, discrimination, privacy or security violations, financial-integrity failures, severe operational hazards, or a central technical falsehood with high-impact consequences. Final score is capped at 59.

Apply these rules across every career. Infer the relevant non-negotiable duties from the target role instead of relying on keywords from one industry. Acknowledging a harmful decision afterward can improve reflection, but it does not erase the severity of the original judgment. Do not reward jargon, confidence, verbosity, or an impressive outcome when the method was unsound.

Score bands after severity caps:
- 90 to 100: Exceptional and ready for the target level.
- 80 to 89: Strong, with limited non-central gaps.
- 70 to 79: Acceptable but mixed or underdeveloped.
- 60 to 69: Weak, with at least one major concern.
- 0 to 59: Unacceptable, substantially incorrect, or critically unsafe.`;

async function runGemini(
  prompt: string,
  maxTokens: number = 2048,
  systemPrompt: string = STRICT_SYSTEM_PROMPT,
  temperature: number = 0.4
): Promise<string> {
  let tokenBudget = maxTokens;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const gemini = await getGemini();
    const response = await gemini.chat.completions.create({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: tokenBudget,
    });
    const choice = response.choices[0];
    const text = choice?.message?.content?.trim().replace(/\u2014/g, "-") ?? "";

    if (text && choice?.finish_reason !== "length") {
      return text;
    }

    tokenBudget = Math.min(tokenBudget * 2, 16_000);
  }

  throw new Error("The AI response was incomplete after a retry.");
}

function isCompleteProse(
  text: string,
  minimumParagraphs: number,
  maximumParagraphs: number
): boolean {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    paragraphs.length >= minimumParagraphs &&
    paragraphs.length <= maximumParagraphs &&
    /[.!?]["')\]]?$/.test(text.trim())
  );
}

async function generateCompleteProse(
  prompt: string,
  minimumParagraphs: number,
  maximumParagraphs: number,
  initialTokenBudget: number
): Promise<string> {
  const first = await runGemini(prompt, initialTokenBudget);
  if (isCompleteProse(first, minimumParagraphs, maximumParagraphs)) {
    return first;
  }

  const retry = await runGemini(
    `${prompt}\n\nYour previous attempt was incomplete or had the wrong paragraph count. Return a complete response with ${minimumParagraphs} to ${maximumParagraphs} paragraphs and finish the final sentence.`,
    Math.max(initialTokenBudget * 2, 3_000),
    STRICT_SYSTEM_PROMPT,
    0.25
  );
  if (!isCompleteProse(retry, minimumParagraphs, maximumParagraphs)) {
    throw new Error("The AI returned an incomplete prose response.");
  }
  return retry;
}

export async function enhanceBulletPoint(bulletText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Rewrite the following resume bullet point using strong action verbs and concise, impactful phrasing. Use the formula: [Action Verb] + [What Was Done] + [Verified Result/Impact, only when present in the input].

Preserve the facts exactly. If the input lacks a metric or outcome, do not invent or imply one. Improve only the wording, clarity, and specificity already supported by the input.

Input: "${bulletText}"

Return ONLY the rewritten bullet point. Do not add bullet characters unless the input had one.`;
  return runGemini(prompt);
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

Your task: Rewrite each bullet point to naturally incorporate relevant keywords and phrases from the job description. Keep the original structure and order. Use strong action verbs and preserve only metrics already present in the original bullets. Do NOT fabricate experiences, duties, tools, outcomes, or metrics.

Return ONLY the rewritten bullet points, maintaining the same bullet format (one per line with the same bullet character). Do NOT add or remove bullets. Return EXACTLY the same number of bullets as the input.`;
  return runGemini(prompt);
}

export async function fixGrammar(bulletText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Fix any grammar, spelling, or punctuation issues in the following text. Improve sentence flow and clarity. Maintain the original tone and structure. Do not rewrite from scratch.

Input: "${bulletText}"

Return ONLY the corrected text.`;
  return runGemini(prompt);
}

export async function enhanceSummary(summary: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Rewrite the following professional summary to be more compelling, concise, and impactful. Keep it under 5 sentences.

Input: "${summary}"

Return ONLY the rewritten summary. No preamble, no closing remarks.`;
  return runGemini(prompt);
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

CRITICAL: DO NOT use em dashes under any circumstances. Use commas, semicolons, or standard hyphens (-) instead.${skillsLine}

${
  hasBackground
    ? `\nReference the candidate's provided background naturally. Here is the candidate's resume information:\n\n"""\n${candidateBackground}\n"""\n`
    : `\nSince no resume background is provided, write a highly professional, generalized cover letter based solely on the target role and company. Focus on the value the candidate would bring to ${companyName} as a ${targetRole}.`
}

Return ONLY the raw cover letter body text (the paragraphs between the salutation and sign-off). No date line, no address block, no salutation, no closing sign-off; just the body paragraphs. Each paragraph separated by a blank line. No conversational filler.`;

  return generateCompleteProse(prompt, 3, 4, 3_000);
}

export async function shortenCoverLetter(currentText: string, turnstileToken?: string): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an expert editor. Shorten this cover letter to a maximum of 2 highly impactful paragraphs (approx. 15 lines of text). Retain the exact same tone, structure, and key achievements. Do NOT add new information. 
  
CRITICAL: Do NOT add any generic salutations (e.g. "Dear Hiring Manager", "Sincerely") if they were not in the original text. Return exactly what is given, just shorter.

Cover letter:
"""
${currentText}
"""

Return ONLY the shortened cover letter body text. Each paragraph separated by a blank line. No conversational filler.`;

  const shortened = await generateCompleteProse(prompt, 1, 2, 2_000);
  if (shortened.length >= currentText.length) {
    throw new Error("The shortened cover letter was not shorter than the original.");
  }
  return shortened;
}

export async function generateFreelanceProposal(
  userName: string,
  gigTitle: string,
  jobDescription: string,
  proposedApproach: string,
  similarProject: string,
  portfolioLink: string,
  turnaroundTime: string,
  candidateBackground: string,
  turnstileToken?: string
): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const hasBackground = candidateBackground && candidateBackground.trim().length > 0;

  const prompt = `You are an elite, Top-Rated Plus freelance copywriter helping a user win a gig on Upwork/Fiverr. 
Write a highly persuasive, concise freelance proposal based on the provided Job Description and the freelancer's details.

User Name: ${userName}
Gig Title: ${gigTitle}
Job Description:
"""
${jobDescription}
"""

${proposedApproach ? `Proposed Approach/Hook: ${proposedApproach}` : ""}
${similarProject ? `Similar Past Project: ${similarProject}` : ""}
${portfolioLink ? `Portfolio Link: ${portfolioLink}` : ""}
${turnaroundTime ? `Turnaround Time: ${turnaroundTime}` : ""}

${hasBackground ? `\nFreelancer's Background (use this to highlight relevant experience):\n"""\n${candidateBackground}\n"""\n` : ""}

STRICT RULES:
1. DO NOT use generic corporate salutations like "Dear Hiring Manager". Start directly with a warm greeting (e.g., "Hi there," or using the client's name if implied).
2. Hook them in the first sentence by directly referencing their core problem from the Job Description.
3. Keep it punchy and short (max 3-4 short paragraphs). Clients skim proposals.
4. If a "Proposed Approach" is provided, weave it in to show we already know how to solve their issue.
5. If the user provides a "Similar Past Project", you MUST weave it naturally into the proposal. Dedicate a sentence to drawing a direct parallel between that past work and the client's current needs to establish immediate authority and trust. Show the client we've already successfully solved this exact problem.
6. If a "Portfolio Link" or "Turnaround Time" is provided, include them naturally as proof of competence and readiness.
7. End with a soft, confident Call to Action (e.g., "Let's hop on a quick chat to discuss the architecture.").
8. Absolutely no em dashes. No AI buzzwords like 'delve', 'tapestry', or 'testament'. Sound like a confident, human expert.

CRITICAL ANTI-HALLUCINATION RULES:
1. DO NOT lie or invent past experiences, projects, or case studies. 
2. If the user provided a "Similar Past Project", use it exactly as provided.
3. If the "Similar Past Project" field is EMPTY or NOT PROVIDED, you MUST NOT claim to have "done this exact thing before." Instead, lean heavily on the user's "Proposed Approach" and their core skills to prove competence. Focus on HOW you will solve the problem, not on fabricated past work.
4. Never copy-paste the client's tech stack and claim you built an identical app unless the user's resume data explicitly supports it.

Return ONLY the raw proposal text. No markdown code blocks, no conversational filler.`;

  return runGemini(prompt, 1024);
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

  const result = await runGemini(prompt, 2048);
  // Strip any markdown code fences if the AI wrapped it
  return result.replace(/^```json\s*|```$/g, "").trim();
}

export type PdfTextExtractionResult =
  | { success: true; text: string; pageCount: number }
  | { success: false; error: string };

export async function extractPdfText(
  formData: FormData,
  turnstileToken?: string
): Promise<PdfTextExtractionResult> {
  await verifyTurnstileSession(turnstileToken);
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "Choose a PDF file to import." };
  }
  if (file.size === 0) {
    return { success: false, error: "The selected PDF is empty." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "PDF files must be 5 MB or smaller." };
  }
  if (file.type && file.type !== "application/pdf") {
    return { success: false, error: "The selected file is not a PDF." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return { success: false, error: "The selected file is not a valid PDF." };
    }

    const { default: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(buffer);
    const text = parsed.text.replace(/\u0000/g, "").trim().slice(0, 120_000);

    if (text.length < 40) {
      return {
        success: false,
        error:
          "No readable text was found. If this is a scanned resume, use a text-based PDF or paste the text instead.",
      };
    }

    return {
      success: true,
      text,
      pageCount: parsed.numpages,
    };
  } catch (error: unknown) {
    console.error("Unable to extract PDF text:", error);
    return {
      success: false,
      error: "We couldn't read that PDF. Try exporting it again or paste the resume text.",
    };
  }
}

// ---- ATS SCORING ----
export async function scoreATS(
  resumeData: string,
  jobDescription: string,
  turnstileToken?: string
): Promise<string> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `You are an elite Tech Recruiter and advanced ATS (Applicant Tracking System). Compare the candidate's resume against the target Job Description (JD) to generate a "CareerFit Report".

Do NOT use exact-keyword matching. Use semantic equivalents (e.g., "Built payment infrastructure" matches "Payment processing").

Evaluate based on these strict rules:
1. Section Weighting: Experience is worth 3x, Projects 2.5x, Summary 2x, Skills 1x. Do not heavily reward keywords buried only in a skills list.
2. Quantified Impact & Truthfulness: Reward metrics, scale, and business outcomes. ABSOLUTE RULE: When suggesting bullet upgrades, you must PRESERVE THE FACTS. NEVER invent numbers, percentages, scale, user counts, or time saved if they do not exist in the original resume. Rewrite bullets using only facts already present. If you suggest adding metrics, do not recommend specific fake numbers; instead use phrasing like: "Where possible, quantify the scale of your work (for example, request volume, deployment frequency, or performance improvements)."
3. Semantic Understanding of Systems: If the JD asks for "Messaging Systems" or "Kafka" and the candidate has strong backend/transactional API experience, assign a partial match (e.g., 15-20%) rather than 0%, as they have relevant building blocks.
4. Separation of Scores: 
   - ATS Compatibility: Reflects structure (headings, bullet points).
   - Job Match (Overall, Experience, Technical, Domain): Reflects actual experience.
   - Recruiter Appeal & Resume Quality: Should be high (75%+) if formatting, progression, impact, and metrics are strong.
   - Interview Probability: Driven by Resume Quality, Recruiter Appeal, and Experience Relevance. A strong engineer missing specific domain knowledge often still gets a 60-70% interview probability. The "interviewWorthy" boolean in hiringRecommendation MUST logically align with this probability.
5. Current Fit Mapping: The "currentFit" field MUST map exactly to the overallMatch score as follows:
   - 0-39% = Poor Fit
   - 40-59% = Developing Fit
   - 60-74% = Competitive
   - 75-89% = Strong Fit
   - 90-100% = Excellent Fit
   - ALWAYS align hiringRecommendation with interviewProbability (e.g. don't say 'Competitive' and 'Interview Worthy: Yes' if the probability is 20%).
6. Professional Tone & Integrity:
  - DO NOT invent technologies, frameworks, or tools not explicitly mentioned in the candidate's resume (e.g., if they say "payment API", do not assume "Stripe" or "OAuth"). Stay faithful to the source.
  - Make the tone of the executiveSummary and bottomLine highly professional, like a senior recruiter. Do not use casual phrases like 'Hey there'. Start directly with an authoritative evaluation (e.g., "Your resume demonstrates a strong foundation...").
7. Missing Skills & Confidence: For every missing skill gap, estimate an AI confidence level (0-100) based on how certain you are that it is actually missing from their experience, rather than just omitted from the text.
8. Personalized Learning Path: Tailor the learning path strictly to the user's existing skills. Do not just say "Learn X". Say "Since you have experience with [User Skill Y], the next logical step is to learn [Target Skill X]..."
9. Evidence Grounding:
   - Split requirements into atomic items. Never combine separate requirements with "/" or "and".
   - Every requirement marked "Strong" must include a short, exact quote copied from the resume in its evidence field.
   - Never infer a licence, certification, clearance, degree, credential, or regulated status. Mark it "Strong" only when the exact credential is explicitly stated in the resume.
   - Every actionable rewrite must include one or more exact resume quotes in sourceEvidence. The rewrite may clarify those facts but must not add duties, tools, settings, outcomes, credentials, or numbers absent from that evidence.

You must return a STRICT JSON object matching this exact schema, with no markdown formatting outside of the JSON:
{
  "scores": {
    "overallMatch": number,
    "resumeQuality": number,
    "atsCompatibility": number,
    "experienceRelevance": number,
    "technicalMatch": number,
    "domainMatch": number,
    "recruiterAppeal": number,
    "interviewProbability": number
  },
  "top3NextSteps": [string], // Array of exactly 3 most impactful next steps
  "resumeQualityBreakdown": {
    "formatting": number,
    "contentQuality": number,
    "achievements": number,
    "actionVerbs": number,
    "readability": number,
    "organization": number
  },
  "executiveSummary": string, // Professional, authoritative 2-3 paragraph summary. NO "Hey there".
  "topStrengths": [string],
  "requirementsComparison": [
    {
      "requirement": string, 
      "status": string, // EXACTLY "Strong" or "Missing"
      "evidence": string // exact resume quote for Strong; empty string for Missing
    }
  ],
  "skillConcepts": [
    {
      "category": string,
      "matchPercentage": number,
      "matchedSkills": [string],
      "missingSkills": [string]
    }
  ],
  "missingSkillsImpact": {
    "criticalGaps": [
      {
        "skill": string,
        "confidence": number, // 0-100
        "reason": string, // Why you believe it is missing based on text
        "whyItMatters": string, // Why employers care about this skill
        "commonUseCases": [string] // 2-4 common use cases
      }
    ],
    "moderateGaps": [
      {
        "skill": string,
        "confidence": number,
        "reason": string,
        "whyItMatters": string,
        "commonUseCases": [string]
      }
    ],
    "minorGaps": [
      {
        "skill": string,
        "confidence": number,
        "reason": string,
        "whyItMatters": string,
        "commonUseCases": [string]
      }
    ]
  },
  "highestRoiImprovements": [
    {
      "skill": string,
      "stars": number, // 1 to 5
      "expectedImpact": string, // "High", "Medium", or "Low"
      "estimatedMatchImprovementRange": string, // e.g. "+8-15%"
      "reason": string
    }
  ],
  "learningPath": [string], // Ordered roadmap of 4-5 steps heavily personalized linking existing skills to new ones
  "skillTransferability": {
    "transferableStrengths": [string],
    "foundationFor": [string]
  },
  "projectEvaluation": {
    "matchStatus": string,
    "feedback": string
  },
  "hiringRecommendation": {
    "currentFit": string, // "Poor Fit", "Developing Fit", "Competitive", "Strong Fit", or "Excellent Fit"
    "interviewWorthy": boolean,
    "hiringConfidence": string, // "Low", "Medium", or "High"
    "reason": string,
    "gaps": [string],
    "estimatedOnboardingTime": string
  },
  "similarRoles": [
    {
      "role": string,
      "matchPercentage": number
    }
  ],
  "estimatedCompetitiveness": {
    "currentLevel": string, // "Low", "Moderate", "High", "Exceptional"
    "resumeQualityPercentile": string, // e.g., "Top 25%"
    "technicalMatchPercentile": string, // e.g., "Top 50%"
    "atsCompatibilityPercentile": string // e.g., "Top 30%"
  },
  "insights": {
    "recruiterFeedback": string,
    "strongAreas": [string],
    "weakAreas": [string]
  },
  "actionableRewrites": [
    {
      "originalText": string,
      "improvedText": string,
      "reason": string,
      "sourceEvidence": [string] // exact resume quotes supporting every factual claim
    }
  ],
  "bottomLine": string,
  "predictedImpact": {
    "actions": [string],
    "predictedOverallMatch": string, // "e.g., '~75-80%'"
    "predictedInterviewProbability": string // "e.g., '~80-85%'"
  }
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

  let validationError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const correction = validationError
      ? `\n\nYour previous report failed validation: ${validationError}. Correct the grounding problem and return the entire JSON report again.`
      : "";
    const result = await runGemini(`${prompt}${correction}`, 10_000, STRICT_SYSTEM_PROMPT, 0.15);
    const jsonText = result.replace(/^```json\s*|```$/g, "").trim();
    try {
      const validated = validateAtsResult(JSON.parse(jsonText), resumeData);
      return JSON.stringify(validated);
    } catch (error: unknown) {
      validationError =
        error instanceof Error ? error.message : "The report was not grounded in the resume.";
    }
  }

  throw new Error(`ATS grounding validation failed: ${validationError}`);
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

  return runGemini(prompt, 3000);
}


// ---- MOCK INTERVIEW ACTIONS ----

type MockInterviewFailure = { success: false; error: string };

type MockInterviewStartResult =
  | {
      success: true;
      overviewMarkdown: string;
      firstQuestion: string;
    }
  | MockInterviewFailure;

type MockInterviewChatResult =
  | {
      success: true;
      feedbackMarkdown: string;
      evaluation: ReturnType<typeof completeInterviewEvaluation>;
      nextQuestion: string;
      isInterviewComplete: boolean;
    }
  | MockInterviewFailure;

type MockInterviewReportResult = MockInterviewReport | MockInterviewFailure;

function parseJsonObject(text: string): Record<string, unknown> {
  const jsonText = text.replace(/^```json\s*|```$/g, "").trim();
  const value: unknown = JSON.parse(jsonText);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("The model returned an invalid object.");
  }
  return value as Record<string, unknown>;
}

function readModelString(
  record: Record<string, unknown>,
  key: string,
  maxLength = 12_000
): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`The model omitted ${key}.`);
  }
  return value.trim().slice(0, maxLength);
}

function readModelStringArray(
  record: Record<string, unknown>,
  key: string,
  maxItems = 6
): string[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new Error(`The model returned an invalid ${key}.`);
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function readStrongestAnswers(
  value: unknown,
  answerAudits: ReturnType<typeof parseInterviewScoreAudit>[]
): StrongInterviewAnswer[] {
  if (!Array.isArray(value)) {
    throw new Error("The model returned invalid strongest answers.");
  }

  return value
    .slice(0, 4)
    .map((item) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        throw new Error("The model returned an invalid strongest answer.");
      }
      const record = item as Record<string, unknown>;
      const answerIndex = record.answerIndex;
      if (
        typeof answerIndex !== "number" ||
        !Number.isSafeInteger(answerIndex) ||
        answerIndex < 0 ||
        answerIndex >= answerAudits.length
      ) {
        throw new Error("The model returned an invalid strongest answer index.");
      }
      return {
        answerIndex,
        topic: readModelString(record, "topic", 160),
        feedback: readModelString(record, "feedback", 1_200),
      };
    })
    .filter((answer) => {
      const severity = answerAudits[answer.answerIndex].severity;
      return severity === "none" || severity === "minor";
    });
}

function readScoreAudits(value: unknown, answerCount: number) {
  if (!Array.isArray(value) || value.length !== answerCount) {
    throw new Error("The final score audit did not cover every answer.");
  }

  const audits = value.map(parseInterviewScoreAudit);
  const indexes = new Set(audits.map((audit) => audit.answerIndex));
  if (
    indexes.size !== answerCount ||
    audits.some((audit) => audit.answerIndex >= answerCount)
  ) {
    throw new Error("The final score audit contains invalid answer indexes.");
  }

  return audits.sort((a, b) => a.answerIndex - b.answerIndex);
}

function safeInterviewFailure(
  context: string,
  error: unknown
): MockInterviewFailure {
  console.error(context, error);
  return {
    success: false,
    error: "We couldn't complete the interview evaluation. Please try again.",
  };
}

export async function initMockInterview(
  resumeData: string,
  targetRole: string,
  companyName: string,
  turnstileToken?: string
): Promise<MockInterviewStartResult> {
  await verifyTurnstileSession(turnstileToken);
  const prompt = `Start a realistic mock interview.
Target Role: ${targetRole}
Company: ${companyName}

Candidate Resume:
"""
${resumeData}
"""

Task:
1. Analyze the resume, role, seniority, and employer context to form a 10-question interview plan.
2. Choose categories that genuinely fit this career. Do not force technical or system-design categories onto roles where they are irrelevant.
3. Include trajectory, resume evidence, core role capabilities, professional judgment, collaboration, and motivation or values where appropriate.
4. Generate an "Interview Overview" markdown summary.
5. Ask the very first question (Introduction).

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "overviewMarkdown": "Markdown string containing estimated time, sections, and brief summary",
  "firstQuestion": "The exact first question to ask the candidate"
}`;

  try {
    const result = await runGemini(
      prompt,
      2048,
      INTERVIEW_SYSTEM_PROMPT,
      0.25
    );
    const parsed = parseJsonObject(result);
    return {
      success: true,
      overviewMarkdown: readModelString(parsed, "overviewMarkdown"),
      firstQuestion: readModelString(parsed, "firstQuestion", 2_000),
    };
  } catch (error: unknown) {
    return safeInterviewFailure("Unable to start mock interview:", error);
  }
}

export async function chatMockInterview(
  chatHistory: MockInterviewMessage[],
  currentAnswer: string,
  resumeData: string,
  targetRole: string,
  companyName: string,
  turnstileToken?: string
): Promise<MockInterviewChatResult> {
  await verifyTurnstileSession(turnstileToken);
  const cleanHistory = sanitizeInterviewHistory(chatHistory);
  const historyBeforeAnswer =
    cleanHistory.at(-1)?.role === "user"
      ? cleanHistory.slice(0, -1)
      : cleanHistory;
  const answeredQuestionCount = cleanHistory.filter(
    (message) => message.role === "user"
  ).length;
  const historyStr = JSON.stringify(historyBeforeAnswer, null, 2);

  const prompt = `Conduct and grade a mock interview for a ${targetRole} at ${companyName}.
Evaluate the latest answer against the actual question, target role, seniority, and relevant professional standards. Then decide the next question. The candidate has answered ${answeredQuestionCount} main question(s). Aim for 10 main questions.

Candidate Resume:
${resumeData}

Interview History Before the Latest Answer:
${historyStr}

Candidate's Latest Answer:
"""
${currentAnswer}
"""

${INTERVIEW_SCORING_RUBRIC}

Task:
1. Perform a silent red-flag audit before assigning severity and dimension scores.
2. Reuse the interview-plan category name when possible so category totals remain stable.
3. Identify strengths, weaknesses, any critical concerns, and a better answer that does not invent candidate achievements.
4. If the answer is weak, ask a focused follow-up when useful. Otherwise move to the next planned category.
5. End naturally after approximately 10 main questions.

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "evaluation": {
    "category": "Stable interview category name",
    "severity": "none | minor | major | critical",
    "dimensionScores": {
      "relevance": 0,
      "judgment": 0,
      "evidence": 0,
      "roleCompetence": 0,
      "communication": 0
    },
    "strengths": ["Specific strength"],
    "weaknesses": ["Specific weakness"],
    "criticalConcerns": ["Critical concern, or an empty array"],
    "suggestedBetterAnswer": "A realistic improved answer"
  },
  "nextQuestion": "The next question to ask (or empty if complete)",
  "isInterviewComplete": boolean
}`;

  try {
    const result = await runGemini(
      prompt,
      3000,
      INTERVIEW_SYSTEM_PROMPT,
      0.15
    );
    const parsed = parseJsonObject(result);
    const evaluation = completeInterviewEvaluation(
      parseInterviewEvaluation(parsed.evaluation)
    );
    const modelComplete = parsed.isInterviewComplete === true;
    const isInterviewComplete = answeredQuestionCount >= 10 || modelComplete;
    const nextQuestion = isInterviewComplete
      ? ""
      : readModelString(parsed, "nextQuestion", 2_000);

    return {
      success: true,
      feedbackMarkdown: evaluation.feedbackMarkdown,
      evaluation,
      nextQuestion,
      isInterviewComplete,
    };
  } catch (error: unknown) {
    return safeInterviewFailure("Unable to grade mock interview answer:", error);
  }
}

export async function generateMockInterviewReport(
  chatHistory: MockInterviewMessage[],
  resumeData: string,
  targetRole: string,
  companyName: string,
  turnstileToken?: string
): Promise<MockInterviewReportResult> {
  await verifyTurnstileSession(turnstileToken);
  const cleanHistory = sanitizeInterviewHistory(chatHistory);
  const candidateAnswers = cleanHistory.filter(
    (message) => message.role === "user"
  );
  const answerCount = candidateAnswers.length;

  if (answerCount === 0) {
    return {
      success: false,
      error: "Answer at least one interview question before generating a report.",
    };
  }

  const historyStr = JSON.stringify(cleanHistory, null, 2);

  const prompt = `Write the final report for the completed mock interview for ${targetRole} at ${companyName}.

Independently audit every answer from the raw transcript. Do not use, preserve, or infer any score from earlier interviewer feedback. The application will calculate all final numeric scores from your audited dimension scores and severity classifications.

The candidate answered ${answerCount} question(s). Base every conclusion only on questions actually answered. If coverage was limited, state that clearly without inventing performance in untested areas.

Candidate Resume:
${resumeData}

Raw Question and Answer History:
${historyStr}

${INTERVIEW_SCORING_RUBRIC}

Task:
1. Independently assign a zero-based answerIndex, stable category, severity, and five dimension scores to every candidate answer.
2. Select up to three genuinely strongest answers. Do not select an answer audited as major or critical.
3. Identify the most consequential improvement areas. Prioritize professional-duty, safety, ethics, correctness, and decision-quality concerns over presentation polish.
4. Provide ideal approaches for the most important weak answers without inventing candidate history.
5. Produce a concise, personalized study plan that applies to this target career.

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "auditedEvaluations": [
    {
      "answerIndex": 0,
      "category": "Stable interview category name",
      "severity": "none | minor | major | critical",
      "dimensionScores": {
        "relevance": 0,
        "judgment": 0,
        "evidence": 0,
        "roleCompetence": 0,
        "communication": 0
      }
    }
  ],
  "strongestAnswers": [
    { "answerIndex": 0, "topic": string, "feedback": string }
  ],
  "weakestAreas": [
    string
  ],
  "idealAnswersMarkdown": "Markdown containing ideal answers for key questions asked",
  "studyPlanMarkdown": "Markdown personalized study plan"
}`;

  try {
    const result = await runGemini(
      prompt,
      6000,
      INTERVIEW_SYSTEM_PROMPT,
      0.1
    );
    const parsed = parseJsonObject(result);
    const answerAudits = readScoreAudits(
      parsed.auditedEvaluations,
      answerCount
    );
    const auditedMessages: MockInterviewMessage[] = answerAudits.map(
      (audit) => ({
        role: "user",
        content: candidateAnswers[audit.answerIndex].content,
        evaluation: {
          ...audit,
          strengths: [],
          weaknesses: [],
          criticalConcerns: [],
          suggestedBetterAnswer: "Not used in the independent score audit.",
          feedbackMarkdown: "",
        },
      })
    );
    const summary = calculateInterviewSummary(auditedMessages);

    return {
      success: true,
      overallScore: summary.overallScore,
      categoryScores: summary.categoryScores,
      answerAudits,
      strongestAnswers: readStrongestAnswers(
        parsed.strongestAnswers,
        answerAudits
      ),
      weakestAreas: readModelStringArray(parsed, "weakestAreas"),
      idealAnswersMarkdown: readModelString(parsed, "idealAnswersMarkdown"),
      studyPlanMarkdown: readModelString(parsed, "studyPlanMarkdown"),
    };
  } catch (error: unknown) {
    return safeInterviewFailure("Unable to generate mock interview report:", error);
  }
}
