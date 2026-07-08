"use client";

import React from "react";
import { TrendingUp, CheckCircle2, AlertTriangle, XCircle, Star, ArrowRightLeft, GraduationCap, Briefcase, LineChart, CheckSquare, Wrench, Sparkles, Map, Rocket } from "lucide-react";

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
                  CareerFit Report
                </h1>
                {(atsRole || atsCompany) && (
                  <p className="text-[12pt] text-zinc-600 mb-6">
                    {atsRole}{atsCompany ? ` at ${atsCompany}` : ""}
                  </p>
                )}

                {atsResult.executiveSummary && (
                  <div className="mb-8 p-5 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <h2 className="text-[12pt] font-bold mb-2 flex items-center gap-2" style={{ color: accentColor }}>
                      Executive Summary
                    </h2>
                    <p className="text-[10pt] text-zinc-700 leading-[1.6] whitespace-pre-wrap">
                      {atsResult.executiveSummary}
                    </p>
                  </div>
                )}

                <div className="text-[11pt] leading-[1.6] text-zinc-800 space-y-8">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Overall Match", val: atsResult.scores.overallMatch },
                      { label: "Resume Quality", val: atsResult.scores.resumeQuality },
                      { label: "ATS Compatibility", val: atsResult.scores.atsCompatibility },
                      { label: "Recruiter Appeal", val: atsResult.scores.recruiterAppeal },
                      { label: "Exp. Relevance", val: atsResult.scores.experienceRelevance },
                      { label: "Technical Match", val: atsResult.scores.technicalMatch },
                      { label: "Domain Match", val: atsResult.scores.domainMatch },
                      { label: "Interview Prob.", val: atsResult.scores.interviewProbability }
                    ].map((s, i) => (
                      <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                        <div className={`text-[18pt] font-black mb-1 ${s.val >= 75 ? 'text-green-600' : s.val >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{s.val ?? "-"}%</div>
                        <div className="text-[8pt] font-semibold text-zinc-600 uppercase tracking-wider text-center">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top 3 Next Steps */}
                  {atsResult.top3NextSteps && atsResult.top3NextSteps.length > 0 && (
                    <div className="mt-4 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                      <h2 className="text-[12pt] font-semibold mb-3 flex items-center gap-2 text-amber-800 uppercase tracking-wide">
                        <TrendingUp className="h-5 w-5 text-amber-600" /> At a Glance: Top 3 Next Steps
                      </h2>
                      <ol className="list-decimal pl-5 space-y-2 text-zinc-800 text-[10.5pt]">
                        {atsResult.top3NextSteps.map((step: string, i: number) => (
                          <li key={i} className="pl-1 leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Resume Quality Breakdown */}
                  {atsResult.resumeQualityBreakdown && (
                    <div className="mt-4 p-4 border border-zinc-200 bg-zinc-50 rounded-xl">
                      <h3 className="text-[10pt] font-bold text-zinc-600 uppercase tracking-wider mb-3">Resume Quality Breakdown</h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { label: "Formatting", val: atsResult.resumeQualityBreakdown.formatting },
                          { label: "Content", val: atsResult.resumeQualityBreakdown.contentQuality },
                          { label: "Achievements", val: atsResult.resumeQualityBreakdown.achievements },
                          { label: "Action Verbs", val: atsResult.resumeQualityBreakdown.actionVerbs },
                          { label: "Readability", val: atsResult.resumeQualityBreakdown.readability },
                          { label: "Organization", val: atsResult.resumeQualityBreakdown.organization }
                        ].map((q, i) => (
                          <div key={i} className="flex flex-col items-center justify-center p-2 bg-white rounded border border-zinc-200 text-center">
                            <span className="text-[8.5pt] text-zinc-500 uppercase font-semibold mb-0.5 leading-tight">{q.label}</span>
                            <span className={`text-[11pt] font-bold ${q.val >= 85 ? 'text-green-600' : q.val >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{q.val}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Strengths */}
                  {(atsResult.topStrengths && atsResult.topStrengths.length > 0) ? (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5 text-green-600" /> Top Strengths
                      </h2>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {atsResult.topStrengths.map((area: string, i: number) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  ) : atsResult.insights?.strongAreas && atsResult.insights.strongAreas.length > 0 && (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5 text-green-600" /> Strong Areas
                      </h2>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {atsResult.insights.strongAreas.map((area: string, i: number) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weak Areas / Missing Skills Impact */}
                  {atsResult.missingSkillsImpact ? (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5 text-red-600" /> Missing Skills Impact
                      </h2>
                      <div className={`grid ${atsResult.missingSkillsImpact.criticalGaps?.length > 0 && atsResult.missingSkillsImpact.moderateGaps?.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        {atsResult.missingSkillsImpact.criticalGaps && atsResult.missingSkillsImpact.criticalGaps.length > 0 && (
                          <div>
                            <h3 className="font-bold text-red-800 mb-2 text-[10pt] uppercase tracking-wide">Critical Gaps</h3>
                            <div className="space-y-3">
                              {atsResult.missingSkillsImpact.criticalGaps.map((gap: any, i: number) => (
                                <div key={i} className="bg-white p-2.5 rounded border border-red-100">
                                  <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                                    <span className="text-[10pt] font-bold text-red-900 flex items-center gap-1.5"><span className="text-red-500">•</span> {gap.skill}</span>
                                    {gap.confidence && <span className="text-[8pt] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-semibold">{gap.confidence}% Confidence</span>}
                                  </div>
                                  <p className="text-[9pt] text-red-800/80 leading-snug mb-1.5"><span className="font-semibold text-red-800">Reason:</span> {gap.reason}</p>
                                  {gap.whyItMatters && <p className="text-[9pt] text-red-800/80 leading-snug mb-1.5"><span className="font-semibold text-red-800">Why Employers Care:</span> {gap.whyItMatters}</p>}
                                  {gap.commonUseCases && gap.commonUseCases.length > 0 && (
                                    <div className="text-[9pt] flex flex-wrap gap-1 mt-1">
                                      <span className="font-semibold text-red-800 mr-1">Uses:</span>
                                      {gap.commonUseCases.map((useCase: string, idx: number) => (
                                        <span key={idx} className="bg-red-50 text-red-700 px-1 rounded">{useCase}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {atsResult.missingSkillsImpact.moderateGaps && atsResult.missingSkillsImpact.moderateGaps.length > 0 && (
                          <div>
                            <h3 className="font-bold text-amber-700 mb-2 text-[10pt] uppercase tracking-wide">Moderate Gaps</h3>
                            <div className="space-y-3">
                              {atsResult.missingSkillsImpact.moderateGaps.map((gap: any, i: number) => (
                                <div key={i} className="bg-white p-2.5 rounded border border-amber-100">
                                  <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                                    <span className="text-[10pt] font-bold text-amber-900 flex items-center gap-1.5"><span className="text-amber-500">•</span> {gap.skill}</span>
                                    {gap.confidence && <span className="text-[8pt] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">{gap.confidence}% Confidence</span>}
                                  </div>
                                  <p className="text-[9pt] text-amber-800/80 leading-snug mb-1.5"><span className="font-semibold text-amber-800">Reason:</span> {gap.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : atsResult.insights.weakAreas && atsResult.insights.weakAreas.length > 0 && (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5 text-red-600" /> Areas for Improvement
                      </h2>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                        {atsResult.insights.weakAreas.map((area: string, i: number) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Highest ROI Improvements */}
                  {atsResult.highestRoiImprovements && atsResult.highestRoiImprovements.length > 0 && (
                    <div>
                      <h2 className="text-[14pt] font-semibold mb-3 border-b border-zinc-200 pb-2 flex items-center gap-2 text-purple-700">
                        <Star className="h-5 w-5 text-purple-600" /> Highest ROI Improvements
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        {atsResult.highestRoiImprovements.map((improvement: any, i: number) => (
                          <div key={i} className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-[11pt] text-purple-900">{improvement.skill}</span>
                              <div className="text-[10pt] text-purple-600">
                                {Array.from({ length: 5 }).map((_, starIdx) => (
                                  <span key={starIdx}>{starIdx < improvement.stars ? '★' : '☆'}</span>
                                ))}
                              </div>
                            </div>
                            {improvement.expectedImpact && (
                              <div className="flex gap-2 items-center mb-2">
                                <span className="text-[9pt] font-bold text-purple-700 bg-purple-200/50 px-2 py-0.5 rounded uppercase tracking-wider">
                                  Impact: {improvement.expectedImpact}
                                </span>
                                {improvement.estimatedMatchImprovementRange && (
                                  <span className="text-[9pt] font-semibold text-zinc-500">
                                    +{improvement.estimatedMatchImprovementRange} to Match Score
                                  </span>
                                )}
                              </div>
                            )}
                            {improvement.reason && (
                              <p className="text-[10pt] text-purple-800 leading-snug">{improvement.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
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

                  {/* Skill Transferability */}
                  {atsResult.skillTransferability && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <h2 className="text-[12pt] font-semibold mb-3 flex items-center gap-2 text-emerald-800 uppercase tracking-wide">
                        <ArrowRightLeft className="h-5 w-5 text-emerald-600" /> Skill Transferability
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-bold text-emerald-900 mb-1 text-[10pt]">Transferable Strengths:</h3>
                          <ul className="list-none space-y-0.5 text-zinc-700 text-[10pt]">
                            {atsResult.skillTransferability.transferableStrengths.map((s: string, i: number) => (
                              <li key={i}>✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-900 mb-1 text-[10pt]">Foundation For:</h3>
                          <ul className="list-disc pl-5 space-y-0.5 text-zinc-700 text-[10pt]">
                            {atsResult.skillTransferability.foundationFor.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hiring Recommendation */}
                  {atsResult.hiringRecommendation && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <h2 className="text-[12pt] font-semibold mb-3 flex items-center gap-2 text-indigo-800 uppercase tracking-wide">
                        <GraduationCap className="h-5 w-5 text-indigo-600" /> Hiring Recommendation
                      </h2>
                      <div className="grid grid-cols-2 gap-4 text-[10pt] text-zinc-800">
                        <div>
                          <p className="mb-1"><strong className="text-indigo-900">Current Fit:</strong> {atsResult.hiringRecommendation.currentFit}</p>
                          <p className="mb-1"><strong className="text-indigo-900">Interview Worthy:</strong> {atsResult.hiringRecommendation.interviewWorthy ? "Yes" : "No"}</p>
                          {atsResult.hiringRecommendation.hiringConfidence && (
                            <p className="mb-1"><strong className="text-indigo-900">Hiring Confidence:</strong> {atsResult.hiringRecommendation.hiringConfidence}</p>
                          )}
                          <p><strong className="text-indigo-900">Est. Onboarding:</strong> {atsResult.hiringRecommendation.estimatedOnboardingTime}</p>
                        </div>
                        <div>
                          <p className="mb-1"><strong className="text-indigo-900">Reason:</strong> {atsResult.hiringRecommendation.reason}</p>
                          {atsResult.hiringRecommendation.gaps && atsResult.hiringRecommendation.gaps.length > 0 && (
                            <p><strong className="text-indigo-900">Gaps:</strong> {atsResult.hiringRecommendation.gaps.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Best Matching Roles & Salary Estimate */}
                  {(atsResult.similarRoles?.length > 0 || atsResult.estimatedCompetitiveness) && (
                    <div className="grid grid-cols-2 gap-4">
                      {atsResult.similarRoles && atsResult.similarRoles.length > 0 && (
                        <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                          <h2 className="text-[12pt] font-semibold mb-3 flex items-center gap-2 text-sky-800 uppercase tracking-wide">
                            <Briefcase className="h-5 w-5 text-sky-600" /> Better Matched Roles
                          </h2>
                          <div className="space-y-2 text-[10pt] text-zinc-800">
                            {atsResult.similarRoles.map((role: any, i: number) => (
                              <div key={i} className="flex justify-between border-b border-sky-100 pb-1.5 last:border-0 last:pb-0">
                                <span className="font-medium">{role.role}</span>
                                <span className="font-bold text-sky-700">{role.matchPercentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {atsResult.estimatedCompetitiveness && (
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <h2 className="text-[12pt] font-semibold mb-3 flex items-center gap-2 text-amber-800 uppercase tracking-wide">
                              <LineChart className="h-5 w-5 text-amber-600" /> Estimated Competitiveness
                            </h2>
                            <div className="text-[10pt] text-zinc-800 flex flex-col gap-1">
                              <span className="font-semibold text-[11pt]">Overall Level: {atsResult.estimatedCompetitiveness.currentLevel}</span>
                            </div>
                            <div className="space-y-2 mt-3 text-[10pt]">
                              {atsResult.estimatedCompetitiveness.resumeQualityPercentile && (
                                <div className="flex justify-between border-b border-amber-200 pb-1.5">
                                  <span className="font-medium text-amber-900">Resume Quality</span>
                                  <span className="font-bold text-amber-800">{atsResult.estimatedCompetitiveness.resumeQualityPercentile}</span>
                                </div>
                              )}
                              {atsResult.estimatedCompetitiveness.technicalMatchPercentile && (
                                <div className="flex justify-between border-b border-amber-200 pb-1.5">
                                  <span className="font-medium text-amber-900">Technical Match</span>
                                  <span className="font-bold text-amber-800">{atsResult.estimatedCompetitiveness.technicalMatchPercentile}</span>
                                </div>
                              )}
                              {atsResult.estimatedCompetitiveness.atsCompatibilityPercentile && (
                                <div className="flex justify-between border-b border-amber-200 pb-1.5">
                                  <span className="font-medium text-amber-900">ATS Compatibility</span>
                                  <span className="font-bold text-amber-800">{atsResult.estimatedCompetitiveness.atsCompatibilityPercentile}</span>
                                </div>
                              )}
                            </div>
                          </div>
                      )}
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
                  {/* Requirements Comparison */}
                  {atsResult.requirementsComparison && atsResult.requirementsComparison.length > 0 && (
                    <div className="mt-4 border border-zinc-200 rounded-xl overflow-hidden">
                      <h2 className="text-[12pt] font-semibold p-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2 text-zinc-800 uppercase tracking-wide">
                        <CheckSquare className="h-5 w-5 text-sky-600" /> Strength vs Job Requirements
                      </h2>
                      <div className="divide-y divide-zinc-200">
                        {atsResult.requirementsComparison.map((req: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 text-[10pt]">
                            <span className="font-medium text-zinc-700">{req.requirement}</span>
                            {req.status === "Strong" ? (
                              <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded text-[9pt]">✓ Strong</span>
                            ) : (
                              <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[9pt]">✗ Missing</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Concept-Based Analysis */}
                  {atsResult.skillConcepts && atsResult.skillConcepts.length > 0 && (
                    <div className="mt-6 border-t border-zinc-200 pt-6">
                      <h2 className="text-[14pt] font-semibold mb-4 text-zinc-900 flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" /> Concept-Based Analysis
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        {atsResult.skillConcepts.map((concept: any, i: number) => (
                          <div key={i} className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2 border-b border-zinc-200 pb-2">
                              <span className="font-bold text-[11pt] text-zinc-800">{concept.category}</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-[10pt] ${concept.matchPercentage >= 75 ? 'text-green-600' : concept.matchPercentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {concept.matchPercentage}%
                                </span>
                                <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden">
                                  <div className={`h-full ${concept.matchPercentage >= 75 ? 'bg-green-500' : concept.matchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${concept.matchPercentage}%` }} />
                                </div>
                              </div>
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
                        <Sparkles className="h-5 w-5 text-amber-500" /> Bullet Point Upgrades
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

                  {/* Recommended Learning Path */}
                  {atsResult.learningPath && atsResult.learningPath.length > 0 && (
                    <div className="mt-6 border-t border-zinc-200 pt-6">
                      <h2 className="text-[14pt] font-semibold mb-4 text-emerald-800 flex items-center gap-2">
                        <Map className="h-5 w-5 text-emerald-600" /> Recommended Learning Path
                      </h2>
                      <ol className="list-decimal pl-5 space-y-2 text-[10pt] text-zinc-800">
                        {atsResult.learningPath.map((step: string, i: number) => (
                          <li key={i} className="pl-1">
                            <span className="font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Predicted Impact */}
                  {atsResult.predictedImpact && (
                    <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                      <h2 className="text-[14pt] font-semibold mb-3 flex items-center gap-2 text-blue-900">
                        <Rocket className="h-5 w-5 text-blue-600" /> Preview New Score
                      </h2>
                      <div className="mb-4">
                        <p className="text-[10pt] font-semibold text-blue-800 mb-2">If you apply these suggested improvements:</p>
                        <ul className="list-disc pl-5 space-y-1 text-[10pt] text-blue-900">
                          {atsResult.predictedImpact.actions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-blue-100 flex flex-col justify-center items-center">
                          <p className="text-[9pt] font-bold uppercase text-blue-600 mb-1">Predicted Overall Match</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[12pt] font-medium text-zinc-400 line-through">{atsResult.scores?.overallMatch ?? 0}%</span>
                            <span className="text-[14pt] font-black text-green-600">→ {atsResult.predictedImpact.predictedOverallMatch}</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100 flex flex-col justify-center items-center">
                          <p className="text-[9pt] font-bold uppercase text-blue-600 mb-1">Interview Probability</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[12pt] font-medium text-zinc-400 line-through">{atsResult.scores?.interviewProbability ?? 0}%</span>
                            <span className="text-[14pt] font-black text-green-600">→ {atsResult.predictedImpact.predictedInterviewProbability}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Line */}
                  {atsResult.bottomLine && (
                    <div className="mt-6 p-5 bg-zinc-100 rounded-xl">
                      <h3 className="text-[11pt] font-bold uppercase text-zinc-800 mb-2">Bottom Line</h3>
                      <p className="text-[10pt] text-zinc-800 leading-relaxed font-medium">
                        {atsResult.bottomLine}
                      </p>
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
