"use client";

import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiMagicButton } from "@/components/builder/ai-magic-button";
import { enhanceBulletPoint, fixGrammar } from "@/app/actions/resume-ai";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export function ProjectsSection() {
  const { data, updateProject, addProject, removeProject, reorderItems } = useResume();
  const { projects } = data;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderItems("projects", result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Projects</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="projects-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {projects.map((proj, index) => (
                <Draggable key={proj.id} draggableId={proj.id} index={index}>
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
                          <span className="text-xs font-medium text-zinc-400">Project {index + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeProject(proj.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Project Name</label><Input value={proj.name} onChange={(e) => updateProject(proj.id, { name: e.target.value })} placeholder="Revenue Dashboard" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Link (GitHub, live URL, etc.)</label><Input value={proj.link} onChange={(e) => updateProject(proj.id, { link: e.target.value })} placeholder="github.com/user/project" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Skills Used<span className="ml-1 text-zinc-400 font-normal">(comma-separated)</span></label><Input value={proj.skills} onChange={(e) => updateProject(proj.id, { skills: e.target.value })} placeholder="React, D3.js, PostgreSQL, AWS Lambda" /></div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500">Bullet Points<span className="ml-1 text-zinc-400 font-normal">(one per line, Markdown supported)</span></label>
                        <div className="flex items-center gap-1 flex-nowrap">
                          <AiMagicButton onClick={() => fixGrammar(proj.bullets)} onResult={(text) => updateProject(proj.id, { bullets: text })} label="Fix Grammar" className="text-[10px] px-1.5 h-7" />
                          <AiMagicButton onClick={() => enhanceBulletPoint(proj.bullets)} onResult={(text) => updateProject(proj.id, { bullets: text })} label="Enhance" className="text-[10px] px-1.5 h-7" />
                        </div>
                        <Textarea value={proj.bullets} onChange={(e) => updateProject(proj.id, { bullets: e.target.value })} placeholder="- Built a real-time analytics dashboard...&#10;- Reduced query latency by X%..." className="min-h-[100px] text-sm leading-relaxed font-mono" />
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
      <Button variant="outline" size="sm" onClick={addProject} className="w-full border-dashed gap-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"><Plus className="h-3.5 w-3.5" />Add Project</Button>
    </div>
  );
}
