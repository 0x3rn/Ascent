"use client";

import { useState } from "react";
import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X, Plus } from "lucide-react";
import { generateCoverLetter, generateFreelanceProposal } from "@/app/actions/resume-ai";
import { useTurnstile } from "@/components/turnstile-provider";

interface CoverLetterBuilderProps {
  onGenerate: (
    body: string,
    targetRole: string,
    companyName: string,
    userName: string,
    skills: string[],
    useResumeData: boolean,
    type?: "standard" | "freelance",
    freelanceData?: { gigTitle: string, jd: string, approach: string, similarProject: string, portfolio: string, turnaround: string }
  ) => void;
}

export function CoverLetterBuilder({ onGenerate }: CoverLetterBuilderProps) {
  const { data } = useResume();
  const { turnstileToken, handleUnauthorized, setSessionVerified } = useTurnstile();
  
  const [tab, setTab] = useState<"standard" | "freelance">("standard");

  // Standard Form State
  const [userName, setUserName] = useState(data.personalInfo.fullName || "");
  const [targetRole, setTargetRole] = useState(data.personalInfo.title || "");
  const [companyName, setCompanyName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  
  // Freelance Form State
  const [gigTitle, setGigTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [proposedApproach, setProposedApproach] = useState("");
  const [similarProject, setSimilarProject] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [turnaroundTime, setTurnaroundTime] = useState("");

  const [useResumeData, setUseResumeData] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.length >= 5) return;
    if (skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const buildBg = () => {
    let bg = "";
    if (useResumeData) {
      const parts: string[] = [];
      if (data.personalInfo.summary) parts.push(`Summary: ${data.personalInfo.summary}`);
      data.experience.forEach((exp) => {
        parts.push(`Experience at ${exp.company} as ${exp.role}: ${exp.bullets.replace(/\n/g, " | ")}`);
      });
      data.education.forEach((edu) => {
        parts.push(`Education: ${edu.degree} in ${edu.field} from ${edu.school}`);
      });
      data.skills.forEach((sk) => {
        parts.push(`Skills - ${sk.category}: ${sk.skills}`);
      });
      data.projects.forEach((proj) => {
        parts.push(`Project: ${proj.name} - ${proj.bullets.replace(/\n/g, " | ")}`);
      });
      bg = parts.join("\n");
    }
    return bg;
  };

  const handleGenerateStandard = async () => {
    if (!targetRole.trim() || !companyName.trim() || !userName.trim()) return;
    setLoading(true);
    try {
      const bg = buildBg();
      const body = await generateCoverLetter(userName, targetRole, companyName, skills, bg, turnstileToken || undefined);
      onGenerate(body, targetRole, companyName, userName, skills, useResumeData, "standard");
      setSessionVerified();
    } catch (err: any) {
      console.error("Cover letter generation failed:", err);
      handleUnauthorized(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFreelance = async () => {
    if (!gigTitle.trim() || !jobDescription.trim() || !userName.trim()) return;
    setLoading(true);
    try {
      const bg = buildBg();
      const body = await generateFreelanceProposal(
        userName, 
        gigTitle, 
        jobDescription, 
        proposedApproach, 
        similarProject,
        portfolioLink, 
        turnaroundTime, 
        bg, 
        turnstileToken || undefined
      );
      onGenerate(body, gigTitle, "Freelance Client", userName, [], useResumeData, "freelance", {
        gigTitle, jd: jobDescription, approach: proposedApproach, similarProject, portfolio: portfolioLink, turnaround: turnaroundTime
      });
      setSessionVerified();
    } catch (err: any) {
      console.error("Freelance proposal generation failed:", err);
      handleUnauthorized(err);
    } finally {
      setLoading(false);
    }
  };

  const canGenerateStandard = targetRole.trim() && companyName.trim() && userName.trim();
  const canGenerateFreelance = gigTitle.trim() && jobDescription.trim() && userName.trim();

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Cover Letter Generator
      </div>

      <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl w-full mb-4">
        <button onClick={() => setTab("standard")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all ${tab === "standard" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}>Standard Job</button>
        <button onClick={() => setTab("freelance")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all ${tab === "freelance" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}>Freelance Gig</button>
      </div>

      {tab === "standard" && (
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Your Full Name <span className="text-red-400">*</span></label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Alexandra Sterling" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Target Role <span className="text-red-400">*</span></label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Senior Product Manager" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Company Name <span className="text-red-400">*</span></label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Stripe" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Relevant Skills <span className="text-zinc-400 font-normal">(optional, max 5)</span></label>
              <div className="flex gap-1.5">
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())} placeholder="e.g. Python, React, Leadership" disabled={skills.length >= 5} />
                <Button variant="outline" size="sm" onClick={handleAddSkill} disabled={!skillInput.trim() || skills.length >= 5} className="shrink-0 h-9 w-9 p-0"><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary/80 dark:border-primary/30">
                      {skill}
                      <button onClick={() => handleRemoveSkill(i)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
              <input type="checkbox" checked={useResumeData} onChange={(e) => setUseResumeData(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary focus:ring-primary" />
              <span className="text-xs text-zinc-600">Tailor using my Resume data</span>
            </label>

            <Button onClick={handleGenerateStandard} disabled={loading || !canGenerateStandard} className="w-full gap-1.5 mt-2" variant="magic" size="sm">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Generating..." : "Generate Cover Letter"}
            </Button>
          </div>
        )}

      {tab === "freelance" && (
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Your Full Name <span className="text-red-400">*</span></label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Alexandra Sterling" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Project/Gig Title <span className="text-red-400">*</span></label>
              <Input value={gigTitle} onChange={(e) => setGigTitle(e.target.value)} placeholder="e.g., Full Stack Next.js Developer Needed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Client's Job Description <span className="text-red-400">*</span></label>
              <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the exact gig description here..." className="min-h-[100px] text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">My Proposed Approach / Hook <span className="text-zinc-400 font-normal">(optional)</span></label>
              <Textarea value={proposedApproach} onChange={(e) => setProposedApproach(e.target.value)} placeholder="Briefly describe how you plan to solve their problem..." className="min-h-[60px] text-xs" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-col gap-0.5">
                <label className="text-xs font-medium text-zinc-500">Similar Past Project <span className="text-zinc-400 font-normal">(optional)</span></label>
                <span className="text-[10px] text-zinc-400">Referencing a similar past project builds instant trust with clients.</span>
              </div>
              <Textarea value={similarProject} onChange={(e) => setSimilarProject(e.target.value)} placeholder="e.g., I built almost the exact same dashboard for a real estate client last month using Next.js and Supabase..." className="min-h-[60px] text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Relevant Portfolio Link <span className="text-zinc-400 font-normal">(optional)</span></label>
              <Input value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} placeholder="e.g., https://github.com/..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Turnaround Time <span className="text-zinc-400 font-normal">(optional)</span></label>
              <Input value={turnaroundTime} onChange={(e) => setTurnaroundTime(e.target.value)} placeholder="e.g., Ready to deliver in 3 days" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
              <input type="checkbox" checked={useResumeData} onChange={(e) => setUseResumeData(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary focus:ring-primary" />
              <span className="text-xs text-zinc-600">Tailor using my Resume data</span>
            </label>

            <Button onClick={handleGenerateFreelance} disabled={loading || !canGenerateFreelance} className="w-full gap-1.5 mt-2" variant="magic" size="sm">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Generating..." : "Generate Proposal"}
            </Button>
          </div>
        )}
    </div>
  );
}
