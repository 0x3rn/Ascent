"use client";

import React from "react";
import { useResume } from "@/lib/resume-context";
import { marked } from "marked";
import { Mail, Phone, MapPin, Globe, Link } from "lucide-react";

interface ResumePreviewProps {
  themeFont?: string;
  themeAccent?: string;
}

const FONT_MAP: Record<string, string> = {
  inter: "Inter, sans-serif",
  lora: "Lora, Georgia, serif",
  geist: "Geist Mono, monospace",
};

const COLOR_MAP: Record<string, string> = {
  slate: "#64748b",
  navy: "#1e3a5f",
  forest: "#2d6a4f",
};

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

function MarkdownContent({ text }: { text: string }) {
  const html = marked.parse(text, { breaks: true }) as string;
  return (
    <div
      className="text-[10.5pt] leading-[1.4] text-zinc-700 space-y-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-0.5 [&_li]:my-0 [&_p]:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BulletList({ text }: { text: string }) {
  const html = marked.parse(text, { breaks: true }) as string;
  return (
    <div
      className="text-[10.5pt] leading-[1.4] text-zinc-700 space-y-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-0 [&_li]:my-0 [&_p]:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ResumePreview({ themeFont = "inter", themeAccent = "slate" }: ResumePreviewProps) {
  const { data } = useResume();
  const { personalInfo, experience, projects, education, skills } = data;
  const fontFamily = FONT_MAP[themeFont] || FONT_MAP.inter;
  const accentColor = COLOR_MAP[themeAccent] || COLOR_MAP.slate;

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl print:shadow-none print:w-auto print:h-auto print:min-h-0 print:m-0" style={{ fontFamily }}>
      <div className="px-[18mm] py-[16mm] print:px-[18mm] print:py-[16mm]">
        <header className="text-center mb-3 print:break-after-avoid">
          <h1 className="text-[18pt] font-bold leading-tight uppercase" style={{ color: accentColor }}>{personalInfo.fullName || "Your Name"}</h1>
          {personalInfo.title && (<p className="text-[11.5pt] text-zinc-600 mt-0.5 font-semibold leading-snug">{personalInfo.title}</p>)}
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1.5 text-[9pt] text-zinc-500 print:justify-center">
            {personalInfo.email && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Mail className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.email}</span></div>)}
            {personalInfo.phone && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.phone}</span></div>)}
            {personalInfo.location && (<div className="flex items-center gap-1.5 whitespace-nowrap"><MapPin className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.location}</span></div>)}
            {personalInfo.linkedin && (<div className="flex items-center gap-1.5 whitespace-nowrap"><LinkedinIcon className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.linkedin}</span></div>)}
            {(personalInfo as any).github && (<div className="flex items-center gap-1.5 whitespace-nowrap"><GithubIcon className="w-3 h-3 flex-shrink-0" /><span>{(personalInfo as any).github}</span></div>)}
            {personalInfo.website && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Globe className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.website}</span></div>)}
          </div>
        </header>
        {personalInfo.summary && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Professional Summary</h2>
            <MarkdownContent text={personalInfo.summary} />
          </section>
        )}
        {experience.length > 0 && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Professional Experience</h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-2 print:break-inside-avoid">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-[11.5pt] font-semibold leading-snug text-zinc-900">{exp.role || "Role"}</h3>
                    {exp.company && (<div className="text-[10pt] italic text-zinc-700 mt-0.5">{exp.company}</div>)}
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0">
                    <div className="text-[9pt] text-zinc-500">
                      {exp.startDate && <span>{exp.startDate}</span>}
                      {exp.startDate && exp.endDate && <span> &ndash; </span>}
                      {exp.endDate && <span>{exp.endDate}</span>}
                    </div>
                    {exp.location && <div className="text-[9pt] italic text-zinc-500 mt-0.5">{exp.location}</div>}
                  </div>
                </div>
                {exp.bullets && (<div className="mt-1 ml-0"><BulletList text={exp.bullets} /></div>)}
              </div>
            ))}
          </section>
        )}
        {projects.length > 0 && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Project{projects.length !== 1 ? "s" : ""}</h2>
            {projects.map((proj) => (<div key={proj.id} className="mb-2 print:break-inside-avoid"><div className="flex justify-between items-baseline gap-2"><h3 className="text-[11.5pt] font-semibold leading-snug text-zinc-900">{proj.name || "Project Name"}</h3>{proj.link && <span className="text-[9pt] text-zinc-500 whitespace-nowrap shrink-0">{proj.link}</span>}</div>{proj.skills && <p className="text-[9pt] italic text-zinc-600 mt-0.5">{proj.skills}</p>}{proj.bullets && (<div className="mt-0.5 ml-0"><BulletList text={proj.bullets} /></div>)}</div>))}
          </section>
        )}
        {education.length > 0 && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Education</h2>
            {education.map((edu) => (<div key={edu.id} className="flex justify-between items-baseline flex-wrap gap-1 mb-1 print:break-inside-avoid"><div><h3 className="text-[11.5pt] font-semibold leading-snug text-zinc-900">{edu.school || "School"}</h3><p className="text-[10.5pt] leading-[1.4] text-zinc-600">{edu.degree}{edu.degree && edu.field && <span> in </span>}{edu.field}{edu.gpa && <span> &mdash; GPA: {edu.gpa}</span>}</p></div><div className="text-[9pt] text-zinc-500 whitespace-nowrap">{edu.startDate}{edu.startDate && edu.endDate && <span> &ndash; </span>}{edu.endDate}</div></div>))}
          </section>
        )}
        {skills.length > 0 && (
          <section className="print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Skills</h2>
            {skills.map((sk) => (<div key={sk.id} className="mb-1"><p className="text-[10.5pt] leading-[1.4] text-zinc-900"><span className="font-semibold">{sk.category}: </span><span className="text-zinc-700">{sk.skills}</span></p></div>))}
          </section>
        )}
      </div>
    </div>
  );
}