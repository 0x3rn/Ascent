"use client";

import React from "react";
import { marked } from "marked";

interface InterviewPreviewProps {
  content: string;
  targetRole: string;
  companyName: string;
  themeFont: string;
  themeAccent: string;
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

export function InterviewPreview({ content, targetRole, companyName, themeFont, themeAccent }: InterviewPreviewProps) {
  const fontFamily = FONT_MAP[themeFont] || FONT_MAP.inter;
  const accentColor = COLOR_MAP[themeAccent] || COLOR_MAP.slate;

  const html = content ? (marked.parse(content, { breaks: true }) as string) : "";

  return (
    <div
      className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl print:shadow-none print:w-auto print:h-auto print:min-h-0 print:m-0"
      style={{ fontFamily }}
    >
      <table className="w-full border-collapse border-0 m-0 p-0">
        <thead className="print:table-header-group hidden">
          <tr><td className="h-[15mm] border-0 p-0 m-0"></td></tr>
        </thead>
        <tbody className="border-0 p-0 m-0">
          <tr>
            <td className="border-0 p-0 m-0 align-top print:px-[20mm]">
              <div className="px-[22mm] py-[20mm] print:p-0">
                <h1 className="text-[20pt] font-bold leading-tight mb-1" style={{ color: accentColor }}>
                  Interview Preparation Guide
                </h1>
                {(targetRole || companyName) && (
                  <p className="text-[12pt] text-zinc-600 mb-6">
                    {targetRole}{companyName ? ` at ${companyName}` : ""}
                  </p>
                )}
                {content ? (
                  <div
                    className="text-[12pt] leading-[1.5] text-zinc-700 space-y-3 prose prose-zinc max-w-none [&_h2]:text-[14pt] [&_h2]:font-semibold [&_h3]:text-[13pt] [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-zinc-900"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <div className="text-[12pt] leading-[1.5] text-zinc-400 italic">
                    <p>Enter a target role and company name, then click &quot;Generate Prep Guide&quot; to create custom interview questions based on your resume.</p>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot className="print:table-footer-group hidden">
          <tr><td className="h-[15mm] border-0 p-0 m-0"></td></tr>
        </tfoot>
      </table>
    </div>
  );
}
