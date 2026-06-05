"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { ResumeProvider, useResume } from "@/lib/resume-context";
import { ResumePreview } from "@/components/preview/resume-preview";
import { CoverLetterPreview } from "@/components/preview/cover-letter-preview";
import { CoverLetterBuilder } from "@/components/builder/cover-letter-builder";
import { InterviewPreview } from "@/components/preview/interview-preview";
import { PersonalInfoSection } from "@/components/builder/personal-info-section";
import { ExperienceSection } from "@/components/builder/experience-section";
import { ProjectsSection } from "@/components/builder/projects-section";
import { EducationSection } from "@/components/builder/education-section";
import { SkillsSection } from "@/components/builder/skills-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  shortenCoverLetter, generateCoverLetter,
  parseRawResume, scoreATS, generateInterviewPrep,
} from "@/app/actions/resume-ai";
import {
  FileText, Download, ExternalLink, User, Briefcase, FolderKanban,
  GraduationCap, Wrench, Eye, Mail, Copy, Check, Trash2, Scissors,
  Loader2, RotateCw, Sparkles, MessageSquare, Wand2, Target, X,
} from "lucide-react";

type BuilderMode = "resume" | "cover-letter" | "interview";
type CoverView = "edit" | "preview";
type TabId = "personal" | "experience" | "projects" | "education" | "skills" | "preview";

const DESKTOP_TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
];
const MOBILE_TABS: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  ...DESKTOP_TABS,
  { id: "preview", label: "Preview", icon: <Eye className="h-4 w-4" /> },
];

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const FONTS = [
  { value: "inter", label: "Inter (Modern)" },
  { value: "lora", label: "Lora (Classic)" },
  { value: "geist", label: "Geist Mono (Tech)" },
];
const COLORS = [
  { value: "slate", label: "Slate" },
  { value: "navy", label: "Navy" },
  { value: "forest", label: "Forest" },
];

