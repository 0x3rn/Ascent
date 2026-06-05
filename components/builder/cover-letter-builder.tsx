"use client";

import { useState } from "react";
import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X, Plus } from "lucide-react";
import { generateCoverLetter } from "@/app/actions/resume-ai";

interface CoverLetterBuilderProps {
  onGenerate: (
    body: string,
    targetRole: string,
    companyName: string,
    userName: string,
    skills: string[]
  ) => void;
}

export function CoverLetterBuilder({ onGenerate }: CoverLetterBuilderProps) {
  const { data } = useResume();
  const [userName, setUserName] = useState(data.personalInfo.fullName || "");
  const [targetRole, setTargetRole] = useState(data.personalInfo.title || "");
  const [companyName, setCompanyName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
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

  const handleGenerate = async () => {
    if (!targetRole.trim() || !companyName.trim() || !userName.trim()) return;
    setLoading(true);
    try {
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

      const body = await generateCoverLetter(userName, targetRole, companyName, skills, bg);
      onGenerate(body, targetRole, companyName, userName, skills);
    } catch (err) {
      console.error("Cover letter generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = targetRole.trim() && companyName.trim() && userName.trim();

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Cover Letter Generator
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Your Full Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Alexandra Sterling"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Target Role <span className="text-red-400">*</span>
          </label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Senior Product Manager"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Company Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Stripe"
          />
        </div>

        {/* Skills */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Relevant Skills <span className="text-zinc-400 font-normal">(optional, max 5)</span>
          </label>
          <div className="flex gap-1.5">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              placeholder="e.g. Python, React, Leadership"
              disabled={skills.length >= 5}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSkill}
              disabled={!skillInput.trim() || skills.length >= 5}
              className="shrink-0 h-9 w-9 p-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800"
                >
                  {skill}
                  <button onClick={() => handleRemoveSkill(i)} className="hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useResumeData}
            onChange={(e) => setUseResumeData(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-zinc-600">Tailor using my Resume data</span>
        </label>

        <Button
          onClick={handleGenerate}
          disabled={loading || !canGenerate}
          className="w-full gap-1.5"
          variant="magic"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {loading ? "Generating..." : "Generate Cover Letter"}
        </Button>
      </div>
    </div>
  );
}