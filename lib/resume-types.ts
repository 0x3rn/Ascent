export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  bullets: string; // markdown-supported, one bullet per line
}

export interface ProjectItem {
  id: string;
  name: string;
  link: string;
  skills: string; // comma-separated list
  bullets: string; // markdown-supported, one bullet per line
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string; // comma-separated or freeform
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  skills: SkillCategory[];
}

export const EMPTY_PERSONAL_INFO: PersonalInfo = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
};

export const EMPTY_EXPERIENCE: ExperienceItem = {
  id: "",
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  location: "",
  bullets: "",
};

export const EMPTY_PROJECT: ProjectItem = {
  id: "",
  name: "",
  link: "",
  skills: "",
  bullets: "",
};

export const EMPTY_EDUCATION: EducationItem = {
  id: "",
  school: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  gpa: "",
};

export const EMPTY_SKILL_CATEGORY: SkillCategory = {
  id: "",
  category: "",
  skills: "",
};

export const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "Alexandra Sterling",
    title: "Senior Product Manager",
    email: "alex@sterling.co",
    phone: "+1 (415) 555-0147",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/asterling",
    website: "asterling.co",
    summary:
      "Product leader with 8+ years of experience driving 0-to-1 products at high-growth SaaS companies. Scaled a B2B platform from $2M to $18M ARR in 2 years. Passionate about data-informed roadmaps, cross-functional leadership, and relentless user focus.",
  },
  experience: [
    {
      id: crypto.randomUUID(),
      company: "Notion",
      role: "Senior Product Manager",
      startDate: "2021",
      endDate: "Present",
      location: "San Francisco, CA",
      bullets:
        "- Led the redesign of the core editor experience, increasing daily active usage by 34%\n- Grew enterprise deal velocity 3x by launching a self-serve admin console\n- Managed a cross-functional squad of 8 engineers, 2 designers, and a data scientist",
    },
    {
      id: crypto.randomUUID(),
      company: "Stripe",
      role: "Product Manager",
      startDate: "2018",
      endDate: "2021",
      location: "San Francisco, CA",
      bullets:
        "- Launched Stripe Tax in 14 countries, generating $40M+ in first-year revenue\n- Reduced merchant onboarding friction by 60% through a streamlined KYC flow\n- Defined and tracked 15+ North Star metrics across the billing product line",
    },
  ],
  projects: [
    {
      id: crypto.randomUUID(),
      name: "Revenue Dashboard",
      link: "github.com/asterling/revenue-dash",
      skills: "React, D3.js, PostgreSQL, AWS Lambda",
      bullets:
        "- Built a real-time revenue analytics dashboard processing 2M+ daily transactions\n- Designed the data pipeline to reduce query latency from 4s to under 200ms\n- Collaborated with 3 engineers to ship the MVP in 6 weeks",
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      school: "Stanford University",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2013",
      endDate: "2017",
      gpa: "3.9",
    },
  ],
  skills: [
    {
      id: crypto.randomUUID(),
      category: "Product & Strategy",
      skills: "Roadmapping, OKRs, User Research, A/B Testing, Competitive Analysis",
    },
    {
      id: crypto.randomUUID(),
      category: "Technical",
      skills: "SQL, Python, Amplitude, Looker, Figma, Jira, Linear",
    },
    {
      id: crypto.randomUUID(),
      category: "Leadership",
      skills: "Cross-functional Leadership, Mentorship, Stakeholder Management",
    },
  ],
};