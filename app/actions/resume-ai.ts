"use server";

import OpenAI from "openai";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function verifyTurnstileSession(token?: string) {
  console.log("--- TURNSTILE VERIFICATION ---");
  console.log("Received token length:", token ? token.length : "undefined");
  const cookieStore = await cookies();
  const sessionVerified = cookieStore.get("ascent_session_verified");
  console.log("Cookie ascent_session_verified:", sessionVerified?.value);

  if (sessionVerified?.value === "true") {
    console.log("Session cookie is valid. Bypassing token check.");
    return true;
  }

  if (!token) {
    console.error("Token is undefined or empty!");
    throw new Error("Unauthorized: Turnstile token required");
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";
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
      sameSite: "lax",
    });
    revalidatePath("/");
    return true;
  }

  const codes = outcome["error-codes"] ? outcome["error-codes"].join(", ") : "Unknown";
  throw new Error(`Unauthorized: Turnstile verification failed. Reason: ${codes}`);
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
  const prompt = `You are an expert editor. Shorten this cover letter to a maximum of 2 highly impactful paragraphs (approx. 15 lines of text). Retain the exact same tone, structure, and key achievements. Do NOT add new information. 
  
CRITICAL: Do NOT add any generic salutations (e.g. "Dear Hiring Manager", "Sincerely") if they were not in the original text. Return exactly what is given, just shorter.

Cover letter:
"""
${currentText}
"""

Return ONLY the shortened cover letter body text. Each paragraph separated by a blank line. No conversational filler.`;

  const maxTokens: number = currentText.length > 200 ? 512 : 256;
  return runDeepSeek(prompt, maxTokens);
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
8. Absolutely no em-dashes (—). No AI buzzwords like 'delve', 'tapestry', or 'testament'. Sound like a confident, human expert.

CRITICAL ANTI-HALLUCINATION RULES:
1. DO NOT lie or invent past experiences, projects, or case studies. 
2. If the user provided a "Similar Past Project", use it exactly as provided.
3. If the "Similar Past Project" field is EMPTY or NOT PROVIDED, you MUST NOT claim to have "done this exact thing before." Instead, lean heavily on the user's "Proposed Approach" and their core skills to prove competence. Focus on HOW you will solve the problem, not on fabricated past work.
4. Never copy-paste the client's tech stack and claim you built an identical app unless the user's resume data explicitly supports it.

Return ONLY the raw proposal text. No markdown code blocks, no conversational filler.`;

  return runDeepSeek(prompt, 1024);
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
      "status": string // EXACTLY "Strong" or "Missing"
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
    "recruiterFeedback": string
  },
  "actionableRewrites": [
    {
      "originalText": string,
      "improvedText": string,
      "reason": string
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

  const result = await runDeepSeek(prompt, 8000); // Increased maxTokens due to larger output schema
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
1. Evaluate the answer (Score 0-100 percentage scale, Strengths, Weaknesses, Suggested Better Answer). Format this as Markdown.
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

IMPORTANT: The candidate may have ended the interview prematurely before answering a full set of questions. 
- Base your assessment ONLY on the questions the candidate actually answered.
- If they ended it very early, DO NOT invent grades for topics they didn't cover. Instead, explicitly note in the "studyPlanMarkdown" and "weakestAreas" that the interview was ended prematurely, which limits the scope of the assessment.

Candidate Resume:
${resumeData}

Chat History:
${historyStr}

CRITICAL: Return ONLY a valid JSON object matching exactly this schema:
{
  "success": true,
  "overallScore": number, // A strict 0-100 percentage score representing their overall performance
  "categoryScores": [
    { "category": string, "score": number } // Each category score MUST also be a strict 0-100 percentage score
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
