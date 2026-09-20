import type {
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  SkillCategory,
} from "@/lib/resume-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function mergeImportedResume(
  value: unknown,
  current: ResumeData,
  createId: () => string = () => crypto.randomUUID()
): ResumeData {
  if (!isRecord(value)) {
    throw new Error("The imported resume data is invalid.");
  }

  const personal = isRecord(value.personalInfo) ? value.personalInfo : {};
  const experience = records(value.experience).map(
    (item): ExperienceItem => ({
      id: createId(),
      company: text(item, "company"),
      role: text(item, "role"),
      startDate: text(item, "startDate"),
      endDate: text(item, "endDate"),
      location: text(item, "location"),
      bullets: text(item, "bullets"),
    })
  );
  const education = records(value.education).map(
    (item): EducationItem => ({
      id: createId(),
      school: text(item, "school"),
      degree: text(item, "degree"),
      field: text(item, "field"),
      startDate: text(item, "startDate"),
      endDate: text(item, "endDate"),
      gpa: text(item, "gpa"),
    })
  );
  const skills = records(value.skills).map(
    (item): SkillCategory => ({
      id: createId(),
      category: text(item, "category"),
      skills: text(item, "skills"),
    })
  );
  const projects = records(value.projects).map(
    (item): ProjectItem => ({
      id: createId(),
      name: text(item, "name"),
      link: text(item, "link"),
      skills: text(item, "skills"),
      bullets: text(item, "bullets"),
    })
  );

  return {
    personalInfo: {
      ...current.personalInfo,
      fullName: text(personal, "fullName") || current.personalInfo.fullName,
      title: text(personal, "title") || current.personalInfo.title,
      email: text(personal, "email") || current.personalInfo.email,
      phone: text(personal, "phone") || current.personalInfo.phone,
      location: text(personal, "location") || current.personalInfo.location,
      linkedin: text(personal, "linkedin") || current.personalInfo.linkedin,
      github: text(personal, "github") || current.personalInfo.github,
      website: text(personal, "website") || current.personalInfo.website,
      summary: text(personal, "summary") || current.personalInfo.summary,
    },
    experience: experience.length > 0 ? experience : current.experience,
    education: education.length > 0 ? education : current.education,
    skills: skills.length > 0 ? skills : current.skills,
    projects: projects.length > 0 ? projects : current.projects,
  };
}
