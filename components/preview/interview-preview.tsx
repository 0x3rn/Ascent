"use client";

import React from "react";
import { marked } from "marked";

interface InterviewPreviewProps {
  content: string;
  mockReport?: any;
  mockMessages?: any[];
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

export function InterviewPreview({ content, mockReport, mockMessages, targetRole, companyName, themeFont, themeAccent }: InterviewPreviewProps) {
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
                  {mockReport ? "Live Mock Interview Report" : "Interview Preparation Guide"}
                </h1>
                {(targetRole || companyName) && (
                  <p className="text-[12pt] text-zinc-600 mb-6">
                    {targetRole}{companyName ? ` at ${companyName}` : ""}
                  </p>
                )}

                {mockReport ? (
                  <div className="text-[11pt] leading-[1.6] text-zinc-800 space-y-6">
                    <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                      <h2 className="text-[14pt] font-semibold m-0 text-zinc-900">Overall Performance</h2>
                      <div className="text-[22pt] font-black" style={{ color: accentColor }}>{mockReport.overallScore}%</div>
                    </div>
                    
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 text-zinc-900 border-b border-zinc-200 pb-2">Category Scores</h2>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {mockReport.categoryScores?.map((cs: any, i: number) => (
                          <div key={i} className="flex justify-between items-center border-b border-zinc-100 pb-1">
                            <span className="font-medium text-zinc-700">{cs.category}</span>
                            <span className="font-bold text-zinc-900">{cs.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {mockReport.weakestAreas && mockReport.weakestAreas.length > 0 && (
                      <div>
                        <h2 className="text-[14pt] font-semibold mb-3 text-zinc-900 border-b border-zinc-200 pb-2">Areas for Improvement</h2>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                          {mockReport.weakestAreas.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}

                    {mockMessages && mockMessages.length > 0 && (
                      <div className="mt-8 pt-4">
                        <h2 className="text-[14pt] font-semibold mb-3 text-zinc-900 border-b border-zinc-200 pb-2">Interview Transcript</h2>
                        <div className="space-y-4">
                          {mockMessages.map((msg, idx) => (
                            <div key={idx} className={`p-3 rounded-lg text-[11pt] ${msg.role === 'user' ? 'bg-blue-50/50 border border-blue-100 ml-8' : 'bg-zinc-50 border border-zinc-100 mr-8'}`}>
                              <div className="font-semibold mb-1 text-[10pt] uppercase tracking-wider text-zinc-500">{msg.role === 'user' ? 'Candidate' : 'Interviewer'}</div>
                              <div className="prose prose-sm max-w-none text-zinc-700 prose-p:leading-snug" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content, { breaks: true }) as string }} />
                              {msg.feedback && (
                                <div className="mt-2 pt-2 border-t border-blue-200/50">
                                  <div className="font-semibold text-[9pt] text-blue-800 uppercase mb-1">Feedback</div>
                                  <div className="prose prose-sm max-w-none text-blue-900 text-[10pt]" dangerouslySetInnerHTML={{ __html: marked.parse(msg.feedback, { breaks: true }) as string }} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mockReport.idealAnswersMarkdown && (
                      <div>
                        <h2 className="text-[14pt] font-semibold mb-3 text-zinc-900 border-b border-zinc-200 pb-2">Ideal Answers</h2>
                        <div className="prose prose-sm max-w-none text-zinc-700 prose-headings:text-[12pt] prose-headings:font-semibold prose-p:leading-snug" dangerouslySetInnerHTML={{ __html: marked.parse(mockReport.idealAnswersMarkdown, { breaks: true }) as string }} />
                      </div>
                    )}

                    {mockReport.studyPlanMarkdown && (
                      <div className="mt-8 pt-4">
                        <h2 className="text-[14pt] font-semibold mb-3 text-zinc-900 border-b border-zinc-200 pb-2">Recommended Study Plan</h2>
                        <div className="prose prose-sm max-w-none text-zinc-700 prose-headings:text-[12pt] prose-headings:font-semibold prose-p:leading-snug" dangerouslySetInnerHTML={{ __html: marked.parse(mockReport.studyPlanMarkdown, { breaks: true }) as string }} />
                      </div>
                    )}
                  </div>
                ) : content ? (
                  <div
                    className="text-[12pt] leading-[1.5] text-zinc-700 space-y-3 prose prose-zinc max-w-none [&_h2]:text-[14pt] [&_h2]:font-semibold [&_h3]:text-[13pt] [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-zinc-900"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <div className="text-[12pt] leading-[1.5] text-zinc-400 italic">
                    <p>Enter a target role and company name, then generate a prep guide or complete a live mock interview to see the results here.</p>
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
