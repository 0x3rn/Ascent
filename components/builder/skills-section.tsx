"use client";

import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export function SkillsSection() {
  const { data, updateSkillCategory, addSkillCategory, removeSkillCategory, reorderItems } = useResume();
  const { skills } = data;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderItems("skills", result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Skills</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="skills-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {skills.map((sk, index) => (
                <Draggable key={sk.id} draggableId={sk.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 rounded-xl border ${
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
                          <span className="text-xs font-medium text-zinc-400">Category {index + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeSkillCategory(sk.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Category Name</label><Input value={sk.category} onChange={(e) => updateSkillCategory(sk.id, { category: e.target.value })} placeholder="Product & Strategy" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Skills<span className="ml-1 text-zinc-400 font-normal">(comma-separated)</span></label><Input value={sk.skills} onChange={(e) => updateSkillCategory(sk.id, { skills: e.target.value })} placeholder="Roadmapping, OKRs, User Research, A/B Testing" /></div>
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
      <Button variant="outline" size="sm" onClick={addSkillCategory} className="w-full border-dashed gap-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"><Plus className="h-3.5 w-3.5" />Add Skill Category</Button>
    </div>
  );
}
