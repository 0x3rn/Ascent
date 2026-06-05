"use client";

import React from "react";

interface CoverLetterPreviewProps {
  body: string;
  targetRole: string;
  companyName: string;
  userName: string;
}

export function CoverLetterPreview({ body, targetRole, companyName, userName }: CoverLetterPreviewProps) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 font-[Inter] shadow-2xl print:shadow-none print:w-auto print:h-auto print:min-h-0 print:m-0">
      {/* Table print hack: repeats thead/tfoot spacers on every printed page */}
      <table className="w-full border-collapse border-0 m-0 p-0">
        <thead className="print:table-header-group hidden">
          <tr>
            <td className="h-[15mm] border-0 p-0 m-0"></td>
          </tr>
        </thead>
        <tbody className="border-0 p-0 m-0">
          <tr>
            <td className="border-0 p-0 m-0 align-top print:px-[20mm]">
              <div className="px-[22mm] py-[20mm] print:p-0">
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
                  <div className="text-[12pt] leading-[1.5] text-zinc-700 space-y-3 mb-0">
                    {body.split("\n\n").map((paragraph, i) => (
                      <p key={i}>{paragraph.trim()}</p>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12pt] leading-[1.5] text-zinc-400 space-y-3 mb-0 italic">
                    <p>Enter your details and click "Generate Cover Letter" to create a tailored, AI-powered cover letter.</p>
                  </div>
                )}

                {/* Sign-off */}
                <div className="mt-8">
                  <p className="text-[12pt] leading-[1.4] text-zinc-900 mb-4">
                    Sincerely,
                  </p>
                  <p className="text-[12pt] leading-[1.4] font-semibold text-zinc-900">
                    {userName || "Your Name"}
                  </p>
                  {targetRole && (
                    <p className="text-[10pt] text-zinc-600 mt-0.5">
                      {targetRole}
                    </p>
                  )}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot className="print:table-footer-group hidden">
          <tr>
            <td className="h-[15mm] border-0 p-0 m-0"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}