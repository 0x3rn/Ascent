"use client";

import React from "react";
import { useResume } from "@/lib/resume-context";
import { marked } from "marked";
import { Mail, Phone, MapPin, Globe, Link } from "lucide-react";

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

export function ResumePreview() {
  const { data } = useResume();
  const { personalInfo, experience, projects, education, skills } = data;

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 font-[Inter] shadow-2xl print:shadow-none print:w-full print:h-auto print:min-h-0 print:m-0">
      <div className="px-[18mm] py-[16mm] print:px-[18mm] print:py-[16mm]">
        {/* Header — break-after-avoid keeps it with content */}
        <header className="text-center mb-4 print:break-after-avoid">
          <h1 className="text-[20pt] font-bold leading-tight text-zinc-900">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {personalInfo.title && (
            <p className="text-[14pt] text-zinc-600 mt-1 font-semibold leading-snug">
              {personalInfo.title}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2 text-[10pt] text-zinc-500">
            {personalInfo.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{personalInfo.linkedin}</span>
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{personalInfo.website}</span>
              </div>
            )}
          </div>
        </header>

        {/* Summary */}
        {personalInfo.summary && (
          <section className="mb-3.5 print:break-inside-avoid">
            <h2 className="text-[14pt] font-semibold leading-snug uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-0.5 mb-1.5">
              Professional Summary
            </h2>
            <MarkdownContent text={personalInfo.summary} />
          </section>
        )}

        {/* Experience — each block avoids being split across pages */}
        {experience.length > 0 && (
          <section className="mb-3.5 print:break-inside-avoid">
            <h2 className="text-[14pt] font-semibold leading-snug uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-0.5 mb-1.5">
              Professional Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-2.5 print:break-inside-avoid">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <div>
                    <h3 className="text-[14pt] font-semibold leading-snug text-zinc-900">
                      {exp.role || "Role"}
                      {exp.company && (
                        <span className="font-normal text-zinc-600">
                          {" "}
                          | {exp.company}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-[10pt] text-zinc-500">
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
                  <div className="mt-0.5 ml-0">
                    <BulletList text={exp.bullets} />
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mb-3.5 print:break-inside-avoid">
            <h2 className="text-[14pt] font-semibold leading-snug uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-0.5 mb-1.5">
              Project{projects.length !== 1 ? "s" : ""}
            </h2>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-2.5 print:break-inside-avoid">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <h3 className="text-[14pt] font-semibold leading-snug text-zinc-900">
                    {proj.name || "Project Name"}
                  </h3>
                  {proj.link && (
                    <span className="text-[10pt] text-zinc-500">{proj.link}</span>
                  )}
                </div>
                {proj.skills && (
                  <p className="text-[10pt] italic text-zinc-600 mt-0.5">
                    {proj.skills}
                  </p>
                )}
                {proj.bullets && (
                  <div className="mt-0.5 ml-0">
                    <BulletList text={proj.bullets} />
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-3.5 print:break-inside-avoid">
            <h2 className="text-[14pt] font-semibold leading-snug uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-0.5 mb-1.5">
              Education
            </h2>
            {education.map((edu) => (
              <div
                key={edu.id}
                className="flex justify-between items-baseline flex-wrap gap-1 mb-1.5 print:break-inside-avoid"
              >
                <div>
                  <h3 className="text-[14pt] font-semibold leading-snug text-zinc-900">
                    {edu.school || "School"}
                  </h3>
                  <p className="text-[12pt] leading-[1.4] text-zinc-600">
                    {edu.degree && <span>{edu.degree}</span>}
                    {edu.degree && edu.field && <span> in </span>}
                    {edu.field && <span>{edu.field}</span>}
                    {edu.gpa && <span> &mdash; GPA: {edu.gpa}</span>}
                  </p>
                </div>
                <div className="text-[10pt] text-zinc-500">
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
          <section className="print:break-inside-avoid">
            <h2 className="text-[14pt] font-semibold leading-snug uppercase tracking-[0.15em] text-zinc-800 border-b border-zinc-300 pb-0.5 mb-1.5">
              Skills
            </h2>
            {skills.map((sk) => (
              <div key={sk.id} className="mb-1.5">
                <p className="text-[12pt] leading-[1.4] text-zinc-900">
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