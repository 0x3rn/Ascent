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
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";

type TabId = "personal" | "experience" | "education" | "skills" | "preview";

const DESKTOP_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
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

const MOBILE_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  ...DESKTOP_TABS,
  { id: "preview", label: "Preview", icon: <Eye className="h-4 w-4" /> },
];

function ResumeBuilderInner() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const desktopPreviewRef = useRef<HTMLDivElement>(null);
  const mobilePrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Desktop: print from visible right-pane preview (same as before)
  const desktopHandlePrint = useReactToPrint({
    contentRef: desktopPreviewRef,
    documentTitle: "resume",
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print, .no-print * {
          display: none !important;
        }
      }
    `,
  });

  // Mobile: print from off-screen clone
  const mobileHandlePrint = useReactToPrint({
    contentRef: mobilePrintRef,
    documentTitle: "resume",
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body > *:not(#print-root) {
          display: none !important;
        }
        #print-root {
          display: block !important;
          position: static !important;
          visibility: visible !important;
          width: auto !important;
        }
      }
    `,
  });

  const handlePrint = () => {
    if (isMobile) {
      mobileHandlePrint();
    } else {
      desktopHandlePrint();
    }
  };

  const tabs = isMobile ? MOBILE_TABS : DESKTOP_TABS;
  const isPreviewTab = activeTab === "preview";

  if (!hasMounted) {
    return null;
  }

  const tabContent = (
    <>
      {activeTab === "personal" && <PersonalInfoSection />}
      {activeTab === "experience" && <ExperienceSection />}
      {activeTab === "education" && <EducationSection />}
      {activeTab === "skills" && <SkillsSection />}
      {isPreviewTab && isMobile && (
        <div className="flex justify-center pt-2">
          <div className="w-full max-w-[210mm] shadow-lg bg-white">
            <div className="w-full" style={{ aspectRatio: "210/297" }}>
              <div
                className="origin-top-left"
                style={{
                  transform: "scale(var(--mobile-preview-scale, 1))",
                  width: "210mm",
                }}
                ref={(el) => {
                  if (el) {
                    const parentW = el.parentElement?.offsetWidth ?? 210;
                    const scale = parentW / 210;
                    el.style.setProperty("--mobile-preview-scale", String(scale));
                  }
                }}
              >
                <ResumePreview />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Off-screen print clone — positioned so react-to-print can capture it */}
      <div
        id="print-root"
        ref={mobilePrintRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "210mm",
          visibility: "hidden",
        }}
        aria-hidden="true"
      >
        <ResumePreview />
      </div>

      <div className="flex flex-col md:flex-row h-dvh md:h-screen overflow-hidden">
        {/* ---- Left Pane: Builder ---- */}
        <aside className="no-print w-full md:w-[440px] md:min-w-[440px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full">
          <header className="shrink-0 px-4 md:px-5 py-3 md:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-2.5">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  Ascent
                </h1>
                <p className="text-[10px] md:text-[11px] text-zinc-500 leading-tight">
                  AI Resume Builder
                </p>
              </div>
            </div>
            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-1 md:gap-1.5 shrink-0 text-xs h-7 md:h-8 px-2.5 md:px-3"
            >
              <Download className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </header>

          <nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 md:py-2.5 text-[11px] md:text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
                }`}
              >
                {tab.icon}
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {tabContent}
          </div>

          <footer className="shrink-0 px-4 md:px-5 py-2.5 md:py-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3">
            <p className="text-[10px] md:text-[11px] text-zinc-400">
              Powered by DeepSeek AI
            </p>
            <a
              href="https://github.com/0x3rn/Ascent"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </a>
          </footer>
        </aside>

        {/* ---- Right Pane: Live Preview (desktop only) ---- */}
        <main className="hidden md:flex flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto items-start justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div
              ref={desktopPreviewRef}
              className="origin-top shadow-2xl print:shadow-none"
            >
              <ResumePreview />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <ResumeProvider>
      <ResumeBuilderInner />
    </ResumeProvider>
  );
}