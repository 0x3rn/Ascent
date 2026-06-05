"use client";

import React from "react";
import { useResume } from "@/lib/resume-context";

interface CoverLetterPreviewProps {
  body: string;
  targetRole: string;
  companyName: string;
}

export function CoverLetterPreview({ body, targetRole, companyName }: CoverLetterPreviewProps) {
  const { data } = useResume();
  const { personalInfo } = data;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 font-[Inter] shadow-2xl print:shadow-none print:w-auto print:h-auto print:min-h-0 print:m-0">
      <div className="px-[22mm] py-[20mm] print:px-[22mm] print:py-[20mm]">
        {/* Date */}
        <div className="mb-5">
          <p className="text-[12pt] leading-[1.4] text-zinc-700">{today}</p>
        </div>

        {/* Recipient */}
        {(targetRole || companyName) && (
          <div className="mb-5">
            <p className="text-[12pt] leading-[1.4] text-zinc-700">
              {companyName && <span>{companyName}</span>}
              {companyName && targetRole && <span> &mdash; </span>}
              {targetRole && <span>{targetRole}</span>}
            </p>
          </div>
        )}

        {/* Salutation */}
        <p className="text-[12pt] leading-[1.4] text-zinc-900 mb-3">
          Dear Hiring Manager,
        </p>

        {/* Body */}
        {body ? (
          <div className="text-[12pt] leading-[1.5] text-zinc-700 space-y-3 mb-5 print:break-inside-avoid">
            {body.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph.trim()}</p>
            ))}
          </div>
        ) : (
          <div className="text-[12pt] leading-[1.5] text-zinc-400 space-y-3 mb-5 italic">
            <p>Enter a target role and company name, then click "Generate Cover Letter" to create a tailored, AI-powered cover letter based on your resume.</p>
          </div>
        )}

        {/* Sign-off */}
        <div className="print:break-inside-avoid">
          <p className="text-[12pt] leading-[1.4] text-zinc-900 mb-4">
            Sincerely,
          </p>
          <p className="text-[12pt] leading-[1.4] font-semibold text-zinc-900">
            {personalInfo.fullName || "Your Name"}
          </p>
          {personalInfo.title && (
            <p className="text-[10pt] text-zinc-600 mt-0.5">
              {personalInfo.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}