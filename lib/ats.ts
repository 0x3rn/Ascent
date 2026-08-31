export interface AtsScores {
  overallMatch: number;
  resumeQuality: number;
  atsCompatibility: number;
  experienceRelevance: number;
  technicalMatch: number;
  domainMatch: number;
  recruiterAppeal: number;
  interviewProbability: number;
}

export interface AtsSkillGap {
  skill: string;
  confidence: number;
  reason: string;
  whyItMatters: string;
  commonUseCases: string[];
}

export interface AtsRequirementComparison {
  requirement: string;
  status: "Strong" | "Missing";
  evidence?: string;
}

export interface AtsSkillConcept {
  category: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface AtsImprovement {
  skill: string;
  stars: number;
  expectedImpact: "High" | "Medium" | "Low";
  estimatedMatchImprovementRange: string;
  reason: string;
}

export interface AtsActionableRewrite {
  originalText: string;
  improvedText: string;
  reason: string;
  sourceEvidence?: string[];
}

export interface ATSResult {
  scores: AtsScores;
  top3NextSteps: string[];
  resumeQualityBreakdown: {
    formatting: number;
    contentQuality: number;
    achievements: number;
    actionVerbs: number;
    readability: number;
    organization: number;
  };
  executiveSummary: string;
  topStrengths: string[];
  requirementsComparison: AtsRequirementComparison[];
  skillConcepts: AtsSkillConcept[];
  missingSkillsImpact: {
    criticalGaps: AtsSkillGap[];
    moderateGaps: AtsSkillGap[];
    minorGaps: AtsSkillGap[];
  };
  highestRoiImprovements: AtsImprovement[];
  learningPath: string[];
  skillTransferability: {
    transferableStrengths: string[];
    foundationFor: string[];
  };
  projectEvaluation: {
    matchStatus: string;
    feedback: string;
  };
  hiringRecommendation: {
    currentFit:
      | "Poor Fit"
      | "Developing Fit"
      | "Competitive"
      | "Strong Fit"
      | "Excellent Fit";
    interviewWorthy: boolean;
    hiringConfidence: "Low" | "Medium" | "High";
    reason: string;
    gaps: string[];
    estimatedOnboardingTime: string;
  };
  similarRoles: Array<{
    role: string;
    matchPercentage: number;
  }>;
  estimatedCompetitiveness: {
    currentLevel: "Low" | "Moderate" | "High" | "Exceptional";
    resumeQualityPercentile: string;
    technicalMatchPercentile: string;
    atsCompatibilityPercentile: string;
  };
  insights: {
    recruiterFeedback: string;
    strongAreas: string[];
    weakAreas: string[];
  };
  actionableRewrites: AtsActionableRewrite[];
  bottomLine: string;
  predictedImpact: {
    actions: string[];
    predictedOverallMatch: string;
    predictedInterviewProbability: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalized(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readScore(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`ATS returned an invalid score for ${key}.`);
  }
  return value;
}

function expectedFit(score: number): ATSResult["hiringRecommendation"]["currentFit"] {
  if (score < 40) return "Poor Fit";
  if (score < 60) return "Developing Fit";
  if (score < 75) return "Competitive";
  if (score < 90) return "Strong Fit";
  return "Excellent Fit";
}

function numericClaims(value: string): Set<string> {
  return new Set(value.match(/\b\d+(?:\.\d+)?%?\b/g) ?? []);
}

export function validateAtsResult(
  value: unknown,
  resumeSource: string
): ATSResult {
  if (!isRecord(value) || !isRecord(value.scores)) {
    throw new Error("ATS returned an invalid report.");
  }

  const scoreKeys: Array<keyof AtsScores> = [
    "overallMatch",
    "resumeQuality",
    "atsCompatibility",
    "experienceRelevance",
    "technicalMatch",
    "domainMatch",
    "recruiterAppeal",
    "interviewProbability",
  ];
  const scores = Object.fromEntries(
    scoreKeys.map((key) => [key, readScore(value.scores as Record<string, unknown>, key)])
  ) as unknown as AtsScores;

  if (!Array.isArray(value.top3NextSteps) || value.top3NextSteps.length !== 3) {
    throw new Error("ATS must return exactly three next steps.");
  }
  if (!Array.isArray(value.requirementsComparison)) {
    throw new Error("ATS returned invalid requirement comparisons.");
  }
  if (!Array.isArray(value.actionableRewrites)) {
    throw new Error("ATS returned invalid actionable rewrites.");
  }

  const source = normalized(resumeSource);
  for (const item of value.requirementsComparison) {
    if (!isRecord(item)) throw new Error("ATS returned an invalid requirement.");
    const requirement = item.requirement;
    const status = item.status;
    const evidence = item.evidence;
    if (
      typeof requirement !== "string" ||
      (status !== "Strong" && status !== "Missing")
    ) {
      throw new Error("ATS returned an invalid requirement status.");
    }
    if (/\s\/\s/.test(requirement)) {
      throw new Error("ATS combined multiple requirements instead of scoring them separately.");
    }
    if (status === "Strong") {
      if (
        typeof evidence !== "string" ||
        normalized(evidence).length < 2 ||
        !source.includes(normalized(evidence))
      ) {
        throw new Error(`ATS did not provide source evidence for: ${requirement}`);
      }
      const requirementLower = requirement.toLowerCase();
      const evidenceLower = evidence.toLowerCase();
      if (/licen[cs]e|licensed/.test(requirementLower) && !/licen[cs]e|licensed/.test(evidenceLower)) {
        throw new Error(`ATS inferred an unverified licence for: ${requirement}`);
      }
      if (/certification|certified/.test(requirementLower) && !/certification|certified|certificate/.test(evidenceLower)) {
        throw new Error(`ATS inferred an unverified certification for: ${requirement}`);
      }
    }
  }

  for (const item of value.actionableRewrites) {
    if (!isRecord(item)) throw new Error("ATS returned an invalid rewrite.");
    const originalText = item.originalText;
    const improvedText = item.improvedText;
    const sourceEvidence = item.sourceEvidence;
    if (
      typeof originalText !== "string" ||
      typeof improvedText !== "string" ||
      !source.includes(normalized(originalText)) ||
      !Array.isArray(sourceEvidence) ||
      sourceEvidence.length === 0 ||
      sourceEvidence.some(
        (evidence) =>
          typeof evidence !== "string" || !source.includes(normalized(evidence))
      )
    ) {
      throw new Error("ATS returned a rewrite without valid resume evidence.");
    }
    const originalNumbers = numericClaims(
      [originalText, ...sourceEvidence.filter((item): item is string => typeof item === "string")].join(" ")
    );
    const addedNumber = [...numericClaims(improvedText)].some(
      (number) => !originalNumbers.has(number)
    );
    if (addedNumber) {
      throw new Error("ATS introduced an unverified number in a rewrite.");
    }
  }

  if (!isRecord(value.hiringRecommendation)) {
    throw new Error("ATS returned an invalid hiring recommendation.");
  }
  if (value.hiringRecommendation.currentFit !== expectedFit(scores.overallMatch)) {
    throw new Error("ATS fit label does not match the overall score.");
  }
  if (
    (scores.interviewProbability < 40 && value.hiringRecommendation.interviewWorthy === true) ||
    (scores.interviewProbability >= 70 && value.hiringRecommendation.interviewWorthy === false)
  ) {
    throw new Error("ATS interview recommendation conflicts with its probability.");
  }

  return value as unknown as ATSResult;
}

export function isAtsResult(value: unknown): value is ATSResult {
  return (
    isRecord(value) &&
    isRecord(value.scores) &&
    typeof value.scores.overallMatch === "number" &&
    Array.isArray(value.top3NextSteps)
  );
}
