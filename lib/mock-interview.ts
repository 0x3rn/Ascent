export type InterviewSeverity = "none" | "minor" | "major" | "critical";

export interface InterviewDimensionScores {
  relevance: number;
  judgment: number;
  evidence: number;
  roleCompetence: number;
  communication: number;
}

export interface InterviewEvaluation {
  category: string;
  severity: InterviewSeverity;
  dimensionScores: InterviewDimensionScores;
  score: number;
  strengths: string[];
  weaknesses: string[];
  criticalConcerns: string[];
  suggestedBetterAnswer: string;
  feedbackMarkdown: string;
}

export interface MockInterviewMessage {
  role: "user" | "ai";
  content: string;
  feedback?: string;
  evaluation?: InterviewEvaluation;
}

export interface InterviewCategoryScore {
  category: string;
  score: number;
}

export interface StrongInterviewAnswer {
  answerIndex: number;
  topic: string;
  feedback: string;
}

export interface MockInterviewReport {
  success: true;
  overallScore: number;
  categoryScores: InterviewCategoryScore[];
  answerAudits: InterviewScoreAudit[];
  strongestAnswers: StrongInterviewAnswer[];
  weakestAreas: string[];
  idealAnswersMarkdown: string;
  studyPlanMarkdown: string;
}

export interface MockInterviewHistoryRecord {
  date: string;
  role: string;
  company: string;
  score: number;
  report: MockInterviewReport;
}

export interface InterviewEvaluationDraft {
  category: string;
  severity: InterviewSeverity;
  dimensionScores: InterviewDimensionScores;
  strengths: string[];
  weaknesses: string[];
  criticalConcerns: string[];
  suggestedBetterAnswer: string;
}

export interface InterviewScoreAudit {
  answerIndex: number;
  category: string;
  severity: InterviewSeverity;
  dimensionScores: InterviewDimensionScores;
  score: number;
}

const DIMENSION_WEIGHTS: Record<keyof InterviewDimensionScores, number> = {
  relevance: 0.2,
  judgment: 0.3,
  evidence: 0.2,
  roleCompetence: 0.2,
  communication: 0.1,
};

const SEVERITY_SCORE_CAPS: Record<InterviewSeverity, number> = {
  none: 100,
  minor: 89,
  major: 69,
  critical: 59,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  maxLength = 8_000
): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid interview evaluation field: ${key}`);
  }
  return value.trim().slice(0, maxLength);
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
  maxItems = 6
): string[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new Error(`Invalid interview evaluation field: ${key}`);
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function readScore(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid interview score field: ${key}`);
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function readSeverity(record: Record<string, unknown>): InterviewSeverity {
  const severity = record.severity;
  if (
    severity !== "none" &&
    severity !== "minor" &&
    severity !== "major" &&
    severity !== "critical"
  ) {
    throw new Error("Invalid interview evaluation severity.");
  }
  return severity;
}

function readDimensionScores(
  record: Record<string, unknown>
): InterviewDimensionScores {
  if (!isRecord(record.dimensionScores)) {
    throw new Error("Invalid interview dimension scores.");
  }

  return {
    relevance: readScore(record.dimensionScores, "relevance"),
    judgment: readScore(record.dimensionScores, "judgment"),
    evidence: readScore(record.dimensionScores, "evidence"),
    roleCompetence: readScore(record.dimensionScores, "roleCompetence"),
    communication: readScore(record.dimensionScores, "communication"),
  };
}

export function calculateInterviewScore(
  dimensions: InterviewDimensionScores,
  severity: InterviewSeverity
): number {
  const weightedScore = Object.entries(DIMENSION_WEIGHTS).reduce(
    (total, [dimension, weight]) =>
      total + dimensions[dimension as keyof InterviewDimensionScores] * weight,
    0
  );

  return Math.min(Math.round(weightedScore), SEVERITY_SCORE_CAPS[severity]);
}

export function parseInterviewEvaluation(
  value: unknown
): InterviewEvaluationDraft {
  if (!isRecord(value)) {
    throw new Error("Invalid interview evaluation response.");
  }

  const severity = readSeverity(value);
  const dimensionScores = readDimensionScores(value);

  return {
    category: readRequiredString(value, "category", 100),
    severity,
    dimensionScores,
    strengths: readStringArray(value, "strengths"),
    weaknesses: readStringArray(value, "weaknesses"),
    criticalConcerns: readStringArray(value, "criticalConcerns"),
    suggestedBetterAnswer: readRequiredString(
      value,
      "suggestedBetterAnswer",
      12_000
    ),
  };
}

