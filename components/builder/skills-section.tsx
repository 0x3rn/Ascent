"use client";

import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export function SkillsSection() {
  const { data, updateSkillCategory, addSkillCategory, removeSkillCategory } = useResume();
  const { skills } = data;

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Skills</div>
      {skills.map((sk) => (
        <div key={sk.id} className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Category {skills.indexOf(sk) + 1}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => removeSkillCategory(sk.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Category Name</label><Input value={sk.category} onChange={(e) => updateSkillCategory(sk.id, { category: e.target.value })} placeholder="Product & Strategy" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Skills<span className="ml-1 text-zinc-400 font-normal">(comma-separated)</span></label><Input value={sk.skills} onChange={(e) => updateSkillCategory(sk.id, { skills: e.target.value })} placeholder="Roadmapping, OKRs, User Research, A/B Testing" /></div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSkillCategory} className="w-full border-dashed gap-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"><Plus className="h-3.5 w-3.5" />Add Skill Category</Button>
    </div>
  );
}
