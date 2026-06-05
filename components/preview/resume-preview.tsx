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

function MarkdownContent({ text }: { text: string }) {
  const html = marked.parse(text, { breaks: true }) as string;
  return (
    <div
      className="text-[12pt] leading-[1.4] text-zinc-700 space-y-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-0.5 [&_li]:my-0 [&_p]:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BulletList({ text }: { text: string }) {
  const html = marked.parse(text, { breaks: true }) as string;
  return (
    <div
      className="text-[12pt] leading-[1.4] text-zinc-700 space-y-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-0 [&_li]:my-0 [&_p]:my-0"
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
        <header className="text-center mb-4 print:break-after-avoid">
          <h1 className="text-[20pt] font-bold leading-tight uppercase" style={{ color: accentColor }}>{personalInfo.fullName || "Your Name"}</h1>
          {personalInfo.title && (<p className="text-[13pt] text-zinc-600 mt-1 font-semibold leading-snug">{personalInfo.title}</p>)}
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-1.5 text-[10pt] text-zinc-500">
            {personalInfo.email && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span>{personalInfo.email}</span></div>)}
            {personalInfo.phone && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><span>{personalInfo.phone}</span></div>)}
            {personalInfo.location && (<div className="flex items-center gap-1.5 whitespace-nowrap"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{personalInfo.location}</span></div>)}
            {personalInfo.linkedin && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Link className="w-3.5 h-3.5 flex-shrink-0" /><span>{personalInfo.linkedin}</span></div>)}
            {personalInfo.website && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Globe className="w-3.5 h-3.5 flex-shrink-0" /><span>{personalInfo.website}</span></div>)}
          </div>
        </header>
        {personalInfo.summary && (
          <section className="mb-3 print:pt-[10mm] print:break-inside-avoid">
            <h2 className="text-[12pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1.5 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Professional Summary</h2>
            <MarkdownContent text={personalInfo.summary} />
          </section>
        )}
        {experience.length > 0 && (
          <section className="mb-3 print:pt-[10mm] print:break-inside-avoid">
            <h2 className="text-[12pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1.5 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Professional Experience</h2>
            {experience.map((exp) => (<div key={exp.id} className="mb-2.5 print:break-inside-avoid"><div className="flex justify-between items-baseline flex-wrap gap-1"><div><h3 className="text-[13pt] font-semibold leading-snug text-zinc-900">{exp.role || "Role"}{exp.company && (<span className="font-normal text-zinc-600"> | {exp.company}</span>)}</h3></div><div className="text-[10pt] text-zinc-500 whitespace-nowrap">{exp.startDate && <span>{exp.startDate}</span>}{exp.startDate && exp.endDate && <span> &ndash; </span>}{exp.endDate && <span>{exp.endDate}</span>}{exp.location && <span className="ml-1.5">{exp.location}</span>}</div></div>{exp.bullets && (<div className="mt-0.5 ml-0"><BulletList text={exp.bullets} /></div>)}</div>))}
          </section>
        )}
        {projects.length > 0 && (
          <section className="mb-3 print:pt-[10mm] print:break-inside-avoid">
            <h2 className="text-[12pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1.5 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Project{projects.length !== 1 ? "s" : ""}</h2>
            {projects.map((proj) => (<div key={proj.id} className="mb-2.5 print:break-inside-avoid"><div className="flex justify-between items-baseline flex-wrap gap-1"><h3 className="text-[13pt] font-semibold leading-snug text-zinc-900">{proj.name || "Project Name"}</h3>{proj.link && <span className="text-[10pt] text-zinc-500 whitespace-nowrap">{proj.link}</span>}</div>{proj.skills && <p className="text-[10pt] italic text-zinc-600 mt-0.5">{proj.skills}</p>}{proj.bullets && (<div className="mt-0.5 ml-0"><BulletList text={proj.bullets} /></div>)}</div>))}
          </section>
        )}
        {education.length > 0 && (
          <section className="mb-3 print:pt-[10mm] print:break-inside-avoid">
            <h2 className="text-[12pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1.5 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Education</h2>
            {education.map((edu) => (<div key={edu.id} className="flex justify-between items-baseline flex-wrap gap-1 mb-1.5 print:break-inside-avoid"><div><h3 className="text-[13pt] font-semibold leading-snug text-zinc-900">{edu.school || "School"}</h3><p className="text-[12pt] leading-[1.4] text-zinc-600">{edu.degree}{edu.degree && edu.field && <span> in </span>}{edu.field}{edu.gpa && <span> &mdash; GPA: {edu.gpa}</span>}</p></div><div className="text-[10pt] text-zinc-500 whitespace-nowrap">{edu.startDate}{edu.startDate && edu.endDate && <span> &ndash; </span>}{edu.endDate}</div></div>))}
          </section>
        )}
        {skills.length > 0 && (
          <section className="print:pt-[10mm] print:break-inside-avoid">
            <h2 className="text-[12pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1.5 border-b border-solid" style={{ borderColor: accentColor, color: accentColor }}>Skills</h2>
            {skills.map((sk) => (<div key={sk.id} className="mb-1.5"><p className="text-[12pt] leading-[1.4] text-zinc-900"><span className="font-semibold">{sk.category}: </span><span className="text-zinc-700">{sk.skills}</span></p></div>))}
          </section>
        )}
      </div>
    </div>
  );
}