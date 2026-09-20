"use client";

import React from "react";
import { useResume } from "@/lib/resume-context";
import type { ResumeData } from "@/lib/resume-types";
import { RESUME_SECTION_TITLES, type ResumeTemplateId } from "@/lib/resume-templates";
import { marked } from "marked";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

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
  black: "#18181b",
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

interface TemplateRenderProps {
  data: ResumeData;
  fontFamily: string;
  accentColor: string;
}

function ContactDetails({ data, className = "" }: { data: ResumeData; className?: string }) {
  const { personalInfo } = data;
  const details = [
    { value: personalInfo.email, icon: <Mail className="h-3 w-3 shrink-0" aria-hidden="true" /> },
    { value: personalInfo.phone, icon: <Phone className="h-3 w-3 shrink-0" aria-hidden="true" /> },
    { value: personalInfo.location, icon: <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /> },
    { value: personalInfo.linkedin, icon: <LinkedinIcon className="h-3 w-3 shrink-0" /> },
    { value: personalInfo.github, icon: <GithubIcon className="h-3 w-3 shrink-0" /> },
    { value: personalInfo.website, icon: <Globe className="h-3 w-3 shrink-0" aria-hidden="true" /> },
  ].filter((detail): detail is { value: string; icon: React.JSX.Element } => Boolean(detail.value));

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[8.5pt] ${className}`}>
      {details.map((detail, index) => <span key={`${detail.value}-${index}`} className="flex items-center gap-1.5 whitespace-nowrap">{detail.icon}{detail.value}</span>)}
    </div>
  );
}

function ProjectLink({ link, className = "" }: { link?: string; className?: string }) {
  if (!link) return null;
  return <span className={`text-[8.5pt] leading-snug text-zinc-500 ${className}`}>{link}</span>;
}

function ModernResumeTemplate({ data, fontFamily, accentColor }: TemplateRenderProps) {
  const { personalInfo, experience, projects, education, skills } = data;
  return (
    <div className="w-full min-h-[297mm] bg-white text-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] print:w-[210mm] print:min-h-0 print:shadow-none" style={{ fontFamily }}>
      <header className="px-[18mm] py-[15mm] text-white print:px-[18mm] print:py-[12mm]" style={{ backgroundColor: accentColor }}>
        <h1 className="text-[25pt] font-bold leading-none tracking-tight">{personalInfo.fullName || "Your Name"}</h1>
        {personalInfo.title && <p className="mt-2 text-[12pt] font-medium text-white/90">{personalInfo.title}</p>}
        <ContactDetails data={data} className="mt-5 text-white/80" />
      </header>
      <div className="px-[18mm] py-[12mm] print:px-[18mm] print:py-[10mm]">
        {personalInfo.summary && <section className="mb-7 print:mb-5"><h2 className="mb-2 text-[10pt] font-bold uppercase tracking-[0.16em]" style={{ color: accentColor }}>{RESUME_SECTION_TITLES.summary}</h2><MarkdownContent text={personalInfo.summary} /></section>}
        {experience.length > 0 && <section className="mb-7 print:mb-5"><h2 className="mb-3 border-b border-zinc-200 pb-2 text-[10pt] font-bold uppercase tracking-[0.16em]" style={{ color: accentColor }}>{RESUME_SECTION_TITLES.experience}</h2>{experience.map((exp) => <div key={exp.id} className="mb-5 print:mb-4 print:break-inside-avoid"><div className="flex justify-between gap-4"><div><h3 className="text-[10.5pt] font-bold">{exp.role || "Role"}</h3>{exp.company && <p className="text-[9.5pt] font-medium text-zinc-500">{exp.company}</p>}</div><div className="shrink-0 text-right text-[8.5pt] text-zinc-500">{exp.startDate}{exp.startDate && exp.endDate && <span> &ndash; </span>}{exp.endDate}{exp.location && <div>{exp.location}</div>}</div></div>{exp.bullets && <div className="mt-2"><BulletList text={exp.bullets} /></div>}</div>)}</section>}
        <div className="grid grid-cols-2 gap-x-8 print:gap-x-6">
          {projects.length > 0 && <section className="mb-6 print:break-inside-avoid"><h2 className="mb-3 border-b border-zinc-200 pb-2 text-[10pt] font-bold uppercase tracking-[0.16em]" style={{ color: accentColor }}>{RESUME_SECTION_TITLES.projects}</h2>{projects.map((project) => <div key={project.id} className="mb-4"><h3 className="text-[10pt] font-bold">{project.name || "Project Name"}</h3><ProjectLink link={project.link} className="mt-0.5 block" />{project.skills && <p className="text-[8.5pt] italic text-zinc-500">{project.skills}</p>}{project.bullets && <div className="mt-1"><BulletList text={project.bullets} /></div>}</div>)}</section>}
          {education.length > 0 && <section className="mb-6 print:break-inside-avoid"><h2 className="mb-3 border-b border-zinc-200 pb-2 text-[10pt] font-bold uppercase tracking-[0.16em]" style={{ color: accentColor }}>{RESUME_SECTION_TITLES.education}</h2>{education.map((edu) => <div key={edu.id} className="mb-3"><h3 className="text-[10pt] font-bold">{edu.school || "School"}</h3><p className="text-[9pt] text-zinc-600">{edu.degree}{edu.degree && edu.field && " in "}{edu.field}</p><p className="text-[8.5pt] text-zinc-500">{edu.startDate}{edu.startDate && edu.endDate && <span> &ndash; </span>}{edu.endDate}</p></div>)}</section>}
        </div>
        {skills.length > 0 && <section className="print:break-inside-avoid"><h2 className="mb-3 border-b border-zinc-200 pb-2 text-[10pt] font-bold uppercase tracking-[0.16em]" style={{ color: accentColor }}>{RESUME_SECTION_TITLES.skills}</h2><div className="grid grid-cols-2 gap-x-8 gap-y-2">{skills.map((skill) => <p key={skill.id} className="text-[9pt] text-zinc-700"><span className="font-bold text-zinc-900">{skill.category}: </span>{skill.skills}</p>)}</div></section>}
      </div>
    </div>
  );
}

function MinimalResumeTemplate({ data, fontFamily, accentColor }: TemplateRenderProps) {
  const { personalInfo, experience, projects, education, skills } = data;
  return (
    <div className="w-full min-h-[297mm] border-l-[7px] bg-white px-[16mm] py-[15mm] text-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] print:w-[210mm] print:min-h-0 print:px-[16mm] print:py-[12mm] print:shadow-none" style={{ borderColor: accentColor, fontFamily }}>
      <header className="mb-7 border-b border-zinc-200 pb-5 print:mb-5"><div className="flex items-start justify-between gap-6"><div><h1 className="text-[22pt] font-bold leading-none tracking-tight">{personalInfo.fullName || "Your Name"}</h1>{personalInfo.title && <p className="mt-2 text-[11pt] font-medium" style={{ color: accentColor }}>{personalInfo.title}</p>}</div><ContactDetails data={data} className="max-w-[58mm] justify-end text-right text-zinc-500" /></div></header>
      {personalInfo.summary && <section className="mb-6 print:mb-4"><h2 className="mb-2 text-[9.5pt] font-bold uppercase tracking-[0.2em] text-zinc-500">Professional Summary</h2><MarkdownContent text={personalInfo.summary} /></section>}
      {experience.length > 0 && <section className="mb-6 print:mb-4"><h2 className="mb-3 text-[9.5pt] font-bold uppercase tracking-[0.2em] text-zinc-500">Professional Experience</h2>{experience.map((exp) => <div key={exp.id} className="mb-4 border-l border-zinc-200 pl-4 print:break-inside-avoid"><div className="flex justify-between gap-3"><div><h3 className="text-[10pt] font-bold">{exp.role || "Role"}</h3>{exp.company && <p className="text-[9pt] text-zinc-500">{exp.company}{exp.location && `, ${exp.location}`}</p>}</div><p className="shrink-0 text-[8.5pt] text-zinc-500">{exp.startDate}{exp.startDate && exp.endDate && <span> &ndash; </span>}{exp.endDate}</p></div>{exp.bullets && <div className="mt-1"><BulletList text={exp.bullets} /></div>}</div>)}</section>}
      {projects.length > 0 && <section className="mb-6 print:mb-4"><h2 className="mb-3 text-[9.5pt] font-bold uppercase tracking-[0.2em] text-zinc-500">Projects</h2>{projects.map((project) => <div key={project.id} className="mb-3 print:break-inside-avoid"><h3 className="text-[10pt] font-bold">{project.name || "Project Name"}</h3><ProjectLink link={project.link} className="mt-0.5 block" />{project.skills && <p className="text-[8.5pt] text-zinc-500">{project.skills}</p>}{project.bullets && <div className="mt-1"><BulletList text={project.bullets} /></div>}</div>)}</section>}
      <div className="grid grid-cols-2 gap-x-8 print:gap-x-6">{education.length > 0 && <section className="print:break-inside-avoid"><h2 className="mb-3 text-[9.5pt] font-bold uppercase tracking-[0.2em] text-zinc-500">Education</h2>{education.map((edu) => <div key={edu.id} className="mb-3"><h3 className="text-[10pt] font-bold">{edu.school || "School"}</h3><p className="text-[9pt] text-zinc-600">{edu.degree}{edu.degree && edu.field && " in "}{edu.field}</p><p className="text-[8.5pt] text-zinc-500">{edu.startDate}{edu.startDate && edu.endDate && <span> &ndash; </span>}{edu.endDate}</p></div>)}</section>}{skills.length > 0 && <section className="print:break-inside-avoid"><h2 className="mb-3 text-[9.5pt] font-bold uppercase tracking-[0.2em] text-zinc-500">Skills</h2>{skills.map((skill) => <p key={skill.id} className="mb-2 text-[9pt] text-zinc-700"><span className="font-bold text-zinc-900">{skill.category}: </span>{skill.skills}</p>)}</section>}</div>
    </div>
  );
}

function EditorialResumeTemplate({ data, fontFamily, accentColor }: TemplateRenderProps) {
  const { personalInfo, experience, projects, education, skills } = data;
  return (
    <div className="grid w-full min-h-[297mm] grid-cols-[58mm_1fr] bg-white text-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] print:w-[210mm] print:min-h-0 print:shadow-none" style={{ fontFamily }}>
      <aside className="bg-zinc-950 px-[9mm] py-[13mm] text-white print:px-[8mm] print:py-[11mm]">
        <div className="mb-8 h-1 w-11 rounded-full" style={{ backgroundColor: accentColor }} />
        <h1 className="text-[18pt] font-bold leading-tight tracking-tight">{personalInfo.fullName || "Your Name"}</h1>
        {personalInfo.title && <p className="mt-2 text-[9.5pt] leading-snug text-white/70">{personalInfo.title}</p>}

        <div className="my-7 h-px bg-white/15" />
        <section className="mb-7">
          <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>Contact</h2>
          <ContactDetails data={data} className="mt-3 !flex-col !flex-nowrap !gap-y-2 text-[8.5pt] text-white/70" />
        </section>
        {education.length > 0 && <section className="mb-7">
          <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>Education</h2>
          <div className="mt-3 space-y-4">
            {education.map((edu) => <div key={edu.id} className="print:break-inside-avoid"><h3 className="text-[9pt] font-semibold leading-snug">{edu.school || "School"}</h3><p className="mt-1 text-[8.5pt] leading-snug text-white/65">{edu.degree}{edu.degree && edu.field && " in "}{edu.field}</p><p className="mt-1 text-[8pt] text-white/45">{edu.startDate}{edu.startDate && edu.endDate && <span> &ndash; </span>}{edu.endDate}</p></div>)}
          </div>
        </section>}
        {skills.length > 0 && <section>
          <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>Skills</h2>
          <div className="mt-3 space-y-3">
            {skills.map((skill) => <div key={skill.id}><p className="text-[8.5pt] font-semibold">{skill.category}</p><p className="mt-0.5 text-[8pt] leading-snug text-white/65">{skill.skills}</p></div>)}
          </div>
        </section>}
      </aside>
      <main className="px-[13mm] py-[13mm] print:px-[12mm] print:py-[11mm]">
        {personalInfo.summary && <section className="mb-8 print:mb-6"><h2 className="mb-2 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>Professional Summary</h2><MarkdownContent text={personalInfo.summary} /></section>}
        {experience.length > 0 && <section className="mb-8 print:mb-6"><h2 className="mb-4 border-b border-zinc-200 pb-2 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>Professional Experience</h2>{experience.map((exp) => <div key={exp.id} className="mb-6 print:mb-5 print:break-inside-avoid"><div className="flex justify-between gap-4"><div><h3 className="text-[10.5pt] font-bold leading-snug">{exp.role || "Role"}</h3>{exp.company && <p className="mt-0.5 text-[9pt] text-zinc-500">{exp.company}{exp.location && `, ${exp.location}`}</p>}</div><p className="shrink-0 text-right text-[8.5pt] text-zinc-500">{exp.startDate}{exp.startDate && exp.endDate && <span> &ndash; </span>}{exp.endDate}</p></div>{exp.bullets && <div className="mt-2"><BulletList text={exp.bullets} /></div>}</div>)}</section>}
        {projects.length > 0 && <section className="print:break-inside-avoid"><h2 className="mb-4 border-b border-zinc-200 pb-2 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>Projects</h2>{projects.map((project) => <div key={project.id} className="mb-5"><h3 className="text-[10pt] font-bold">{project.name || "Project Name"}</h3><ProjectLink link={project.link} className="mt-0.5 block" />{project.skills && <p className="mt-0.5 text-[8.5pt] text-zinc-500">{project.skills}</p>}{project.bullets && <div className="mt-1"><BulletList text={project.bullets} /></div>}</div>)}</section>}
      </main>
    </div>
  );
}

function StatementResumeTemplate({ data, fontFamily, accentColor }: TemplateRenderProps) {
  const { personalInfo, experience, projects, education, skills } = data;
  return (
    <div className="w-full min-h-[297mm] bg-white text-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] print:w-[210mm] print:min-h-0 print:shadow-none" style={{ fontFamily }}>
      <header className="grid grid-cols-[14mm_1fr] bg-zinc-950 text-white">
        <div style={{ backgroundColor: accentColor }} />
        <div className="px-[16mm] py-[15mm] print:px-[14mm] print:py-[12mm]">
          <h1 className="max-w-[132mm] text-[28pt] font-bold leading-[0.95] tracking-[-0.045em]">{personalInfo.fullName || "Your Name"}</h1>
          {personalInfo.title && <p className="mt-3 text-[12pt] font-medium text-white/75">{personalInfo.title}</p>}
          <ContactDetails data={data} className="mt-7 text-[8.5pt] text-white/70" />
        </div>
      </header>
      <div className="grid grid-cols-[1fr_54mm] gap-9 px-[18mm] py-[13mm] print:grid-cols-[1fr_50mm] print:gap-7 print:px-[16mm] print:py-[10mm]">
        <main>
          {personalInfo.summary && <section className="mb-8 border-l-4 bg-zinc-50 px-5 py-4 print:mb-6 print:px-4 print:py-3" style={{ borderColor: accentColor }}><h2 className="mb-2 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>Professional Summary</h2><MarkdownContent text={personalInfo.summary} /></section>}
          {experience.length > 0 && <section className="mb-8 print:mb-6"><h2 className="mb-4 border-b-2 pb-2 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ borderColor: accentColor, color: accentColor }}>Professional Experience</h2>{experience.map((exp) => <div key={exp.id} className="mb-5 border-b border-zinc-200 pb-5 last:mb-0 last:border-b-0 last:pb-0 print:break-inside-avoid"><div className="flex justify-between gap-4"><div><h3 className="text-[10.5pt] font-bold leading-snug">{exp.role || "Role"}</h3>{exp.company && <p className="mt-0.5 text-[9pt] text-zinc-500">{exp.company}{exp.location && `, ${exp.location}`}</p>}</div><p className="shrink-0 text-right text-[8.5pt] font-medium text-zinc-500">{exp.startDate}{exp.startDate && exp.endDate && <span> &ndash; </span>}{exp.endDate}</p></div>{exp.bullets && <div className="mt-2"><BulletList text={exp.bullets} /></div>}</div>)}</section>}
          {projects.length > 0 && <section className="print:break-inside-avoid"><h2 className="mb-4 border-b-2 pb-2 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ borderColor: accentColor, color: accentColor }}>Projects</h2>{projects.map((project) => <article key={project.id} className="mb-5 border-b border-zinc-200 pb-5 last:mb-0 last:border-b-0 last:pb-0"><div className="flex items-baseline justify-between gap-3"><h3 className="text-[10pt] font-bold">{project.name || "Project Name"}</h3><ProjectLink link={project.link} className="shrink-0 text-right" /></div>{project.skills && <p className="mt-1 text-[8.5pt] text-zinc-500">{project.skills}</p>}{project.bullets && <div className="mt-1"><BulletList text={project.bullets} /></div>}</article>)}</section>}
        </main>
        <aside className="border-l border-zinc-200 pl-6 print:pl-5">
          {education.length > 0 && <section className="mb-8 print:mb-6"><h2 className="mb-3 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>Education</h2><div className="space-y-4">{education.map((edu) => <div key={edu.id} className="print:break-inside-avoid"><h3 className="text-[9pt] font-bold leading-snug">{edu.school || "School"}</h3><p className="mt-1 text-[8.5pt] leading-snug text-zinc-600">{edu.degree}{edu.degree && edu.field && " in "}{edu.field}</p><p className="mt-1 text-[8pt] text-zinc-500">{edu.startDate}{edu.startDate && edu.endDate && <span> &ndash; </span>}{edu.endDate}</p></div>)}</div></section>}
          {skills.length > 0 && <section><h2 className="mb-3 text-[9.5pt] font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>Skills</h2><div className="space-y-3">{skills.map((skill) => <div key={skill.id}><p className="text-[8.5pt] font-bold">{skill.category}</p><p className="mt-0.5 text-[8.5pt] leading-snug text-zinc-600">{skill.skills}</p></div>)}</div></section>}
        </aside>
      </div>
    </div>
  );
}

export function ResumePreview({ template = "classic", themeFont = "inter", themeAccent = "slate" }: ResumePreviewProps & { template?: ResumeTemplateId }) {
  const { data } = useResume();
  const { personalInfo, experience, projects, education, skills } = data;
  const fontFamily = FONT_MAP[themeFont] || FONT_MAP.inter;
  const accentColor = COLOR_MAP[themeAccent] || COLOR_MAP.slate;

  if (template === "modern") return <ModernResumeTemplate data={data} fontFamily={fontFamily} accentColor={accentColor} />;
  if (template === "minimal") return <MinimalResumeTemplate data={data} fontFamily={fontFamily} accentColor={accentColor} />;
  if (template === "editorial") return <EditorialResumeTemplate data={data} fontFamily={fontFamily} accentColor={accentColor} />;
  if (template === "statement") return <StatementResumeTemplate data={data} fontFamily={fontFamily} accentColor={accentColor} />;

  return (
    <div className="w-full min-h-[297mm] bg-white text-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 print:w-[210mm] print:h-auto print:min-h-0 print:m-0 print:shadow-none print:ring-0" style={{ fontFamily }}>
      <table className="w-full border-0 border-collapse">
        <thead className="hidden print:table-header-group">
          <tr><td style={{ height: "16mm" }}></td></tr>
        </thead>
        <tfoot className="hidden print:table-footer-group">
          <tr><td style={{ height: "16mm" }}></td></tr>
        </tfoot>
        <tbody>
          <tr>
            <td>
              <div className="px-[18mm] py-[16mm] print:px-[18mm] print:py-0">
                <header className="text-center mb-3 print:break-after-avoid">
          <h1 className="text-[18pt] font-bold leading-tight uppercase" style={{ color: accentColor }}>{personalInfo.fullName || "Your Name"}</h1>
          {personalInfo.title && (<p className="text-[11.5pt] text-zinc-600 mt-0.5 font-semibold leading-snug">{personalInfo.title}</p>)}
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-1.5 text-[9pt] text-zinc-500 print:justify-center">
            {personalInfo.email && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Mail className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.email}</span></div>)}
            {personalInfo.phone && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.phone}</span></div>)}
            {personalInfo.location && (<div className="flex items-center gap-1.5 whitespace-nowrap"><MapPin className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.location}</span></div>)}
            {personalInfo.linkedin && (<div className="flex items-center gap-1.5 whitespace-nowrap"><LinkedinIcon className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.linkedin}</span></div>)}
            {personalInfo.github && (<div className="flex items-center gap-1.5 whitespace-nowrap"><GithubIcon className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.github}</span></div>)}
            {personalInfo.website && (<div className="flex items-center gap-1.5 whitespace-nowrap"><Globe className="w-3 h-3 flex-shrink-0" /><span>{personalInfo.website}</span></div>)}
          </div>
        </header>
        {personalInfo.summary && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid print:break-after-avoid" style={{ borderColor: accentColor, color: accentColor }}>Professional Summary</h2>
            <MarkdownContent text={personalInfo.summary} />
          </section>
        )}
        {experience.length > 0 && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid print:break-after-avoid" style={{ borderColor: accentColor, color: accentColor }}>Professional Experience</h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-2 print:break-inside-avoid">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-[10pt] font-bold leading-snug text-zinc-900">{exp.role || "Role"}</h3>
                    {exp.company && (<div className="text-[9.5pt] italic text-zinc-700 mt-0.5">{exp.company}</div>)}
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
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid print:break-after-avoid" style={{ borderColor: accentColor, color: accentColor }}>{RESUME_SECTION_TITLES.projects}</h2>
            {projects.map((proj) => (<div key={proj.id} className="mb-2 print:break-inside-avoid"><div className="flex justify-between items-baseline gap-2"><h3 className="text-[10pt] font-bold leading-snug text-zinc-900">{proj.name || "Project Name"}</h3>{proj.link && <span className="text-[9pt] text-zinc-500 whitespace-nowrap shrink-0">{proj.link}</span>}</div>{proj.skills && <p className="text-[9pt] italic text-zinc-600 mt-0.5">{proj.skills}</p>}{proj.bullets && (<div className="mt-0.5 ml-0"><BulletList text={proj.bullets} /></div>)}</div>))}
          </section>
        )}
        {education.length > 0 && (
          <section className="mb-2.5 print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid print:break-after-avoid" style={{ borderColor: accentColor, color: accentColor }}>Education</h2>
            {education.map((edu) => (<div key={edu.id} className="flex justify-between items-baseline flex-wrap gap-1 mb-1 print:break-inside-avoid"><div><h3 className="text-[10pt] font-bold leading-snug text-zinc-900">{edu.school || "School"}</h3><p className="text-[9.5pt] leading-[1.4] text-zinc-600">{edu.degree}{edu.degree && edu.field && <span> in </span>}{edu.field}{edu.gpa && <span> - GPA: {edu.gpa}</span>}</p></div><div className="text-[9pt] text-zinc-500 whitespace-nowrap">{edu.startDate}{edu.startDate && edu.endDate && <span> - </span>}{edu.endDate}</div></div>))}
          </section>
        )}
        {skills.length > 0 && (
          <section className="print:pt-[10mm]">
            <h2 className="text-[11pt] font-bold leading-snug uppercase tracking-normal pb-0.5 mb-1 border-b border-solid print:break-after-avoid" style={{ borderColor: accentColor, color: accentColor }}>Skills</h2>
            {skills.map((sk) => (<div key={sk.id} className="mb-1"><p className="text-[10.5pt] leading-[1.4] text-zinc-900"><span className="font-semibold">{sk.category}: </span><span className="text-zinc-700">{sk.skills}</span></p></div>))}
          </section>
        )}
      </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
