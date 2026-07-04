"use client";

import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiMagicButton } from "@/components/builder/ai-magic-button";
import { enhanceBulletPoint, fixGrammar, tailorToJob } from "@/app/actions/resume-ai";
import { Plus, Trash2, Wand2, GripVertical } from "lucide-react";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useTurnstile } from "@/components/turnstile-provider";

function TailorDialog({
  expId,
  bullets,
  onClose,
}: {
  expId: string;
  bullets: string;
  onClose: () => void;
}) {
  const { updateExperience } = useResume();
  const { turnstileToken, handleUnauthorized, setSessionVerified } = useTurnstile();
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTailor = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true);
    try {
      const result = await tailorToJob(bullets, jobDesc, turnstileToken || undefined);
      if (result) {
        updateExperience(expId, { bullets: result });
        setSessionVerified();
      }
    } catch (err: any) {
      console.error("Tailor failed:", err);
      handleUnauthorized(err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
      <label className="text-xs font-semibold text-primary">
        Tailor to Job Description
      </label>
      <Textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the target job description here..." className="min-h-[80px] text-xs" />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="magic" size="sm" onClick={handleTailor} disabled={loading || !jobDesc.trim()}>{loading ? "Tailoring..." : "Tailor Bullets"}</Button>
      </div>
    </div>
  );
}

export function ExperienceSection() {
  const { data, updateExperience, addExperience, removeExperience, reorderItems } = useResume();
  const { turnstileToken } = useTurnstile();
  const [tailorOpenId, setTailorOpenId] = useState<string | null>(null);
  const { experience } = data;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderItems("experience", result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Experience</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="experience-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {experience.map((exp, index) => (
                <Draggable key={exp.id} draggableId={exp.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-3 md:p-4 rounded-xl border ${
                        snapshot.isDragging ? "border-blue-500 shadow-lg bg-blue-50/50 dark:bg-blue-900/20" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50"
                      } space-y-3 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            {...provided.dragHandleProps}
                            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium text-zinc-400">Position {index + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeExperience(exp.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Company</label><Input value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} placeholder="Notion" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Role</label><Input value={exp.role} onChange={(e) => updateExperience(exp.id, { role: e.target.value })} placeholder="Senior Product Manager" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Start Date</label><Input value={exp.startDate} onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })} placeholder="2021" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">End Date</label><Input value={exp.endDate} onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })} placeholder="Present" /></div>
                        <div className="space-y-1.5 col-span-2"><label className="text-xs font-medium text-zinc-500">Location</label><Input value={exp.location} onChange={(e) => updateExperience(exp.id, { location: e.target.value })} placeholder="San Francisco, CA" /></div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Bullet Points<span className="ml-1 text-zinc-400 font-normal">(one per line, Markdown supported)</span></label>
                        <div className="flex items-center gap-1 flex-nowrap">
                          <AiMagicButton onClick={() => fixGrammar(exp.bullets, turnstileToken || undefined)} onResult={(text) => updateExperience(exp.id, { bullets: text })} label="Fix Grammar" className="text-[10px] px-1.5 h-7" />
                          <AiMagicButton onClick={() => enhanceBulletPoint(exp.bullets, turnstileToken || undefined)} onResult={(text) => updateExperience(exp.id, { bullets: text })} label="Enhance" className="text-[10px] px-1.5 h-7" />
                          <Button variant="magic" size="sm" onClick={() => setTailorOpenId(tailorOpenId === exp.id ? null : exp.id)} className="gap-1 shrink-0 text-[10px] px-1.5 h-7"><Wand2 className="h-3 w-3" /><span className="hidden xs:inline">Tailor to Job</span><span className="xs:hidden">Tailor</span></Button>
                        </div>
                        <Textarea value={exp.bullets} onChange={(e) => updateExperience(exp.id, { bullets: e.target.value })} placeholder="- Led redesign of core product...&#10;- Grew revenue by X%..." className="min-h-[100px] text-sm leading-relaxed font-mono" />
                        {tailorOpenId === exp.id && <TailorDialog expId={exp.id} bullets={exp.bullets} onClose={() => setTailorOpenId(null)} />}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Button variant="outline" size="sm" onClick={addExperience} className="w-full border-dashed gap-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"><Plus className="h-3.5 w-3.5" />Add Experience</Button>
    </div>
  );
}