export function parseInterviewScoreAudit(value: unknown): InterviewScoreAudit {
  if (!isRecord(value)) {
    throw new Error("Invalid interview score audit response.");
  }

  const answerIndex = value.answerIndex;
  if (
    typeof answerIndex !== "number" ||
    !Number.isSafeInteger(answerIndex) ||
    answerIndex < 0
  ) {
    throw new Error("Invalid interview score audit index.");
  }

  const severity = readSeverity(value);
  const dimensionScores = readDimensionScores(value);
  return {
    answerIndex,
    category: readRequiredString(value, "category", 100),
    severity,
    dimensionScores,
    score: calculateInterviewScore(dimensionScores, severity),
  };
}

function markdownList(items: string[]): string {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join("\n")
    : "- None identified.";
}

export function formatInterviewFeedback(
  evaluation: InterviewEvaluationDraft,
  score: number
): string {
  const criticalSection =
    evaluation.criticalConcerns.length > 0
      ? `\n\n#### Critical Concerns\n\n${markdownList(evaluation.criticalConcerns)}`
      : "";

  return `### Evaluation

**Score:** ${score}/100

**Assessment:** ${evaluation.severity === "none" ? "No material concern" : `${evaluation.severity[0].toUpperCase()}${evaluation.severity.slice(1)} concern`}

#### Strengths

${markdownList(evaluation.strengths)}

#### Weaknesses

${markdownList(evaluation.weaknesses)}${criticalSection}

#### Suggested Better Answer

${evaluation.suggestedBetterAnswer}`;
}

export function completeInterviewEvaluation(
  draft: InterviewEvaluationDraft
): InterviewEvaluation {
  const score = calculateInterviewScore(draft.dimensionScores, draft.severity);
  return {
    ...draft,
    score,
    feedbackMarkdown: formatInterviewFeedback(draft, score),
  };
}

export function sanitizeInterviewHistory(
  messages: MockInterviewMessage[]
): Array<Pick<MockInterviewMessage, "role" | "content">> {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "ai") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .map(({ role, content }) => ({ role, content: content.trim() }));
}

export function calculateInterviewSummary(
  messages: MockInterviewMessage[]
): {
  overallScore: number;
  categoryScores: InterviewCategoryScore[];
  answerCount: number;
} {
  const evaluations = messages.flatMap((message) =>
    message.role === "user" && message.evaluation ? [message.evaluation] : []
  );

  if (evaluations.length === 0) {
    throw new Error("No completed interview evaluations were found.");
  }

  const categoryTotals = new Map<string, { total: number; count: number }>();
  for (const evaluation of evaluations) {
    const current = categoryTotals.get(evaluation.category) ?? {
      total: 0,
      count: 0,
    };
    current.total += evaluation.score;
    current.count += 1;
    categoryTotals.set(evaluation.category, current);
  }

  const overallScore = Math.round(
    evaluations.reduce((total, evaluation) => total + evaluation.score, 0) /
      evaluations.length
  );
  const categoryScores = Array.from(categoryTotals.entries()).map(
    ([category, scores]) => ({
      category,
      score: Math.round(scores.total / scores.count),
    })
  );

  return { overallScore, categoryScores, answerCount: evaluations.length };
}

export function applyInterviewScoreAudits(
  messages: MockInterviewMessage[],
  audits: InterviewScoreAudit[]
): MockInterviewMessage[] {
  const auditsByIndex = new Map(
    audits.map((audit) => [audit.answerIndex, audit] as const)
  );
  let answerIndex = 0;

  return messages.map((message) => {
    if (message.role !== "user") {
      return message;
    }

    const audit = auditsByIndex.get(answerIndex);
    answerIndex += 1;
    if (!audit || !message.evaluation) {
      return message;
    }

    const evaluation = completeInterviewEvaluation({
      ...message.evaluation,
      category: audit.category,
      severity: audit.severity,
      dimensionScores: audit.dimensionScores,
    });

    return {
      ...message,
      evaluation,
      feedback: evaluation.feedbackMarkdown,
    };
  });
}
