"use client";

import { useState } from "react";
import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { generateCoverLetter } from "@/app/actions/resume-ai";

interface CoverLetterBuilderProps {
  onGenerate: (body: string, targetRole: string, companyName: string) => void;
}

export function CoverLetterBuilder({ onGenerate }: CoverLetterBuilderProps) {
  const { data } = useResume();
  const [targetRole, setTargetRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!targetRole.trim() || !companyName.trim()) return;
    setLoading(true);
    try {
      // Build candidate background from resume data
      const bg: string[] = [];
      if (data.personalInfo.summary) bg.push(`Summary: ${data.personalInfo.summary}`);
      data.experience.forEach((exp) => {
        bg.push(`Experience at ${exp.company} as ${exp.role}: ${exp.bullets.replace(/\n/g, " | ")}`);
      });
      data.education.forEach((edu) => {
        bg.push(`Education: ${edu.degree} in ${edu.field} from ${edu.school}`);
      });
      data.skills.forEach((sk) => {
        bg.push(`Skills - ${sk.category}: ${sk.skills}`);
      });
      data.projects.forEach((proj) => {
        bg.push(`Project: ${proj.name} - ${proj.bullets.replace(/\n/g, " | ")}`);
      });

      const body = await generateCoverLetter(targetRole, companyName, bg.join("\n"));
      onGenerate(body, targetRole, companyName);
    } catch (err) {
      console.error("Cover letter generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        Cover Letter Generator
      </div>

      <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Target Role</label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Senior Product Manager"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Company Name</label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Stripe"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !targetRole.trim() || !companyName.trim()}
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