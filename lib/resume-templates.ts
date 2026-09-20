export type ResumeTemplateId = "classic" | "modern" | "minimal" | "editorial" | "statement";

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  description: string;
  bestFor: string;
  atsSafe: boolean;
}

export const RESUME_TEMPLATES: readonly ResumeTemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic",
    description: "A balanced, traditional layout with clear section dividers.",
    bestFor: "Most roles",
    atsSafe: true,
  },
  {
    id: "modern",
    name: "Modern",
    description: "A stronger visual header and confident editorial hierarchy.",
    bestFor: "Product, business, and creative roles",
    atsSafe: true,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "A restrained, high-density layout that keeps attention on the content.",
    bestFor: "Technical and detail-heavy resumes",
    atsSafe: true,
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "A confident split layout with a dark profile rail and focused content column.",
    bestFor: "Leadership and communications roles",
    atsSafe: true,
  },
  {
    id: "statement",
    name: "Statement",
    description: "A high-impact layout with oversized type, bold blocks, and clear visual pacing.",
    bestFor: "Creative, product, and portfolio-led roles",
    atsSafe: true,
  },
];

export const DEFAULT_RESUME_TEMPLATE: ResumeTemplateId = "classic";
export const RESUME_TEMPLATE_STORAGE_KEY = "ascent_resume_template";

export const RESUME_SECTION_TITLES = {
  summary: "Professional Summary",
  experience: "Professional Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
} as const;

export function isResumeTemplateId(value: string): value is ResumeTemplateId {
  return RESUME_TEMPLATES.some((template) => template.id === value);
}
