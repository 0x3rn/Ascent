"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { ResumeProvider } from "@/lib/resume-context";
import { ResumePreview } from "@/components/preview/resume-preview";
import { CoverLetterPreview } from "@/components/preview/cover-letter-preview";
import { CoverLetterBuilder } from "@/components/builder/cover-letter-builder";
import { PersonalInfoSection } from "@/components/builder/personal-info-section";
import { ExperienceSection } from "@/components/builder/experience-section";
import { ProjectsSection } from "@/components/builder/projects-section";
import { EducationSection } from "@/components/builder/education-section";
import { SkillsSection } from "@/components/builder/skills-section";
import { Button } from "@/components/ui/button";
import { shortenCoverLetter } from "@/app/actions/resume-ai";
import {
  FileText,
  Download,
  ExternalLink,
  User,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Wrench,
  Eye,
  Mail,
  Copy,
  Check,
  Trash2,
  Scissors,
  Loader2,
} from "lucide-react";

type BuilderMode = "resume" | "cover-letter";
type CoverView = "edit" | "preview";
type TabId =
  | "personal"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "preview";

const DESKTOP_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-4 w-4" /> },
  { id: "experience", label: "Experience", icon: <Briefcase className="h-4 w-4" /> },
  { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "skills", label: "Skills", icon: <Wrench className="h-4 w-4" /> },
];

