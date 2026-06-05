"use client";

import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AiMagicButton } from "@/components/builder/ai-magic-button";
import { enhanceSummary } from "@/app/actions/resume-ai";

export function PersonalInfoSection() {
  const { data, updatePersonalInfo } = useResume();
  const { personalInfo } = data;

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Personal Information
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Full Name</label>
          <Input value={personalInfo.fullName} onChange={(e) => updatePersonalInfo({ fullName: e.target.value })} placeholder="Alexandra Sterling" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Title</label>
          <Input value={personalInfo.title} onChange={(e) => updatePersonalInfo({ title: e.target.value })} placeholder="Senior Product Manager" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Email</label>
          <Input value={personalInfo.email} onChange={(e) => updatePersonalInfo({ email: e.target.value })} placeholder="alex@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Phone</label>
          <Input value={personalInfo.phone} onChange={(e) => updatePersonalInfo({ phone: e.target.value })} placeholder="+1 (415) 555-0147" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Location</label>
          <Input value={personalInfo.location} onChange={(e) => updatePersonalInfo({ location: e.target.value })} placeholder="San Francisco, CA" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">LinkedIn</label>
          <Input value={personalInfo.linkedin} onChange={(e) => updatePersonalInfo({ linkedin: e.target.value })} placeholder="linkedin.com/in/..." />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-zinc-500">Website</label>
          <Input value={personalInfo.website} onChange={(e) => updatePersonalInfo({ website: e.target.value })} placeholder="yourwebsite.co" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500">Professional Summary</label>
          <AiMagicButton onClick={() => enhanceSummary(personalInfo.summary)} onResult={(text) => updatePersonalInfo({ summary: text })} label="Enhance" />
        </div>
        <Textarea value={personalInfo.summary} onChange={(e) => updatePersonalInfo({ summary: e.target.value })} placeholder="A brief, compelling summary of your professional identity..." className="min-h-[100px] text-sm leading-relaxed" />
      </div>
    </div>
  );
}