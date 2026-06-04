"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { ResumeProvider } from "@/lib/resume-context";
import { ResumePreview } from "@/components/preview/resume-preview";
import { PersonalInfoSection } from "@/components/builder/personal-info-section";
import { ExperienceSection } from "@/components/builder/experience-section";
import { EducationSection } from "@/components/builder/education-section";
import { SkillsSection } from "@/components/builder/skills-section";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  ExternalLink,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
} from "lucide-react";
import { useState } from "react";

type TabId = "personal" | "experience" | "education" | "skills";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-4 w-4" /> },
  {
    id: "experience",
    label: "Experience",
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: "education",
    label: "Education",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  { id: "skills", label: "Skills", icon: <Wrench className="h-4 w-4" /> },
];

function ResumeBuilderInner() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: "resume",
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print, .no-print * {
          display: none !important;
        }
      }
    `,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ---- Left Pane: Builder ---- */}
      <aside className="no-print w-[440px] min-w-[440px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full">
        {/* Builder Header */}
        <header className="shrink-0 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Ascent
              </h1>
              <p className="text-[11px] text-zinc-500">AI Resume Builder</p>
            </div>
          </div>
          <Button
            onClick={() => handlePrint()}
            size="sm"
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </header>

        {/* Tab Navigation */}
        <nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Builder Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "personal" && <PersonalInfoSection />}
          {activeTab === "experience" && <ExperienceSection />}
          {activeTab === "education" && <EducationSection />}
          {activeTab === "skills" && <SkillsSection />}
        </div>

        {/* Builder Footer */}
        <footer className="shrink-0 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3">
          <p className="text-[11px] text-zinc-400">Powered by DeepSeek AI</p>
          <a
            href="https://github.com/0x3rn/Ascent"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </footer>
      </aside>

      {/* ---- Right Pane: Live Preview ---- */}
      <main className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto flex items-start justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          {/* Paper-like preview container */}
          <div
            ref={previewRef}
            className="origin-top shadow-2xl print:shadow-none"
          >
            <ResumePreview />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ResumeProvider>
      <ResumeBuilderInner />
    </ResumeProvider>
  );
}