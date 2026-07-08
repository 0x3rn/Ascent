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
import { AtsPreview } from "@/components/preview/ats-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  parseRawResume, generateCoverLetter, generateInterviewPrep, scoreATS, shortenCoverLetter,
  initMockInterview, chatMockInterview, generateMockInterviewReport
} from "@/app/actions/resume-ai";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTurnstile } from "@/components/turnstile-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  FileText, Download, ExternalLink, User, Briefcase, FolderKanban,
  GraduationCap, Wrench, Eye, Mail, Copy, Check, Trash2, Scissors,
  Loader2, RotateCw, Sparkles, MessageSquare, Wand2, Target, X, CheckCircle, XCircle, Upload,
  Send, History, Play, StopCircle, ArrowRight, TrendingUp, Star, CircleDollarSign,
  Map, Rocket, Activity, ArrowUpRight, CheckSquare
} from "lucide-react";

type BuilderMode = "resume" | "cover-letter" | "interview";
type CoverView = "edit" | "preview";
type TabId = "personal" | "experience" | "projects" | "education" | "skills" | "preview" | "ats";

const DESKTOP_TABS: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-3.5 w-3.5" /> },
  { id: "experience", label: "Experience", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { id: "projects", label: "Projects", icon: <FolderKanban className="h-3.5 w-3.5" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { id: "skills", label: "Skills", icon: <Wrench className="h-3.5 w-3.5" /> },
  { id: "ats", label: "ATS Matcher", icon: <Target className="h-3.5 w-3.5" /> },
];

const MOBILE_TABS: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-3.5 w-3.5" /> },
  { id: "experience", label: "Experience", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { id: "projects", label: "Projects", icon: <FolderKanban className="h-3.5 w-3.5" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { id: "skills", label: "Skills", icon: <Wrench className="h-3.5 w-3.5" /> },
  { id: "ats", label: "ATS Matcher", icon: <Target className="h-3.5 w-3.5" /> },
  { id: "preview", label: "Preview", icon: <Eye className="h-3.5 w-3.5" /> },
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
  { value: "black", label: "Black" },
];

type ATSResult = any;

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
  const [coverUseResume, setCoverUseResume] = useState(false);
  const [coverType, setCoverType] = useState<"standard" | "freelance">("standard");
  const [freelanceGigTitle, setFreelanceGigTitle] = useState("");
  const [freelanceJD, setFreelanceJD] = useState("");
  const [freelanceApproach, setFreelanceApproach] = useState("");
  const [freelanceSimilarProject, setFreelanceSimilarProject] = useState("");
  const [freelancePortfolio, setFreelancePortfolio] = useState("");
  const [freelanceTurnaround, setFreelanceTurnaround] = useState("");

  const [copied, setCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [intContent, setIntContent] = useState("");
  const [intRole, setIntRole] = useState("");
  const [intCompany, setIntCompany] = useState("");
  const [intGenerating, setIntGenerating] = useState(false);
  const [intCopied, setIntCopied] = useState(false);

  const [intMode, setIntMode] = useState<"prep" | "mock" | "dashboard">("prep");
  const [mockMessages, setMockMessages] = useState<{ role: "user" | "ai", content: string, feedback?: string }[]>([]);
  const [mockStatus, setMockStatus] = useState<"setup" | "running" | "completed">("setup");
  const [mockInput, setMockInput] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [mockReport, setMockReport] = useState<any>(null);
  const [dashboardHistory, setDashboardHistory] = useState<any[]>([]);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteRaw, setPasteRaw] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [atsRole, setAtsRole] = useState("");
  const [atsCompany, setAtsCompany] = useState("");
  const [atsJD, setAtsJD] = useState("");
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);

  const [coverPreviewScale, setCoverPreviewScale] = useState(1);
  const [intPreviewScale, setIntPreviewScale] = useState(1);

  const printContentRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const coverPreviewWrapperRef = useRef<HTMLDivElement>(null);
  const intPreviewWrapperRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { turnstileToken, handleUnauthorized, setSessionVerified } = useTurnstile();

  useEffect(() => { 
    setTimeout(() => setHasMounted(true), 0); 
    const check = () => setIsMobile(window.innerWidth < 768); 
    check(); 
    window.addEventListener("resize", check); 
    
    try {
      const stored = localStorage.getItem("ascent_interview_history");
      if (stored) setDashboardHistory(JSON.parse(stored));
      
      const storedAts = localStorage.getItem("ascent_ats_result");
      if (storedAts) setAtsResult(JSON.parse(storedAts));
      
      const storedAtsRole = localStorage.getItem("ascent_ats_role");
      if (storedAtsRole) setAtsRole(storedAtsRole);
      
      const storedAtsCompany = localStorage.getItem("ascent_ats_company");
      if (storedAtsCompany) setAtsCompany(storedAtsCompany);
      
      const storedAtsJD = localStorage.getItem("ascent_ats_jd");
      if (storedAtsJD) setAtsJD(storedAtsJD);
    } catch {}

    return () => window.removeEventListener("resize", check); 
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [mockMessages, mockLoading]);

  const firstName = (data.personalInfo.fullName || "My").trim().split(/\s+/)[0] || "My";
  const pdfTitle = `${firstName} Resume`;

  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    document.title = pdfTitle;
    window.print();
    document.title = originalTitle;
  }, [pdfTitle]);

  const renderThemeSelector = () => (
    <div className="flex items-center gap-3 self-start print:hidden rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 shadow-sm bg-white dark:bg-zinc-800 mb-4 w-full md:w-auto md:mb-0 justify-between md:justify-start">
      <div className="flex items-center gap-2 flex-1 md:flex-none">
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">Font</span>
        <select value={themeFont} onChange={e => setThemeFont(e.target.value)} className="w-full md:w-auto text-[11px] font-medium border-0 bg-zinc-100 dark:bg-zinc-700/50 rounded-md py-1 px-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none transition-shadow" style={{ colorScheme: "light" }}>{FONTS.map(f => <option key={f.value} value={f.value} style={{ color: "#000", backgroundColor: "#fff" }}>{f.label}</option>)}</select>
      </div>
      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 hidden md:block" />
      <div className="flex items-center gap-2 flex-1 md:flex-none">
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">Color</span>
        <select value={themeAccent} onChange={e => setThemeAccent(e.target.value)} className="w-full md:w-auto text-[11px] font-medium border-0 bg-zinc-100 dark:bg-zinc-700/50 rounded-md py-1 px-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none transition-shadow" style={{ colorScheme: "light" }}>{COLORS.map(c => <option key={c.value} value={c.value} style={{ color: "#000", backgroundColor: "#fff" }}>{c.label}</option>)}</select>
      </div>
    </div>
  );

  const handleCopy = async () => { if (!coverBody) return; try { await navigator.clipboard.writeText(coverBody); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { } };
  const handleDelete = () => { setCoverBody(""); setCoverTargetRole(""); setCoverCompanyName(""); setCoverUserName(""); setCoverSkills([]); };
  const handleShorten = async () => { if (!coverBody) return; setShortening(true); try { setCoverBody(await shortenCoverLetter(coverBody, turnstileToken || undefined)); setSessionVerified(); } catch(e:any) { handleUnauthorized(e); } finally { setShortening(false); } };
  const handleCoverLetterGenerate = (
    body: string, 
    targetRole: string, 
    companyName: string, 
    userName: string, 
    skills: string[], 
    useResumeData: boolean,
    type: "standard" | "freelance" = "standard",
    freelanceData?: { gigTitle: string, jd: string, approach: string, similarProject: string, portfolio: string, turnaround: string }
  ) => {
    setCoverBody(body);
    setCoverTargetRole(targetRole);
    setCoverCompanyName(companyName);
    setCoverUserName(userName);
    setCoverSkills(skills);
    setCoverUseResume(useResumeData);
    setCoverType(type);
    if (freelanceData) {
      setFreelanceGigTitle(freelanceData.gigTitle);
      setFreelanceJD(freelanceData.jd);
      setFreelanceApproach(freelanceData.approach);
      setFreelanceSimilarProject(freelanceData.similarProject);
      setFreelancePortfolio(freelanceData.portfolio);
      setFreelanceTurnaround(freelanceData.turnaround);
    }
    if (isMobile) setCoverView("preview");
  };
  const handleRegenerate = async () => { if (!coverTargetRole || !coverCompanyName || !coverUserName) return; setRegenerating(true); try {
      let bg = "";
      if (coverUseResume) {
        const parts: string[] = [];
        if (data.personalInfo.summary) parts.push(`Summary: ${data.personalInfo.summary}`);
        data.experience.forEach((exp) => { parts.push(`Experience at ${exp.company} as ${exp.role}: ${exp.bullets.replace(/\n/g, " | ")}`); });
        data.education.forEach((edu) => { parts.push(`Education: ${edu.degree} in ${edu.field} from ${edu.school}`); });
        data.skills.forEach((sk) => { parts.push(`Skills - ${sk.category}: ${sk.skills}`); });
        data.projects.forEach((proj) => { parts.push(`Project: ${proj.name} - ${proj.bullets.replace(/\n/g, " | ")}`); });
        bg = parts.join("\n");
      }
      let newBody = "";
      if (coverType === "freelance") {
        const { generateFreelanceProposal } = await import("@/app/actions/resume-ai");
        newBody = await generateFreelanceProposal(
          coverUserName,
          freelanceGigTitle,
          freelanceJD,
          freelanceApproach,
          freelanceSimilarProject,
          freelancePortfolio,
          freelanceTurnaround,
          bg,
          turnstileToken || undefined
        );
      } else {
        const { generateCoverLetter } = await import("@/app/actions/resume-ai");
        newBody = await generateCoverLetter(coverUserName, coverTargetRole, coverCompanyName, coverSkills, bg, turnstileToken || undefined);
      }
      setCoverBody(newBody);
      setSessionVerified();
    } catch(e:any) { handleUnauthorized(e); } finally { setRegenerating(false); } };
  const handlePaste = async () => {
    if (!pasteRaw.trim()) return;
    setPasteLoading(true);
    try {
      const j = await parseRawResume(pasteRaw, turnstileToken || undefined);
      const p = JSON.parse(j);
      const newData = { ...data };
      
      if (p.personalInfo) {
        const currentPI = newData.personalInfo;
        const newPI = p.personalInfo;
        newData.personalInfo = {
          ...currentPI,
          fullName: newPI.fullName || currentPI.fullName,
          title: newPI.title || currentPI.title,
          email: newPI.email || currentPI.email,
          phone: newPI.phone || currentPI.phone,
          location: newPI.location || currentPI.location,
          linkedin: newPI.linkedin || currentPI.linkedin,
          website: newPI.website || currentPI.website,
          summary: newPI.summary || currentPI.summary,
        };
      }
      
      if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) {
        newData.experience = p.experience.map((exp: Record<string, unknown>) => ({ ...exp, id: crypto.randomUUID() }));
      }
      if (p.education && Array.isArray(p.education) && p.education.length > 0) {
        newData.education = p.education.map((edu: Record<string, unknown>) => ({ ...edu, id: crypto.randomUUID() }));
      }
      if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) {
        newData.skills = p.skills.map((sk: Record<string, unknown>) => ({ ...sk, id: crypto.randomUUID() }));
      }
      if (p.projects && Array.isArray(p.projects) && p.projects.length > 0) {
        newData.projects = p.projects.map((proj: Record<string, unknown>) => ({ ...proj, id: crypto.randomUUID() }));
      }
      
      dispatchers.loadResume(newData);
      setSessionVerified();
      setPasteOpen(false);
      setPasteRaw("");
      if (isMobile) setActiveTab("preview");
    } catch (e: any) {
      handleUnauthorized(e);
    } finally {
      setPasteLoading(false);
    }
  };

  const handleATSScan = async () => { 
    if (!atsJD.trim()) return; 
    setAtsLoading(true); 
    setAtsResult(null); 
    try { 
      const bg = JSON.stringify({ Summary: data.personalInfo.summary, Experience: data.experience.map(e => ({ role: e.role, company: e.company, description: e.bullets })), Projects: data.projects.map(p => ({ name: p.name, skills: p.skills, description: p.bullets })), Skills: data.skills.map(s => ({ category: s.category, skills: s.skills })) }); 
      const fullJD = `Role: ${atsRole}\nCompany: ${atsCompany}\n\nDescription:\n${atsJD}`; 
      const result = JSON.parse(await scoreATS(bg, fullJD, turnstileToken || undefined));
      setAtsResult(result); 
      setSessionVerified(); 
      
      localStorage.setItem("ascent_ats_result", JSON.stringify(result));
      localStorage.setItem("ascent_ats_role", atsRole);
      localStorage.setItem("ascent_ats_company", atsCompany);
      localStorage.setItem("ascent_ats_jd", atsJD);
    } catch(e:any) { 
      handleUnauthorized(e); 
      setAtsResult(null); 
    } finally { 
      setAtsLoading(false); 
    } 
  };
  
  const handleClearATS = () => {
    setAtsResult(null);
    setAtsRole("");
    setAtsCompany("");
    setAtsJD("");
    localStorage.removeItem("ascent_ats_result");
    localStorage.removeItem("ascent_ats_role");
    localStorage.removeItem("ascent_ats_company");
    localStorage.removeItem("ascent_ats_jd");
  };

  const handleStartMock = async () => {
    if (!intRole.trim() || !intCompany.trim()) return;
    setMockStatus("running");
    setMockLoading(true);
    setMockMessages([]);
    setMockReport(null);
    try {
      const bg = JSON.stringify({ Summary: data.personalInfo.summary, Experience: data.experience, Projects: data.projects, Skills: data.skills });
      const res = await initMockInterview(bg, intRole, intCompany, turnstileToken || undefined);
      if (res?.success) {
        setMockMessages([
          { role: "ai", content: res.overviewMarkdown },
          { role: "ai", content: res.firstQuestion }
        ]);
        setSessionVerified();
      } else {
        alert("Failed to start mock interview.");
        setMockStatus("setup");
      }
    } catch (e: any) {
      handleUnauthorized(e);
      setMockStatus("setup");
    } finally {
      setMockLoading(false);
    }
  };

  const handleSendMock = async () => {
    if (!mockInput.trim() || mockLoading) return;
    const answer = mockInput.trim();
    setMockInput("");
    const newMsgs = [...mockMessages, { role: "user" as const, content: answer }];
    setMockMessages(newMsgs);
    setMockLoading(true);
    
    try {
      const bg = JSON.stringify({ Summary: data.personalInfo.summary, Experience: data.experience, Projects: data.projects, Skills: data.skills });
      const res = await chatMockInterview(newMsgs, answer, bg, intRole, intCompany, turnstileToken || undefined);
      if (res?.success) {
        const updatedMsgs = [...newMsgs];
        updatedMsgs[updatedMsgs.length - 1].feedback = res.feedbackMarkdown;
        setSessionVerified();
        
        if (res.isInterviewComplete) {
          setMockMessages(updatedMsgs);
          handleFinishMock(updatedMsgs);
        } else {
          updatedMsgs.push({ role: "ai", content: res.nextQuestion });
          setMockMessages(updatedMsgs);
        }
      }
    } catch (e: any) {
      handleUnauthorized(e);
    } finally {
      setMockLoading(false);
    }
  };

  const handleFinishMock = async (currentMsgs: any[]) => {
    setMockLoading(true);
    try {
      const bg = JSON.stringify({ Summary: data.personalInfo.summary, Experience: data.experience, Projects: data.projects, Skills: data.skills });
      const res = await generateMockInterviewReport(currentMsgs, bg, intRole, intCompany, turnstileToken || undefined);
      if (res?.success) {
        setMockReport(res);
        setMockStatus("completed");
        
        const newRecord = {
          date: new Date().toISOString(),
          role: intRole,
          company: intCompany,
          score: res.overallScore,
          report: res
        };
        const updatedHistory = [newRecord, ...dashboardHistory];
        setDashboardHistory(updatedHistory);
        localStorage.setItem("ascent_interview_history", JSON.stringify(updatedHistory));
        setSessionVerified();
      }
    } catch (e: any) {
      handleUnauthorized(e);
    } finally {
      setMockLoading(false);
    }
  };

  const handleClearMock = () => {
    setMockStatus("setup");
    setMockMessages([]);
    setMockReport(null);
    setMockInput("");
  };

  const renderMockInterview = () => {
    if (mockStatus === "setup") {
      return (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Live Mock Interview Setup</div>
          <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Target Role <span className="text-red-400">*</span></label><Input value={intRole} onChange={e => setIntRole(e.target.value)} placeholder="Senior Product Manager" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Company <span className="text-red-400">*</span></label><Input value={intCompany} onChange={e => setIntCompany(e.target.value)} placeholder="Stripe" /></div>
            <Button onClick={handleStartMock} disabled={mockLoading || !intRole.trim() || !intCompany.trim()} className="w-full gap-1.5" variant="magic" size="sm">{mockLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}{mockLoading ? "Initializing..." : "Start Mock Interview"}</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${mockStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} /> {mockStatus === "running" ? "Mock Interview in Progress" : "Interview Complete"}
          </div>
          <div className="flex gap-2">
            {mockStatus === "running" && (
              <Button onClick={() => handleFinishMock(mockMessages)} disabled={mockLoading} variant="outline" size="sm" className="h-7 text-[10px] text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"><StopCircle className="h-3 w-3 mr-1" /> End Early</Button>
            )}
            {mockStatus === "completed" && (
              <Button onClick={handleClearMock} variant="outline" size="sm" className="h-7 text-[10px]"><RotateCw className="h-3 w-3 mr-1" /> Start New Mock</Button>
            )}
          </div>
        </div>
        
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2 pb-4 scroll-smooth">
          {mockMessages.map((msg, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <div className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-bl-sm"}`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-snug prose-p:my-1" dangerouslySetInnerHTML={{ __html: require("marked").parse(msg.content) }} />
                </div>
              </div>
              
              {msg.feedback && (
                <div className="w-full flex justify-center my-2">
                  <Card className="w-[90%] border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm">
                    <div className="p-3 text-xs prose prose-sm dark:prose-invert max-w-none prose-headings:text-sm prose-headings:font-bold prose-headings:mb-1 prose-p:leading-snug prose-p:my-1 text-blue-900 dark:text-blue-100" dangerouslySetInnerHTML={{ __html: require("marked").parse(msg.feedback) }} />
                  </Card>
                </div>
              )}
            </div>
          ))}
          {mockLoading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm shadow-sm">
                <div className="flex space-x-1.5 items-center h-5">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          {mockStatus === "completed" && mockReport && (
            <div className="w-full flex justify-center mt-6 mb-4">
              <Card className="w-full border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10 shadow-sm overflow-hidden">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 border-b border-green-200 dark:border-green-900/50 flex items-center justify-between">
                  <h3 className="font-bold text-green-800 dark:text-green-300">Interview Completed</h3>
                  <div className="font-black text-xl text-green-700 dark:text-green-400">{mockReport.overallScore}%</div>
                </div>
                <div className="p-4 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Category Scores</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {mockReport.categoryScores?.map((cs: any, i: number) => (
                        <div key={i} className="flex flex-col justify-between bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 break-words line-clamp-2">{cs.category}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 mt-1">{cs.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Study Plan</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs" dangerouslySetInnerHTML={{ __html: require("marked").parse(mockReport.studyPlanMarkdown || "") }} />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {mockStatus === "running" && (
          <div className="shrink-0 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Textarea 
                value={mockInput} 
                onChange={e => setMockInput(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMock();
                  }
                }}
                placeholder="Type your answer... (Press Enter to send)" 
                className="pr-12 resize-none h-[80px] text-sm"
                disabled={mockLoading}
              />
              <Button onClick={handleSendMock} disabled={!mockInput.trim() || mockLoading} size="icon" className="absolute right-2 bottom-2 h-8 w-8 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-md">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMockDashboard = () => {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mock Interview History</div>
        {dashboardHistory.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <History className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 font-medium">No past interviews found.</p>
            <p className="text-xs text-zinc-400 mt-1">Complete a Live Mock Interview to track your progress here.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pb-4">
            {dashboardHistory.map((record, i) => (
              <Accordion key={i} className="bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                <AccordionItem value={`item-${i}`} className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 text-left">{record.role} <span className="text-zinc-400 font-normal">@ {record.company}</span></div>
                        <div className="text-xs text-zinc-500">{new Date(record.date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={record.score >= 80 ? "bg-green-100 text-green-700" : record.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                          {record.score}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {record.report?.categoryScores?.map((cs: any, j: number) => (
                          <div key={j} className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 break-words line-clamp-2">{cs.category}</div>
                            <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{cs.score}%</div>
                          </div>
                        ))}
                      </div>
                      {record.report?.weakestAreas && record.report.weakestAreas.length > 0 && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                           <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-xs mb-2 uppercase tracking-wider">Top Weaknesses to Improve</h4>
                           <ul className="list-disc pl-4 space-y-1">
                             {record.report.weakestAreas.map((w: string, j: number) => (
                               <li key={j} className="text-xs text-blue-800 dark:text-blue-200">{w}</li>
                             ))}
                           </ul>
                        </div>
                      )}
                      {record.report?.idealAnswersMarkdown && (
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs mb-2">Ideal Answers</h4>
                          <div className="prose prose-sm dark:prose-invert max-w-none text-xs bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800" dangerouslySetInnerHTML={{ __html: require("marked").parse(record.report.idealAnswersMarkdown) }} />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const handleIntGenerate = async () => {
    if (!intRole.trim() || !intCompany.trim()) return;
    setIntGenerating(true);
    try {
      const bg = JSON.stringify({ Summary: data.personalInfo.summary, Experience: data.experience, Projects: data.projects, Skills: data.skills });
      setIntContent(await generateInterviewPrep(intRole, intCompany, bg, turnstileToken || undefined));
      setSessionVerified();
    } catch (e: any) { 
      handleUnauthorized(e);
    } finally {
      setIntGenerating(false);
    }
  };
  const handleIntCopy = async () => { if (!intContent) return; try { await navigator.clipboard.writeText(intContent); setIntCopied(true); setTimeout(() => setIntCopied(false), 2000); } catch { } };
  const handleIntClear = () => { setIntContent(""); setIntRole(""); setIntCompany(""); };

  const upScale = useCallback(() => { const w = previewWrapperRef.current?.parentElement?.clientWidth ?? 350; setPreviewScale(Math.min(w / A4_WIDTH_PX, 1)); }, []);
  const upCover = useCallback(() => { const w = coverPreviewWrapperRef.current?.parentElement?.clientWidth ?? 350; setCoverPreviewScale(Math.min(w / A4_WIDTH_PX, 1)); }, []);
  const upInt = useCallback(() => { const w = intPreviewWrapperRef.current?.parentElement?.clientWidth ?? 350; setIntPreviewScale(Math.min(w / A4_WIDTH_PX, 1)); }, []);

  const tabs = isMobile ? MOBILE_TABS : DESKTOP_TABS;
  const isRes = builderMode === "resume";
  const isCov = builderMode === "cover-letter";
  const isInt = builderMode === "interview";
  const isPrev = activeTab === "preview";
  const isAts = activeTab === "ats";
  const isEdit = coverView === "edit";

  useEffect(() => { if (isPrev && isMobile) { upScale(); const t = setTimeout(upScale, 100); window.addEventListener("resize", upScale); return () => { clearTimeout(t); window.removeEventListener("resize", upScale); }; } }, [isPrev, isMobile, upScale]);
  useEffect(() => { if (isCov && coverView === "preview" && isMobile) { upCover(); const t = setTimeout(upCover, 100); window.addEventListener("resize", upCover); return () => { clearTimeout(t); window.removeEventListener("resize", upCover); }; } }, [isCov, coverView, isMobile, upCover]);
  useEffect(() => { if (isInt && coverView === "preview" && isMobile) { upInt(); const t = setTimeout(upInt, 100); window.addEventListener("resize", upInt); return () => { clearTimeout(t); window.removeEventListener("resize", upInt); }; } }, [isInt, coverView, isMobile, upInt]);

  useEffect(() => {
    if (isRes) {
      const el = document.getElementById(`subtab-${activeTab}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeTab, isRes]);

  if (!hasMounted) return null;

  const resumeEl = <ResumePreview themeFont={themeFont} themeAccent={themeAccent} />;
  const atsEl = <AtsPreview atsResult={atsResult} atsRole={atsRole} atsCompany={atsCompany} themeFont={themeFont} themeAccent={themeAccent} />;
  const coverEl = <CoverLetterPreview body={coverBody} targetRole={coverTargetRole} companyName={coverCompanyName} userName={coverUserName} themeFont={themeFont} themeAccent={themeAccent} type={coverType} />;
  const intEl = <InterviewPreview content={intContent} mockReport={intMode === "mock" && mockStatus === "completed" ? mockReport : undefined} mockMessages={intMode === "mock" && mockStatus === "completed" ? mockMessages : undefined} targetRole={intRole} companyName={intCompany} themeFont={themeFont} themeAccent={themeAccent} />;
  const ap = isRes ? (isAts ? atsEl : resumeEl) : isCov ? coverEl : intEl;

  function renderLeftPane() {
    if (isRes && isAts) {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
              <Target className="h-4 w-4" />Semantic Recruiter Engine
            </div>
            {atsResult && (
              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-3 w-3 mr-1.5" /> Clear Results
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to clear ATS results?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the current ATS evaluation.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearATS} className="bg-red-600 text-white hover:bg-red-700">Clear Results</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="p-4 rounded-xl border border-blue-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm space-y-4">
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Target Role</label><Input value={atsRole} onChange={e => setAtsRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="h-9 text-sm" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Company (Optional)</label><Input value={atsCompany} onChange={e => setAtsCompany(e.target.value)} placeholder="e.g. Acme Corp" className="h-9 text-sm" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Job Description <span className="text-red-400">*</span></label><Textarea value={atsJD} onChange={e => setAtsJD(e.target.value)} placeholder="Paste a target job description..." className="min-h-[100px] text-sm" /></div>
            <Button onClick={handleATSScan} disabled={atsLoading || !atsJD.trim()} variant="magic" className="w-full gap-2 shadow-sm font-semibold h-9">
              {atsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {atsLoading ? "Running Semantic Evaluation..." : "Generate CareerFit Report"}
            </Button>
          </div>

          {atsLoading && (
            <div className="space-y-4 animate-pulse pt-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}

          {atsResult && !atsLoading && (
            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Executive Summary */}
              {atsResult.executiveSummary && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900/50 p-4 rounded-xl shadow-sm text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  <h2 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4" /> Executive Summary</h2>
                  {atsResult.executiveSummary}
                </div>
              )}

              {/* Score Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: "Overall Match", val: atsResult.scores?.overallMatch ?? 0 },
                  { label: "Resume Quality", val: atsResult.scores?.resumeQuality ?? 0 },
                  { label: "ATS Compatibility", val: atsResult.scores?.atsCompatibility ?? 0 },
                  { label: "Exp. Relevance", val: atsResult.scores?.experienceRelevance ?? 0 },
                  { label: "Technical Match", val: atsResult.scores?.technicalMatch ?? 0 },
                  { label: "Domain Match", val: atsResult.scores?.domainMatch ?? 0 },
                  { label: "Recruiter Appeal", val: atsResult.scores?.recruiterAppeal ?? 0 },
                  { label: "Interview Prob.", val: atsResult.scores?.interviewProbability ?? 0 }
                ].map((s, i) => {
                  const valNum = Number(s.val) || 0;
                  return (
                  <Card key={i} className="flex flex-col items-center justify-center p-3 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="relative flex items-center justify-center mb-1.5">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle className="text-zinc-200 dark:text-zinc-800" strokeWidth="5" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
                        <circle className={`${valNum >= 75 ? 'text-green-500' : valNum >= 50 ? 'text-amber-500' : 'text-red-500'}`} strokeWidth="5" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * valNum) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                      </svg>
                      <span className="absolute text-[11px] font-extrabold text-zinc-900 dark:text-zinc-50">{valNum}</span>
                    </div>
                    <span className="text-[9px] font-semibold text-center text-zinc-500 uppercase tracking-wider">{s.label}</span>
                  </Card>
                )})}
              </div>

              {/* Top 3 Next Steps (At a Glance) */}
              {atsResult.top3NextSteps && atsResult.top3NextSteps.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-900/50 p-4 rounded-xl shadow-sm">
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-3 text-sm">
                    <TrendingUp className="h-4 w-4" /> At a Glance: Top 3 Next Steps
                  </h3>
                  <div className="space-y-2">
                    {atsResult.top3NextSteps.map((step: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-amber-900 dark:text-amber-100">
                        <span className="flex items-center justify-center bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 rounded-full w-4 h-4 text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume Quality Breakdown */}
              {atsResult.resumeQualityBreakdown && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 mb-2"><CheckSquare className="h-4 w-4 text-sky-500" /> Resume Quality Breakdown</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      { label: "Formatting", val: atsResult.resumeQualityBreakdown.formatting },
                      { label: "Content", val: atsResult.resumeQualityBreakdown.contentQuality },
                      { label: "Achievements", val: atsResult.resumeQualityBreakdown.achievements },
                      { label: "Action Verbs", val: atsResult.resumeQualityBreakdown.actionVerbs },
                      { label: "Readability", val: atsResult.resumeQualityBreakdown.readability },
                      { label: "Organization", val: atsResult.resumeQualityBreakdown.organization }
                    ].map((q, i) => (
                      <div key={i} className="flex flex-col items-center justify-center p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-100 dark:border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold mb-1 leading-tight">{q.label}</span>
                        <span className={`text-sm font-bold ${q.val >= 85 ? 'text-green-600' : q.val >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{q.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {atsResult.topStrengths && atsResult.topStrengths.length > 0 ? (
                  <Card className="border-green-100 bg-green-50/30 dark:border-green-900/50 dark:bg-green-900/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400"><CheckCircle className="h-4 w-4" /> Top Strengths</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <ul className="space-y-1.5">
                        {atsResult.topStrengths.map((area: string, i: number) => (
                          <li key={i} className="text-xs text-green-800 dark:text-green-300 leading-snug flex items-start gap-1.5">
                             <span className="text-green-500 shrink-0">✓</span> {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : atsResult.insights?.strongAreas && atsResult.insights.strongAreas.length > 0 && (
                  <Card className="border-green-100 bg-green-50/30 dark:border-green-900/50 dark:bg-green-900/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400"><CheckCircle className="h-4 w-4" /> Strong Areas</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <ul className="space-y-1.5">
                        {atsResult.insights.strongAreas.map((area: string, i: number) => (
                          <li key={i} className="text-xs text-green-800 dark:text-green-300 leading-snug flex items-start gap-1.5">
                             <span className="text-green-500 shrink-0">•</span> {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {atsResult.missingSkillsImpact ? (
                  <Card className="border-red-100 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400"><XCircle className="h-4 w-4" /> Missing Skills Impact</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      {atsResult.missingSkillsImpact.criticalGaps && atsResult.missingSkillsImpact.criticalGaps.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-red-800 uppercase mb-2">Critical Gaps</div>
                          <div className="space-y-3">
                            {atsResult.missingSkillsImpact.criticalGaps.map((gap: any, i: number) => (
                              <div key={i} className="bg-white/50 dark:bg-black/20 p-2.5 rounded border border-red-100 dark:border-red-900/30">
                                <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                                  <span className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5"><span className="text-red-500">•</span> {gap.skill}</span>
                                  {gap.confidence && <span className="text-[9px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-1.5 py-0.5 rounded font-semibold">{gap.confidence}% Confidence</span>}
                                </div>
                                <p className="text-[11px] text-red-800/80 dark:text-red-300/80 leading-snug mb-1.5 break-words whitespace-normal"><span className="font-semibold text-red-800 dark:text-red-300">Reason:</span> {gap.reason}</p>
                                {gap.whyItMatters && <p className="text-[11px] text-red-800/80 dark:text-red-300/80 leading-snug mb-1.5 break-words whitespace-normal"><span className="font-semibold text-red-800 dark:text-red-300">Why Employers Care:</span> {gap.whyItMatters}</p>}
                                {gap.commonUseCases && gap.commonUseCases.length > 0 && (
                                  <div className="text-[10px] flex flex-wrap gap-1 mt-1">
                                    <span className="font-semibold text-red-800 dark:text-red-300 mr-1">Uses:</span>
                                    {gap.commonUseCases.map((useCase: string, idx: number) => (
                                      <span key={idx} className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1 rounded break-words whitespace-normal">{useCase}</span>
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
                          <div className="text-[10px] font-bold text-amber-700 uppercase mb-2">Moderate Gaps</div>
                          <div className="space-y-3">
                            {atsResult.missingSkillsImpact.moderateGaps.map((gap: any, i: number) => (
                              <div key={i} className="bg-white/50 dark:bg-black/20 p-2.5 rounded border border-amber-100 dark:border-amber-900/30">
                                <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"><span className="text-amber-500">•</span> {gap.skill}</span>
                                  {gap.confidence && <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">{gap.confidence}% Confidence</span>}
                                </div>
                                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-snug mb-1.5 break-words whitespace-normal"><span className="font-semibold text-amber-800 dark:text-amber-300">Reason:</span> {gap.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : atsResult.insights?.weakAreas && atsResult.insights.weakAreas.length > 0 && (
                  <Card className="border-red-100 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400"><XCircle className="h-4 w-4" /> Weak Areas</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      <ul className="space-y-1.5">
                        {atsResult.insights.weakAreas.map((area: string, i: number) => (
                          <li key={i} className="text-xs text-red-800 dark:text-red-300 leading-snug flex items-start gap-1.5">
                             <span className="text-red-500 shrink-0">•</span> {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Highest ROI Improvements */}
              {atsResult.highestRoiImprovements && atsResult.highestRoiImprovements.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 mb-3"><TrendingUp className="h-4 w-4 text-purple-500" /> Highest ROI Improvements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {atsResult.highestRoiImprovements.map((improvement: any, i: number) => (
                      <Card key={i} className="flex flex-col p-3 shadow-sm border-zinc-200 dark:border-zinc-800 bg-purple-50/30 dark:bg-purple-900/10">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{improvement.skill}</span>
                          <div className="flex gap-0.5 text-purple-500">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star key={starIdx} className={`h-3.5 w-3.5 ${starIdx < improvement.stars ? 'fill-purple-500 text-purple-500' : 'text-zinc-300 dark:text-zinc-700'}`} />
                            ))}
                          </div>
                        </div>
                        {improvement.expectedImpact && (
                          <div className="flex gap-2 items-center mb-2">
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Impact: {improvement.expectedImpact}
                            </span>
                            {improvement.estimatedMatchImprovementRange && (
                              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                +{improvement.estimatedMatchImprovementRange} to Match Score
                              </span>
                            )}
                          </div>
                        )}
                        {improvement.reason && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{improvement.reason}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Transferability & Hiring Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {atsResult.skillTransferability && (
                  <Card className="border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-900/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:emerald-400"><Sparkles className="h-4 w-4" /> Skill Transferability</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase mb-1">Transferable Strengths</div>
                        <ul className="space-y-1">
                          {atsResult.skillTransferability.transferableStrengths.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 leading-snug flex items-start gap-1.5"><span className="text-emerald-500 shrink-0">✓</span> {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase mb-1">Foundation For</div>
                        <ul className="space-y-1">
                          {atsResult.skillTransferability.foundationFor.map((s: string, i: number) => (
                            <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 leading-snug flex items-start gap-1.5"><span className="text-emerald-500 shrink-0">•</span> {s}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {atsResult.hiringRecommendation && (
                  <Card className="border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-900/10">
                    <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-400"><User className="h-4 w-4" /> Hiring Recommendation</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2 text-xs text-indigo-900 dark:text-indigo-200">
                      <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-800/30 pb-1.5">
                        <span className="font-semibold">Current Fit</span>
                        <span>{atsResult.hiringRecommendation.currentFit}</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-800/30 pb-1.5">
                        <span className="font-semibold">Interview Worthy</span>
                        <span>{atsResult.hiringRecommendation.interviewWorthy ? "Yes" : "No"}</span>
                      </div>
                      {atsResult.hiringRecommendation.hiringConfidence && (
                        <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-800/30 pb-1.5">
                          <span className="font-semibold">Hiring Confidence</span>
                          <span>{atsResult.hiringRecommendation.hiringConfidence}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-indigo-100 dark:border-indigo-800/30 pb-1.5">
                        <span className="font-semibold">Est. Onboarding</span>
                        <span>{atsResult.hiringRecommendation.estimatedOnboardingTime}</span>
                      </div>
                      <div className="pt-1">
                        <span className="font-semibold block mb-1">Reason:</span>
                        <p className="leading-snug">{atsResult.hiringRecommendation.reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Best Matching Roles & Salary Estimate */}
              {(atsResult.similarRoles?.length > 0 || atsResult.estimatedCompetitiveness) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {atsResult.similarRoles && atsResult.similarRoles.length > 0 && (
                    <Card className="border-sky-100 bg-sky-50/30 dark:border-sky-900/50 dark:bg-sky-900/10">
                      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-sky-700 dark:text-sky-400"><Briefcase className="h-4 w-4" /> Better Matched Roles</CardTitle></CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2 text-xs text-sky-900 dark:text-sky-200">
                        {atsResult.similarRoles.map((role: any, i: number) => (
                          <div key={i} className="flex justify-between border-b border-sky-100 dark:border-sky-800/30 pb-1.5 last:border-0 last:pb-0">
                            <span className="font-medium">{role.role}</span>
                            <span className="font-bold text-sky-700 dark:text-sky-300">{role.matchPercentage}%</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {atsResult.estimatedCompetitiveness && (
                    <Card className="border-amber-100 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-900/10">
                      <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400"><CircleDollarSign className="h-4 w-4" /> Estimated Competitiveness</CardTitle></CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3 text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-sm">Overall Level: {atsResult.estimatedCompetitiveness.currentLevel}</span>
                        </div>
                        <div className="space-y-1.5">
                          {atsResult.estimatedCompetitiveness.resumeQualityPercentile && (
                            <div className="flex justify-between border-b border-amber-100 dark:border-amber-800/30 pb-1.5">
                              <span className="font-medium">Resume Quality</span>
                              <span className="font-bold">{atsResult.estimatedCompetitiveness.resumeQualityPercentile}</span>
                            </div>
                          )}
                          {atsResult.estimatedCompetitiveness.technicalMatchPercentile && (
                            <div className="flex justify-between border-b border-amber-100 dark:border-amber-800/30 pb-1.5">
                              <span className="font-medium">Technical Match</span>
                              <span className="font-bold">{atsResult.estimatedCompetitiveness.technicalMatchPercentile}</span>
                            </div>
                          )}
                          {atsResult.estimatedCompetitiveness.atsCompatibilityPercentile && (
                            <div className="flex justify-between border-b border-amber-100 dark:border-amber-800/30 pb-1.5">
                              <span className="font-medium">ATS Compatibility</span>
                              <span className="font-bold">{atsResult.estimatedCompetitiveness.atsCompatibilityPercentile}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Project Evaluation Section */}
              {atsResult.projectEvaluation && (
                <div className="pt-2">
                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <FolderKanban className="h-4 w-4 text-zinc-500" /> Project Alignment
                      </h3>
                      <Badge variant="outline" className={`font-semibold ${
                        atsResult.projectEvaluation.matchStatus === "Strong Match" ? "bg-green-100 text-green-700 border-green-200 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300" :
                        atsResult.projectEvaluation.matchStatus === "Partial Match" ? "bg-amber-100 text-amber-700 border-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                        "bg-red-100 text-red-700 border-red-200 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}>{atsResult.projectEvaluation.matchStatus}</Badge>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{atsResult.projectEvaluation.feedback}</p>
                    </div>
                  </Card>
                </div>
              )}
              
              <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-blue-600 mb-1 flex items-center gap-1.5"><User className="h-3 w-3" /> Recruiter Note</p>
                <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed italic">&quot;{atsResult.insights.recruiterFeedback}&quot;</p>
              </div>

              {/* Requirements Comparison */}
              {atsResult.requirementsComparison && atsResult.requirementsComparison.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 mb-2"><CheckSquare className="h-4 w-4 text-sky-500" /> Strength vs Job Requirements</h3>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {atsResult.requirementsComparison.map((req: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{req.requirement}</span>
                          {req.status === "Strong" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" /> Strong</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]"><XCircle className="h-3 w-3 mr-1" /> Missing</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Skill Concepts */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200"><Wrench className="h-4 w-4" /> Concept-Based Analysis</h3>
                <Accordion className="w-full space-y-2">
                  {atsResult.skillConcepts.map((concept: any, i: number) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg px-1 overflow-hidden">
                      <AccordionTrigger className="hover:no-underline py-3 px-3">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="text-sm font-medium">{concept.category}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${concept.matchPercentage >= 75 ? 'text-green-600' : concept.matchPercentage >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{concept.matchPercentage}%</span>
                            <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className={`h-full ${concept.matchPercentage >= 75 ? 'bg-green-500' : concept.matchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${concept.matchPercentage}%` }} />
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-1 space-y-3">
                        {concept.matchedSkills.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Matched</span>
                            <div className="flex flex-wrap gap-1.5">
                              {concept.matchedSkills.map((s: string, idx: number) => <Badge key={idx} className="text-[10px] bg-green-600 hover:bg-green-700 text-white border-0 font-medium shadow-none">{s}</Badge>)}
                            </div>
                          </div>
                        )}
                        {concept.missingSkills.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Missing</span>
                            <div className="flex flex-wrap gap-1.5">
                              {concept.missingSkills.map((s: string, idx: number) => <Badge key={idx} className="text-[10px] bg-red-600 hover:bg-red-700 text-white border-0 font-medium shadow-none">{s}</Badge>)}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Actionable Rewrites */}
              {atsResult.actionableRewrites.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200"><Wand2 className="h-4 w-4" /> Bullet Point Upgrades</h3>
                  <div className="space-y-4">
                    {atsResult.actionableRewrites.map((rewrite: any, i: number) => (
                      <Card key={i} className="overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-800/60">
                          <span className="text-[10px] font-bold uppercase text-red-500/80 dark:text-red-400/80 mb-1.5 block tracking-wider">Original (Weak)</span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-through decoration-red-500/70 dark:decoration-red-500/70 decoration-2 leading-relaxed">{rewrite.originalText}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-950">
                          <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-500 mb-2 flex items-center gap-1.5 tracking-wider"><Sparkles className="h-3 w-3" /> Suggested Refinement</span>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed mb-4">{rewrite.improvedText}</p>
                          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3 flex items-start gap-2 border border-blue-100/50 dark:border-blue-500/10">
                            <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">{rewrite.reason}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Path */}
              {atsResult.learningPath && atsResult.learningPath.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 mb-3"><Map className="h-4 w-4 text-emerald-500" /> Recommended Learning Path</h3>
                  <Card className="border-emerald-100 dark:border-emerald-900/30 overflow-hidden shadow-sm bg-emerald-50/20 dark:bg-emerald-900/10 p-4">
                    <ol className="relative border-l border-emerald-200 dark:border-emerald-800 ml-3 space-y-4">
                      {atsResult.learningPath.map((step: string, i: number) => (
                        <li key={i} className="pl-5 relative">
                          <div className="absolute w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full -left-[10.5px] top-[-2px] flex items-center justify-center border-2 border-white dark:border-zinc-950">
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                          </div>
                          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed pt-0.5">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </Card>
                </div>
              )}

              {/* Predicted Impact */}
              {atsResult.predictedImpact && (
                <div className="pt-2">
                  <Card className="border-blue-200 dark:border-blue-800/50 overflow-hidden shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-base font-bold text-blue-900 dark:text-blue-300">Preview New Score</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">If you apply these suggested improvements:</p>
                        <ul className="space-y-1.5 ml-1">
                          {atsResult.predictedImpact.actions.map((action: string, i: number) => (
                            <li key={i} className="text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span> {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white/60 dark:bg-zinc-950/40 rounded-lg p-3 grid grid-cols-2 gap-4 border border-blue-100 dark:border-blue-900/30">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">Predicted Overall Match</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-500 line-through decoration-zinc-400">{atsResult.scores?.overallMatch ?? 0}%</span>
                            <ArrowRight className="h-3 w-3 text-zinc-400" />
                            <span className="text-lg font-black text-green-600 dark:text-green-500">{atsResult.predictedImpact.predictedOverallMatch}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">Interview Probability</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-500 line-through decoration-zinc-400">{atsResult.scores?.interviewProbability ?? 0}%</span>
                            <ArrowRight className="h-3 w-3 text-zinc-400" />
                            <span className="text-lg font-black text-green-600 dark:text-green-500">{atsResult.predictedImpact.predictedInterviewProbability}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Bottom Line */}
              {atsResult.bottomLine && (
                <div className="pt-2 pb-6">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200 mb-1">Bottom Line</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {atsResult.bottomLine}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      );
    }

    if (isRes && !isAts) {
      return (
        <>
          {(!isPrev || !isMobile) && (
            <div className="mb-3 flex gap-2">
              <Button onClick={() => setPasteOpen(true)} variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8 hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 active:scale-90"><Sparkles className="h-3.5 w-3.5 text-primary" /><span className="text-primary font-semibold">Magic Import</span></Button>
              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button variant="destructive" size="sm" className="flex-1 gap-1.5 text-xs h-8 active:scale-90 transition-all duration-200">
                    <Trash2 className="h-3.5 w-3.5" />Clear All
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to clear all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your resume data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => dispatchers.resetResume()} className="bg-red-600 text-white hover:bg-red-700">Clear All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {activeTab === "personal" && <PersonalInfoSection />}
          {activeTab === "experience" && <ExperienceSection />}
          {activeTab === "projects" && <ProjectsSection />}
          {activeTab === "education" && <EducationSection />}
          {activeTab === "skills" && <SkillsSection />}
          {isPrev && isMobile && (
              <div className="flex flex-col pt-2">
                {renderThemeSelector()}
                <div className="flex justify-center"><div className="w-full shadow-lg bg-white"><div ref={previewWrapperRef} className="overflow-y-auto overflow-x-hidden no-scrollbar w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * previewScale) }}><div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>{resumeEl}</div></div></div></div>
              </div>
          )}
        </>
      );
    }

    if (isCov && (isEdit || !isMobile)) {
      return <CoverLetterBuilder onGenerate={handleCoverLetterGenerate} />;
    }

    if (isCov && !isEdit && isMobile) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap print:hidden mb-2">
            <Button onClick={handleCopy} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{copied ? "Copied!" : "Copy"}</Button>
            <Button onClick={handleShorten} disabled={!coverBody || shortening} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{shortening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scissors className="h-3 w-3" />}{shortening ? "..." : "Shorten"}</Button>
            <Button onClick={handleRegenerate} disabled={!coverBody || regenerating} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}Re-gen</Button>
            <Button onClick={handleDelete} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7 text-red-600"><Trash2 className="h-3 w-3" />Delete</Button>
          </div>
          {renderThemeSelector()}
          <div className="flex justify-center"><div className="w-full shadow-lg bg-white"><div ref={coverPreviewWrapperRef} className="overflow-y-auto overflow-x-hidden no-scrollbar w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * coverPreviewScale) }}><div style={{ transform: `scale(${coverPreviewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>{coverEl}</div></div></div></div>
        </div>
      );
    }

    if (isInt && (isEdit || !isMobile)) {
      return (
        <div className="flex flex-col h-full">
          {/* Sub Navigation */}
          <div className="shrink-0 mb-4 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl flex">
            <button onClick={() => setIntMode("prep")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all ${intMode === "prep" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><FileText className="h-3.5 w-3.5" />Prep Guide</button>
            <button onClick={() => setIntMode("mock")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all ${intMode === "mock" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><MessageSquare className="h-3.5 w-3.5" />Live Mock</button>
            <button onClick={() => setIntMode("dashboard")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all ${intMode === "dashboard" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><History className="h-3.5 w-3.5" />Dashboard</button>
          </div>

          <div className="flex-1 overflow-hidden">
            {intMode === "prep" && (
              <div className="space-y-4">
                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Interview Prep Generator</div>
                <div className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 space-y-3">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Target Role <span className="text-red-400">*</span></label><Input value={intRole} onChange={e => setIntRole(e.target.value)} placeholder="Senior Product Manager" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Company <span className="text-red-400">*</span></label><Input value={intCompany} onChange={e => setIntCompany(e.target.value)} placeholder="Stripe" /></div>
                  <Button onClick={handleIntGenerate} disabled={intGenerating || !intRole.trim() || !intCompany.trim()} className="w-full gap-1.5" variant="magic" size="sm">{intGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{intGenerating ? "Generating..." : "Generate Prep Guide"}</Button>
                </div>
              </div>
            )}
            
            {intMode === "mock" && renderMockInterview()}
            
            {intMode === "dashboard" && renderMockDashboard()}
          </div>
        </div>
      );
    }

    if (isInt && !isEdit && isMobile) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap print:hidden mb-2">
            <Button onClick={handleIntCopy} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7">{intCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{intCopied ? "Copied!" : "Copy"}</Button>
            <Button onClick={handleIntClear} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-[10px] h-7 text-red-600"><Trash2 className="h-3 w-3" />Clear</Button>
          </div>
          {renderThemeSelector()}
          <div className="flex justify-center"><div className="w-full shadow-lg bg-white"><div ref={intPreviewWrapperRef} className="overflow-y-auto overflow-x-hidden no-scrollbar w-full" style={{ height: Math.ceil(A4_HEIGHT_PX * intPreviewScale) }}><div style={{ transform: `scale(${intPreviewScale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>{intEl}</div></div></div></div>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      {pasteOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden animate-in fade-in duration-200"><div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-4 md:p-6 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"><div className="flex items-center justify-between mb-3 shrink-0"><h2 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="text-primary">Magic Import</span></h2><button onClick={() => setPasteOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button></div><div className="flex flex-col gap-3 flex-1 overflow-hidden"><div className="flex items-center justify-between"><p className="text-xs text-zinc-500">Paste raw resume text below</p>{/*<div className="relative"><input type="file" accept=".pdf" onChange={handlePdfUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={pdfLoading} /><Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 px-2">{pdfLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}{pdfLoading ? "Extracting..." : "Upload PDF"}</Button></div>*/}</div><Textarea value={pasteRaw} onChange={e => setPasteRaw(e.target.value)} placeholder="Paste raw text here..." className="flex-1 min-h-[20vh] max-h-[40vh] overflow-y-auto resize-none text-[16px] md:text-sm" /></div><Button onClick={handlePaste} disabled={pasteLoading || !pasteRaw.trim()} className="w-full gap-1.5 mt-4 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-0 active:scale-95 transition-all duration-200" size="sm">{pasteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{pasteLoading ? "Parsing..." : "Populate Resume"}</Button></div></div>)}
      <div className="flex flex-col md:flex-row h-dvh md:h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
        <aside className="print:hidden w-full md:w-[440px] md:min-w-[440px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          <header className="shrink-0 px-4 md:px-5 py-3 md:py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-3"><div className="flex items-center gap-2 md:gap-2.5"><div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm"><FileText className="h-4 w-4 md:h-4 md:w-4 text-white" /></div><div><h1 className="text-sm md:text-base font-bold text-blue-600 dark:text-blue-400 leading-tight">Ascent</h1><p className="text-[10px] md:text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">AI Career Toolkit</p></div></div><Button onClick={() => handlePrint()} size="sm" className="gap-1.5 md:gap-2 shrink-0 text-xs h-8 md:h-9 px-3 md:px-4 active:scale-95 transition-all shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-500 text-white border-0"><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline font-medium">Download PDF</span><span className="sm:hidden font-medium">PDF</span></Button></header>
          <div className="shrink-0 px-4 md:px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/50">
            <nav className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
              <button onClick={() => { setBuilderMode("resume"); setActiveTab("personal"); }} className={`whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${isRes ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><FileText className="h-4 w-4" />Resume</button>
              <button onClick={() => { setBuilderMode("cover-letter"); setCoverView("edit"); }} className={`whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${isCov ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><Mail className="h-4 w-4" />Cover Letter</button>
              <button onClick={() => { setBuilderMode("interview"); setCoverView("edit"); }} className={`whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${isInt ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><MessageSquare className="h-4 w-4" />Interview</button>
            </nav>
          </div>
          {isRes && (
            <div className="shrink-0 px-4 md:px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 overflow-x-auto no-scrollbar scroll-smooth">
              <nav className="flex gap-1.5">
                {tabs.map(t => (
                  <button id={`subtab-${t.id}`} key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all duration-200 whitespace-nowrap ${activeTab === t.id ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300"}`}>
                    {"icon" in t && t.icon ? <>{t.icon} </> : null}<span>{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
          {(isCov || isInt) && isMobile && (
            <div className="shrink-0 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50">
              <nav className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                <button onClick={() => setCoverView("edit")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg transition-all duration-200 ${isEdit ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><FileText className="h-3.5 w-3.5" />Edit</button>
                <button onClick={() => setCoverView("preview")} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg transition-all duration-200 ${!isEdit ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 dark:text-zinc-400 dark:hover:text-zinc-300"}`}><Eye className="h-3.5 w-3.5" />Preview</button>
              </nav>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3 md:p-5">{renderLeftPane()}</div>
        </aside>
        <main className="hidden md:flex flex-1 bg-zinc-50 dark:bg-zinc-900/50 overflow-auto items-start justify-center p-6 shrink-0 print:flex print:bg-white print:p-0 print:overflow-visible print:h-auto print:w-full print:items-start print:justify-start"><div className="flex flex-col items-center gap-4 print:w-full print:gap-0">{renderThemeSelector()}{isRes ? <div className="origin-top shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 print:ring-0 print:shadow-none print:w-full transition-shadow hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)]">{isAts ? atsEl : resumeEl}</div> : isCov ? (<><div className="flex items-center gap-2 self-start print:hidden flex-wrap"><Button onClick={handleCopy} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-xs h-8 bg-white dark:bg-zinc-800 shadow-sm transition-all">{copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied!" : "Copy Text"}</Button><Button onClick={handleShorten} disabled={!coverBody || shortening} size="sm" variant="outline" className="gap-1.5 text-xs h-8 bg-white dark:bg-zinc-800 shadow-sm transition-all">{shortening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}{shortening ? "Shortening..." : "Shorten"}</Button><Button onClick={handleRegenerate} disabled={!coverBody || regenerating} size="sm" variant="outline" className="gap-1.5 text-xs h-8 bg-white dark:bg-zinc-800 shadow-sm transition-all">{regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}{regenerating ? "Regenerating..." : "Regenerate"}</Button><Button onClick={handleDelete} disabled={!coverBody} size="sm" variant="outline" className="gap-1.5 text-xs h-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-all"><Trash2 className="h-3.5 w-3.5" />Delete</Button></div><div className="origin-top shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 print:ring-0 print:shadow-none print:w-full transition-shadow hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)]"><CoverLetterPreview body={coverBody} targetRole={coverTargetRole} companyName={coverCompanyName} userName={coverUserName} themeFont={themeFont} themeAccent={themeAccent} type={coverType} /></div></>) : (<><div className="flex items-center gap-2 self-start print:hidden flex-wrap"><Button onClick={handleIntCopy} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-xs h-8 bg-white dark:bg-zinc-800 shadow-sm transition-all">{intCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}{intCopied ? "Copied!" : "Copy"}</Button><Button onClick={handleIntClear} disabled={!intContent} size="sm" variant="outline" className="gap-1.5 text-xs h-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-all"><Trash2 className="h-3.5 w-3.5" />Clear</Button></div><div className="origin-top shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 print:ring-0 print:shadow-none print:w-full transition-shadow hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)]">{intEl}</div></>)}</div></main>
      </div>
    </>
  );
}

export default function Home() { return (<ResumeProvider><ResumeBuilderInner /></ResumeProvider>); }