function ResumeBuilderInner() {
  const { data } = useResume();
  const dispatchers = useResume();

  const [themeFont, setThemeFont] = useState("inter");
  const [themeAccent, setThemeAccent] = useState("slate");
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
  const [coverUseResumeData, setCoverUseResumeData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [intContent, setIntContent] = useState("");
  const [intRole, setIntRole] = useState("");
  const [intCompany, setIntCompany] = useState("");
  const [intGenerating, setIntGenerating] = useState(false);
  const [intCopied, setIntCopied] = useState(false);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteRaw, setPasteRaw] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);

  const [atsJD, setAtsJD] = useState("");
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<{ score: number; missingKeywords: string[]; quickTip: string } | null>(null);

  const [coverPreviewScale, setCoverPreviewScale] = useState(1);
  const [intPreviewScale, setIntPreviewScale] = useState(1);

  const printContentRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const coverPreviewWrapperRef = useRef<HTMLDivElement>(null);
  const intPreviewWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHasMounted(true); const check = () => setIsMobile(window.innerWidth < 768); check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check); }, []);

  const handlePrint = useReactToPrint({ contentRef: printContentRef, documentTitle: builderMode === "cover-letter" ? "cover-letter" : builderMode === "interview" ? "interview-prep" : "resume", pageStyle: `@page { size: A4; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print, .no-print * { display: none !important; } }` });

  const handleCopy = async () => { if (!coverBody) return; try { await navigator.clipboard.writeText(coverBody); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  const handleDelete = () => { setCoverBody(""); setCoverTargetRole(""); setCoverCompanyName(""); setCoverUserName(""); setCoverSkills([]); };
  const handleShorten = async () => { if (!coverBody) return; setShortening(true); try { const s = await shortenCoverLetter(coverBody); setCoverBody(s); } catch {} finally { setShortening(false); } };
  const handleCoverGenerate = (body: string, tRole: string, cName: string, uName: string, sk: string[], ud: boolean = false) => { setCoverBody(body); setCoverTargetRole(tRole); setCoverCompanyName(cName); setCoverUserName(uName); setCoverSkills(sk); setCoverUseResumeData(ud); if (isMobile) setCoverView("preview"); };
  const handleRegenerate = async () => { if (!coverTargetRole || !coverCompanyName || !coverUserName) return; setRegenerating(true); try { const b = await generateCoverLetter(coverUserName, coverTargetRole, coverCompanyName, coverSkills, ""); setCoverBody(b); } catch {} finally { setRegenerating(false); } };
  const handlePaste = async () => { if (!pasteRaw.trim()) return; setPasteLoading(true); try { const j = await parseRawResume(pasteRaw); const p = JSON.parse(j); if (p.personalInfo) dispatchers.updatePersonalInfo(p.personalInfo); setPasteOpen(false); setPasteRaw(""); } catch { alert("Failed to parse."); } finally { setPasteLoading(false); } };
  const handleATSScan = async () => { if (!atsJD.trim()) return; setAtsLoading(true); setAtsResult(null); try { const bg = `Summary: ${data.personalInfo.summary}\nExperience: ${data.experience.map(e => `${e.role} at ${e.company}: ${e.bullets}`).join("\n")}\nSkills: ${data.skills.map(s => `${s.category}: ${s.skills}`).join("\n")}`; setAtsResult(JSON.parse(await scoreATS(bg, atsJD))); } catch { setAtsResult(null); } finally { setAtsLoading(false); } };
  const handleIntGenerate = async () => { if (!intRole.trim() || !intCompany.trim()) return; setIntGenerating(true); try { const bg = `Summary: ${data.personalInfo.summary}\nExperience: ${data.experience.map(e => `${e.role} at ${e.company}: ${e.bullets}`).join("\n")}\nSkills: ${data.skills.map(s => `${s.category}: ${s.skills}`).join("\n")}`; setIntContent(await generateInterviewPrep(intRole, intCompany, bg)); } catch {} finally { setIntGenerating(false); } };
  const handleIntCopy = async () => { if (!intContent) return; try { await navigator.clipboard.writeText(intContent); setIntCopied(true); setTimeout(() => setIntCopied(false), 2000); } catch {} };
  const handleIntClear = () => { setIntContent(""); setIntRole(""); setIntCompany(""); };

  const upScale = useCallback(() => { const w = previewWrapperRef.current?.parentElement?.clientWidth ?? 350; setPreviewScale(Math.min(w / A4_WIDTH_PX, 1)); }, []);
  const upCover = useCallback(() => { const w = coverPreviewWrapperRef.current?.parentElement?.clientWidth ?? 350; setCoverPreviewScale(Math.min(w / A4_WIDTH_PX, 1)); }, []);
  const upInt = useCallback(() => { const w = intPreviewWrapperRef.current?.parentElement?.clientWidth ?? 350; setIntPreviewScale(Math.min(w / A4_WIDTH_PX, 1)); }, []);

  const tabs = isMobile ? MOBILE_TABS : DESKTOP_TABS;
  const isRes = builderMode === "resume";
  const isCov = builderMode === "cover-letter";
  const isInt = builderMode === "interview";
  const isPrev = activeTab === "preview";
  const isEdit = coverView === "edit";

  useEffect(() => { if (isPrev && isMobile) { upScale(); const t = setTimeout(upScale, 100); window.addEventListener("resize", upScale); return () => { clearTimeout(t); window.removeEventListener("resize", upScale); }; } }, [isPrev, isMobile, upScale]);
  useEffect(() => { if (isCov && coverView === "preview" && isMobile) { upCover(); const t = setTimeout(upCover, 100); window.addEventListener("resize", upCover); return () => { clearTimeout(t); window.removeEventListener("resize", upCover); }; } }, [isCov, coverView, isMobile, upCover]);
  useEffect(() => { if (isInt && coverView === "preview" && isMobile) { upInt(); const t = setTimeout(upInt, 100); window.addEventListener("resize", upInt); return () => { clearTimeout(t); window.removeEventListener("resize", upInt); }; } }, [isInt, coverView, isMobile, upInt]);

  if (!hasMounted) return null;

  const resumeEl = <ResumePreview themeFont={themeFont} themeAccent={themeAccent} />;
  const coverEl = <CoverLetterPreview body={coverBody} targetRole={coverTargetRole} companyName={coverCompanyName} userName={coverUserName} themeFont={themeFont} themeAccent={themeAccent} />;
  const intEl = <InterviewPreview content={intContent} targetRole={intRole} companyName={intCompany} themeFont={themeFont} themeAccent={themeAccent} />;
  const ap = isRes ? resumeEl : isCov ? coverEl : intEl;

  return (
    <>
      <div ref={printContentRef} className="resume-print-container" style={{ visibility: "hidden", height: 0, overflow: "hidden" }} aria-hidden="true">{ap}</div>
      {pasteOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden"><div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 space-y-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold flex items-center gap-2"><Wand2 className="h-4 w-4 text-indigo-500" /> Magic Import</h2><button onClick={() => setPasteOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button></div><Textarea value={pasteRaw} onChange={(e) => setPasteRaw(e.target.value)} placeholder="Paste raw LinkedIn text, old resume, or bio..." className="min-h-[160px] text-sm" /><Button onClick={handlePaste} disabled={pasteLoading || !pasteRaw.trim()} className="w-full gap-1.5" variant="magic" size="sm">{pasteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}{pasteLoading ? "Parsing..." : "Populate Resume"}</Button></div></div>)}

      <div className="flex flex-col md:flex-row h-dvh md:h-screen overflow-hidden">
        <aside className="print:hidden w-full md:w-[440px] md:min-w-[440px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full">
          <header className="shrink-0 px-4 md:px-5 py-3 md:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-3"><div className="flex items-center gap-2 md:gap-2.5"><div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0"><FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" /></div><div><h1 className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Ascent</h1><p className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">AI Career Toolkit</p></div></div><Button onClick={() => handlePrint()} size="sm" className="gap-1 md:gap-1.5 shrink-0 text-xs h-7 md:h-8 px-2.5 md:px-3"><Download className="h-3 w-3 md:h-3.5 md:w-3.5" /><span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span></Button></header>
          <nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50">
            <button onClick={() => { setBuilderMode("resume"); setActiveTab("personal"); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 ${isRes ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}><FileText className="h-3.5 w-3.5" /> Resume</button>
            <button onClick={() => { setBuilderMode("cover-letter"); setCoverView("edit"); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 ${isCov ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}><Mail className="h-3.5 w-3.5" /> Cover Letter</button>
            <button onClick={() => { setBuilderMode("interview"); setCoverView("edit"); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 ${isInt ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}><MessageSquare className="h-3.5 w-3.5" /> Interview Prep</button>
          </nav>
          {isRes && (<nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50 overflow-x-auto no-scrollbar">{tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-2 md:px-3 py-2 md:py-2.5 text-[11px] md:text-xs font-medium border-b-2 whitespace-nowrap ${activeTab === t.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}>{"icon" in t && t.icon ? <>{t.icon} </> : null}<span>{t.label}</span></button>))}</nav>)}
          {(isCov || isInt) && isMobile && (<nav className="shrink-0 flex border-b border-zinc-100 dark:border-zinc-800/50"><button onClick={() => setCoverView("edit")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 ${isEdit ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}><FileText className="h-3.5 w-3.5" />Edit</button><button onClick={() => setCoverView("preview")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 ${!isEdit ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:text-indigo-400 dark:bg-indigo-950/30" : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"}`}><Eye className="h-3.5 w-3.5" />Preview</button></nav>)}

          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {isRes ? (<><div className="mb-3"><Button onClick={() => setPasteOpen(true)} variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8"><Wand2 className="h-3.5 w-3.5 text-indigo-500" />Magic Import</Button></div>{activeTab === "personal" && <PersonalInfoSection />}{activeTab === "experience" && <ExperienceSection />}{activeTab === "projects" && <ProjectsSection />}{activeTab === "education" && <EducationSection />}{activeTab === "skills" && <SkillsSection />}{isPrev && isMobile && (<div className="flex justify-center pt-2"><div className="w-full shadow-lg bg-white"><div ref={previewWrapperRef} className="overflow-hidden w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * previewScale) }}><div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>{resumeEl}</div></div></div></div>)}<div className="mt-4 p-3 rounded-xl border border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/20 space-y-3"><div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-400"><Target className="h-4 w-4" />ATS Matcher</div><Textarea value={atsJD} onChange={e => setAtsJD(e.target.value)} placeholder="Paste a job description..." className="min-h-[80px] text-xs" /><Button onClick={handleATSScan} disabled={atsLoading || !atsJD.trim()} variant="magic" size="sm" className="w-full gap-1.5">{atsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}{atsLoading ? "Scanning..." : "Scan Resume"}</Button>{atsResult && (<div className="space-y-2 pt-1"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${atsResult.score >= 70 ? "bg-green-500" : atsResult.score >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${atsResult.score}%` }} /></div><span className="text-xs font-semibold">{atsResult.score}/100</span></div>{atsResult.missingKeywords.length > 0 && (<div className="flex flex-wrap gap-1">{atsResult.missingKeywords.map((k, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">{k}</span>)}</div>)}{atsResult.quickTip && <p className="text-[11px] text-purple-700 dark:text-purple-400">{atsResult.quickTip}</p>}</div>)}</div></>) : isCov ? (isEdit || !isMobile ? <CoverLetterBuilder onGenerate={handleCoverGenerate} /> : (<div className="space-y-3"><div className="flex items-center gap-1.5 flex-wrap print:hidden"><Button onClick={handleCopy} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{copied ? "Copied!" : "Copy"}</Button><Button onClick={handleShorten} disabled={!coverBody || shortening} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{shortening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}{shortening ? "..." : "Shorten"}</Button><Button onClick={handleRegenerate} disabled={!coverBody || regenerating} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}Re-gen</Button><Button onClick={handleDelete} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7 text-red-600"><Trash2 className="h-3 w-3" />Delete</Button></div><div className="flex justify-center"><div className="w-full shadow-lg bg-white"><div ref={coverPreviewWrapperRef} className="overflow-hidden w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * coverPreviewScale) }}><div style={{ transform: `scale(${coverPreviewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>{coverEl}</div></div></div></div></div>)) : (isEdit || !isMobile ? (<div className="space-y-4"><div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Interview Prep Generator</div><div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3"><div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Target Role <span className="text-red-400">*</span></label><Input value={intRole} onChange={e => setIntRole(e.target.value)} placeholder="Senior Product Manager" /></div><div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Company <span className="text-red-400">*</span></label><Input value={intCompany} onChange={e => setIntCompany(e.target.value)} placeholder="Stripe" /></div><Button onClick={handleIntGenerate} disabled={intGenerating || !intRole.trim() || !intCompany.trim()} className="w-full gap-1.5" variant="magic" size="sm">{intGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{intGenerating ? "Generating..." : "Generate Prep Guide"}</Button></div></div>) : (<div className="space-y-3"><div className="flex items-center gap-1.5 flex-wrap print:hidden"><Button onClick={handleIntCopy} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{intCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{intCopied ? "Copied!" : "Copy"}</Button><Button onClick={handleIntClear} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7 text-red-600"><Trash2 className="h-3 w-3" />Clear</Button></div><div className="flex justify-center"><div className="w-full shadow-lg bg-white"><div ref={intPreviewWrapperRef} className="overflow-hidden w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * intPreviewScale) }}><div style={{ transform: `scale(${intPreviewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>{intEl}</div></div></div></div></div>))}
          </div>
          <footer className="shrink-0 px-4 md:px-5 py-2.5 md:py-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3"><p className="text-[10px] md:text-[11px] text-zinc-400 dark:text-zinc-500">Powered by DeepSeek AI</p><a href="https://github.com/0x3rn/Ascent" target="_blank" rel="noopener noreferrer" className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" /></a></footer>
        </aside>
        <main className="hidden md:flex flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto items-start justify-center p-6 shrink-0">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 self-start print:hidden rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 shadow-sm bg-white dark:bg-zinc-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Font:</span>
                <select value={themeFont} onChange={e => setThemeFont(e.target.value)} className="text-[10px] border-0 bg-transparent text-zinc-900 dark:text-white focus:ring-0 cursor-pointer outline-none" style={{ colorScheme: "light" }}>
                  {FONTS.map(f => <option key={f.value} value={f.value} style={{ color: "#000", backgroundColor: "#fff" }}>{f.label}</option>)}
                </select>
              </div>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-600" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Color:</span>
                <select value={themeAccent} onChange={e => setThemeAccent(e.target.value)} className="text-[10px] border-0 bg-transparent text-zinc-900 dark:text-white focus:ring-0 cursor-pointer outline-none" style={{ colorScheme: "light" }}>
                  {COLORS.map(c => <option key={c.value} value={c.value} style={{ color: "#000", backgroundColor: "#fff" }}>{c.label}</option>)}
                </select>
              </div>
            </div>
            {isRes ? <div className="origin-top shadow-2xl">{resumeEl}</div> : isCov ? (<><div className="flex items-center gap-2 self-start print:hidden flex-wrap"><Button onClick={handleCopy} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-xs h-7">{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{copied ? "Copied!" : "Copy Text"}</Button><Button onClick={handleShorten} disabled={!coverBody || shortening} size="sm" variant="outline" className="gap-1.5 text-xs h-7">{shortening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}{shortening ? "Shortening..." : "Shorten"}</Button><Button onClick={handleRegenerate} disabled={!coverBody || regenerating} size="sm" variant="outline" className="gap-1.5 text-xs h-7">{regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}{regenerating ? "Regenerating..." : "Regenerate"}</Button><Button onClick={handleDelete} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-red-600"><Trash2 className="h-3 w-3" />Delete</Button></div><div className="origin-top shadow-2xl">{coverEl}</div></>) : (<><div className="flex items-center gap-2 self-start print:hidden flex-wrap"><Button onClick={handleIntCopy} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-xs h-7">{intCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{intCopied ? "Copied!" : "Copy"}</Button><Button onClick={handleIntClear} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-red-600"><Trash2 className="h-3 w-3" />Clear</Button></div><div className="origin-top shadow-2xl">{intEl}</div></>)}
          </div>
        </main>
      </div>
    </>
  );
}

export default function Home() { return (<ResumeProvider><ResumeBuilderInner /></ResumeProvider>); }