const MOBILE_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  ...DESKTOP_TABS,
  { id: "preview", label: "Preview", icon: <Eye className="h-4 w-4" /> },
];

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function ResumeBuilderInner() {
  const [builderMode, setBuilderMode] = useState<BuilderMode>("resume");
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [coverView, setCoverView] = useState<CoverView>("edit");
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [coverBody, setCoverBody] = useState("");
  const [coverTargetRole, setCoverTargetRole] = useState("");
  const [coverCompanyName, setCoverCompanyName] = useState("");
  const [coverUserName, setCoverUserName] = useState("");
  const [coverSkills, setCoverSkills] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [coverPreviewScale, setCoverPreviewScale] = useState(1);

  const printContentRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const coverPreviewWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: builderMode === "cover-letter" ? "cover-letter" : "resume",
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .no-print, .no-print * { display: none !important; }
      }
    `,
  });

  const handleCopy = async () => {
    if (!coverBody) return;
    try {
      await navigator.clipboard.writeText(coverBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDelete = () => {
    setCoverBody("");
    setCoverTargetRole("");
    setCoverCompanyName("");
    setCoverUserName("");
    setCoverSkills([]);
  };

  const handleShorten = async () => {
    if (!coverBody) return;
    setShortening(true);
    try {
      const shortened = await shortenCoverLetter(coverBody);
      setCoverBody(shortened);
    } catch (err) {
      console.error("Shorten failed:", err);
    } finally {
      setShortening(false);
    }
  };

  const handleCoverGenerate = (
    body: string,
    targetRole: string,
    companyName: string,
    userName: string,
    skills: string[]
  ) => {
    setCoverBody(body);
    setCoverTargetRole(targetRole);
    setCoverCompanyName(companyName);
    setCoverUserName(userName);
    setCoverSkills(skills);
    if (isMobile) setCoverView("preview");
  };

  const tabs = isMobile ? MOBILE_TABS : DESKTOP_TABS;
  const isPreviewTab = activeTab === "preview";
  const isResume = builderMode === "resume";
  const isCoverViewEdit = coverView === "edit";

  const updatePreviewScale = useCallback(() => {
    if (previewWrapperRef.current) {
      const wrapperWidth = previewWrapperRef.current.parentElement?.clientWidth ?? 350;
      setPreviewScale(Math.min(wrapperWidth / A4_WIDTH_PX, 1));
    }
  }, []);

  const updateCoverPreviewScale = useCallback(() => {
    if (coverPreviewWrapperRef.current) {
      const wrapperWidth = coverPreviewWrapperRef.current.parentElement?.clientWidth ?? 350;
      setCoverPreviewScale(Math.min(wrapperWidth / A4_WIDTH_PX, 1));
    }
  }, []);

  useEffect(() => {
    if (isPreviewTab && isMobile) {
      updatePreviewScale();
      const t = setTimeout(updatePreviewScale, 100);
      window.addEventListener("resize", updatePreviewScale);
      return () => { clearTimeout(t); window.removeEventListener("resize", updatePreviewScale); };
    }
  }, [isPreviewTab, isMobile, updatePreviewScale]);

  useEffect(() => {
    if (!isResume && coverView === "preview" && isMobile) {
      updateCoverPreviewScale();
      const t = setTimeout(updateCoverPreviewScale, 100);
      window.addEventListener("resize", updateCoverPreviewScale);
      return () => { clearTimeout(t); window.removeEventListener("resize", updateCoverPreviewScale); };
    }
  }, [isResume, coverView, isMobile, updateCoverPreviewScale]);

  if (!hasMounted) return null;

  const coverPreviewEl = (
    <CoverLetterPreview
      body={coverBody}
      targetRole={coverTargetRole}
      companyName={coverCompanyName}
      userName={coverUserName}
    />
  );

  return (
    <>
      <div
        ref={printContentRef}
        className="resume-print-container"
        style={{ visibility: "hidden", height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        {isResume ? <ResumePreview /> : coverPreviewEl}
      </div>

      <div className="flex flex-col md:flex-row h-dvh md:h-screen overflow-hidden">
        <aside className="print:hidden w-full md:w-[440px] md:min-w-[440px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full">
          {/* HEADER */}
          <header className="shrink-0 px-4 md:px-5 py-3 md:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-2.5">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Ascent</h1>
                <p className="text-[10px] md:text-[11px] text-zinc-500 leading-tight">AI Career Toolkit</p>
              </div>
            </div>
            <Button onClick={() => handlePrint()} size="sm" className="gap-1 md:gap-1.5 shrink-0 text-xs h-7 md:h-8 px-2.5 md:px-3">
              <Download className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </header>

          {/* MODE SWITCHER */}
          <nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50">
            <button onClick={() => { setBuilderMode("resume"); setActiveTab("personal"); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${isResume ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}>
              <FileText className="h-3.5 w-3.5" /> Resume
            </button>
            <button onClick={() => { setBuilderMode("cover-letter"); setCoverView("edit"); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${!isResume ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}>
              <Mail className="h-3.5 w-3.5" /> Cover Letter
            </button>
          </nav>

          {/* RESUME SECTION TABS */}
          {isResume && (
            <nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-0 flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 md:py-2.5 text-[11px] md:text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}>
                  {tab.icon}
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          )}

          {/* COVER LETTER VIEW TOGGLE (mobile only) */}
          {!isResume && isMobile && (
            <nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50">
              <button onClick={() => setCoverView("edit")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 ${isCoverViewEdit ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}>
                <FileText className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => setCoverView("preview")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 ${!isCoverViewEdit ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}>
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
            </nav>
          )}

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {isResume ? (
              <>
                {activeTab === "personal" && <PersonalInfoSection />}
                {activeTab === "experience" && <ExperienceSection />}
                {activeTab === "projects" && <ProjectsSection />}
                {activeTab === "education" && <EducationSection />}
                {activeTab === "skills" && <SkillsSection />}
                {isPreviewTab && isMobile && (
                  <div className="flex justify-center pt-2">
                    <div className="w-full shadow-lg bg-white">
                      <div ref={previewWrapperRef} className="overflow-hidden w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * previewScale) }}>
                        <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>
                          <ResumePreview />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : isCoverViewEdit || !isMobile ? (
              <CoverLetterBuilder onGenerate={handleCoverGenerate} />
            ) : (
              <div className="space-y-3">
                {/* MOBILE ACTION TOOLBAR */}
                <div className="flex items-center gap-1.5 flex-wrap print:hidden">
                  <Button onClick={handleCopy} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button onClick={handleShorten} disabled={!coverBody || shortening} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">
                    {shortening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}
                    {shortening ? "..." : "Shorten"}
                  </Button>
                  <Button onClick={handleDelete} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
                {/* Scaled preview */}
                <div className="flex justify-center">
                  <div className="w-full shadow-lg bg-white">
                    <div ref={coverPreviewWrapperRef} className="overflow-hidden w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * coverPreviewScale) }}>
                      <div style={{ transform: `scale(${coverPreviewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>
                        {coverPreviewEl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <footer className="shrink-0 px-4 md:px-5 py-2.5 md:py-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3">
            <p className="text-[10px] md:text-[11px] text-zinc-400">Powered by DeepSeek AI</p>
            <a href="https://github.com/0x3rn/Ascent" target="_blank" rel="noopener noreferrer" className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </a>
          </footer>
        </aside>

        {/* RIGHT PANE (desktop) */}
        <main className="hidden md:flex flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto items-start justify-center p-6 shrink-0">
          <div className="flex flex-col items-center gap-4">
            {isResume ? (
              <div className="origin-top shadow-2xl">
                <ResumePreview />
              </div>
            ) : (
              <>
                {/* DESKTOP ACTION TOOLBAR */}
                <div className="flex items-center gap-2 self-start print:hidden flex-wrap">
                  <Button onClick={handleCopy} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied!" : "Copy Text"}
                  </Button>
                  <Button onClick={handleDelete} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  <Button onClick={handleShorten} disabled={!coverBody || shortening} size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                    {shortening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}
                    {shortening ? "Shortening..." : "Shorten"}
                  </Button>
                </div>
                <div className="origin-top shadow-2xl">
                  {coverPreviewEl}
                </div>
              </>
            )}
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