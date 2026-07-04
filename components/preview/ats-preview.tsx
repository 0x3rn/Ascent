"use client";

import React from "react";

interface AtsPreviewProps {
  atsResult: any;
  atsRole: string;
  atsCompany: string;
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

export function AtsPreview({ atsResult, atsRole, atsCompany, themeFont, themeAccent }: AtsPreviewProps) {
  const fontFamily = FONT_MAP[themeFont] || FONT_MAP.inter;
  const accentColor = COLOR_MAP[themeAccent] || COLOR_MAP.slate;

  if (!atsResult) {
    return (
      <div
        className="w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl print:shadow-none print:w-auto print:h-auto print:min-h-0 print:m-0 flex items-center justify-center p-12"
        style={{ fontFamily }}
      >
        <div className="text-[12pt] leading-[1.5] text-zinc-400 italic text-center">
          <p>Run the Semantic Recruiter Engine to see your ATS Compatibility Report here.</p>
        </div>
      </div>
    );
  }

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
                  Semantic ATS Match Report
                </h1>
                {(atsRole || atsCompany) && (
                  <p className="text-[12pt] text-zinc-600 mb-8">
                    {atsRole}{atsCompany ? ` at ${atsCompany}` : ""}
                  </p>
                )}

                <div className="text-[11pt] leading-[1.6] text-zinc-800 space-y-8">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: "Overall Match", val: atsResult.scores.compositeScore },
                      { label: "ATS Compatibility", val: atsResult.scores.atsCompatibility },
                      { label: "Recruiter Appeal", val: atsResult.scores.recruiterAppeal }
                    ].map((s, i) => (
                      <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                        <div className="text-[24pt] font-black mb-1" style={{ color: accentColor }}>{s.val}%</div>
                        <div className="text-[10pt] font-semibold text-zinc-600 uppercase tracking-wider text-center">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strong Areas */}
                  {atsResult.insights.strongAreas && atsResult.insights.strongAreas.length > 0 && (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-green-700">
                        <span className="text-green-600">✓</span> Strong Areas
                      </h2>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {atsResult.insights.strongAreas.map((area: string, i: number) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weak Areas */}
                  {atsResult.insights.weakAreas && atsResult.insights.weakAreas.length > 0 && (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-red-700">
                        <span className="text-red-600">✗</span> Areas for Improvement
                      </h2>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {atsResult.insights.weakAreas.map((area: string, i: number) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recruiter Note */}
                  {atsResult.insights.recruiterFeedback && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <h2 className="text-[12pt] font-semibold mb-2 flex items-center gap-2 text-blue-700 uppercase tracking-wide">
                        Recruiter Note
                      </h2>
                      <p className="text-[11pt] text-zinc-700 italic">
                        &quot;{atsResult.insights.recruiterFeedback}&quot;
                      </p>
                    </div>
                  )}

                  {/* Project Alignment */}
                  {atsResult.projectEvaluation && (
                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                      <h2 className="text-[12pt] font-semibold mb-2 flex items-center justify-between text-zinc-800 uppercase tracking-wide">
                        <span>Project Alignment</span>
                        <span className="text-[10pt] font-bold bg-white px-2 py-1 rounded-md border border-zinc-200">
                          {atsResult.projectEvaluation.matchStatus}
                        </span>
                      </h2>
                      <p className="text-[11pt] text-zinc-700">
                        {atsResult.projectEvaluation.feedback}
                      </p>
                    </div>
                  )}
                  {/* Concept-Based Analysis */}
                  {atsResult.skillConcepts && atsResult.skillConcepts.length > 0 && (
                    <div className="mt-6 border-t border-zinc-200 pt-6">
                      <h2 className="text-[14pt] font-semibold mb-4 text-zinc-900 flex items-center gap-2">
                        <span className="text-blue-600">❖</span> Concept-Based Analysis
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        {atsResult.skillConcepts.map((concept: any, i: number) => (
                          <div key={i} className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2 border-b border-zinc-200 pb-2">
                              <span className="font-bold text-[11pt] text-zinc-800">{concept.category}</span>
                              <span className={`font-bold text-[10pt] ${concept.matchPercentage >= 70 ? 'text-green-600' : concept.matchPercentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                {concept.matchPercentage}% Match
                              </span>
                            </div>
                            <div className="space-y-2 text-[10pt]">
                              {concept.matchedSkills && concept.matchedSkills.length > 0 && (
                                <div>
                                  <strong className="text-green-700 block mb-0.5">Found:</strong>
                                  <p className="text-zinc-600 leading-snug">{concept.matchedSkills.join(", ")}</p>
                                </div>
                              )}
                              {concept.missingSkills && concept.missingSkills.length > 0 && (
                                <div>
                                  <strong className="text-red-700 block mb-0.5">Missing:</strong>
                                  <p className="text-zinc-600 leading-snug">{concept.missingSkills.join(", ")}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bullet Point Upgrades */}
                  {atsResult.actionableRewrites && atsResult.actionableRewrites.length > 0 && (
                    <div className="mt-6 border-t border-zinc-200 pt-6">
                      <h2 className="text-[14pt] font-semibold mb-4 text-zinc-900 flex items-center gap-2">
                        <span className="text-amber-500">★</span> Bullet Point Upgrades
                      </h2>
                      <div className="space-y-4">
                        {atsResult.actionableRewrites.map((rewrite: any, i: number) => (
                          <div key={i} className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-[10pt] font-bold text-red-600 mb-1">Original (Weak)</h4>
                                <p className="text-[10pt] text-zinc-600 line-through leading-relaxed">{rewrite.originalText}</p>
                              </div>
                              <div>
                                <h4 className="text-[10pt] font-bold text-green-600 mb-1">Suggested (Impact-Driven)</h4>
                                <p className="text-[10pt] text-zinc-900 font-medium leading-relaxed">{rewrite.improvedText}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-zinc-100">
                              <p className="text-[9.5pt] text-zinc-500 italic"><span className="font-semibold not-italic">Why:</span> {rewrite.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
