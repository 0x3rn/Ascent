"use client";

import React from "react";
import { useResume } from "@/lib/resume-context";
import { marked } from "marked";
import { Mail, Phone, MapPin, Globe, Link } from "lucide-react";

function MarkdownContent({ text }: { text: string }) {
  const html = marked.parse(text, { breaks: true }) as string;
  return (
    <div
      className="prose prose-sm prose-zinc max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0 prose-li:text-[10.5px] prose-li:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BulletList({ text }: { text: string }) {
  const html = marked.parse(text, { breaks: true }) as string;
  return (
    <div
      className="text-[10.5px] leading-relaxed text-zinc-700 space-y-0.5 prose-ul:my-0 prose-li:my-0 prose-p:my-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ResumePreview() {
  const { data } = useResume();
  const { personalInfo, experience, projects, education, skills } = data;

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 font-[Georgia,'Times New Roman',serif] shadow-2xl print:shadow-none print:w-full print:min-h-screen print:m-0">
      {/* A4 Content */}
      <div className="px-[18mm] py-[16mm] print:px-[18mm] print:py-[16mm]">
        {/* Header */}
        <header className="text-center mb-5">
          <h1 className="text-[22pt] font-bold tracking-tight text-zinc-900 leading-tight">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {personalInfo.title && (
            <p className="text-[10.5pt] text-zinc-600 mt-0.5">
              {personalInfo.title}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-1.5 text-[9pt] text-zinc-500 flex-wrap">
            {personalInfo.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {personalInfo.location}
              </span>
            )}
            {personalInfo.linkedin && (
              <span className="flex items-center gap-1">
                <Link className="h-3 w-3" />
                {personalInfo.linkedin}
              </span>
            )}
            {personalInfo.website && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {personalInfo.website}
              </span>
            )}
          </div>
        </header>

        {/* Summary */}
        {personalInfo.summary && (
          <section className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              Professional Summary
            </h2>
            <MarkdownContent text={personalInfo.summary} />
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              Professional Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <div>
                    <h3 className="text-[10.5pt] font-bold text-zinc-900">
                      {exp.role || "Role"}
                      {exp.company && (
                        <span className="font-normal text-zinc-600">
                          {" "}
                          | {exp.company}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-[9pt] text-zinc-500">
                    {exp.startDate && <span>{exp.startDate}</span>}
                    {exp.startDate && exp.endDate && (
                      <span> &ndash; </span>
                    )}
                    {exp.endDate && <span>{exp.endDate}</span>}
                    {exp.location && (
                      <span className="ml-1.5">{exp.location}</span>
                    )}
                  </div>
                </div>
                {exp.bullets && (
                  <div className="mt-1 ml-0">
                    <BulletList text={exp.bullets} />
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              Project{projects.length !== 1 ? "s" : ""}
            </h2>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-3">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <h3 className="text-[10.5pt] font-bold text-zinc-900">
                    {proj.name || "Project Name"}
                  </h3>
                  {proj.link && (
                    <span className="text-[9pt] text-zinc-500">{proj.link}</span>
                  )}
                </div>
                {proj.skills && (
                  <p className="text-[9pt] italic text-zinc-600 mt-0.5">
                    {proj.skills}
                  </p>
                )}
                {proj.bullets && (
                  <div className="mt-1 ml-0">
                    <BulletList text={proj.bullets} />
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-[10pt] font-bold uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              Education
            </h2>
            {education.map((edu) => (
              <div
                key={edu.id}
                className="flex justify-between items-baseline flex-wrap gap-1 mb-1.5"
              >
                <div>
                  <h3 className="text-[10.5pt] font-bold text-zinc-900">
                    {edu.school || "School"}
                  </h3>
                  <p className="text-[9.5pt] text-zinc-600">
                    {edu.degree && <span>{edu.degree}</span>}
                    {edu.degree && edu.field && <span> in </span>}
                    {edu.field && <span>{edu.field}</span>}
                    {edu.gpa && <span> &mdash; GPA: {edu.gpa}</span>}
                  </p>
                </div>
                <div className="text-[9pt] text-zinc-500">
                  {edu.startDate && <span>{edu.startDate}</span>}
                  {edu.startDate && edu.endDate && <span> &ndash; </span>}
                  {edu.endDate && <span>{edu.endDate}</span>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h2 className="text-[10pt] font-bold uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-1 mb-2">
              Skills
            </h2>
            {skills.map((sk) => (
              <div key={sk.id} className="mb-1.5">
                <p className="text-[10pt] text-zinc-900">
                  {sk.category && (
                    <span className="font-semibold">{sk.category}: </span>
                  )}
                  {sk.skills && (
                    <span className="text-zinc-700">{sk.skills}</span>
                  )}
                </p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}