"use client";

import { useResume } from "@/lib/resume-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export function EducationSection() {
  const { data, updateEducation, addEducation, removeEducation, reorderItems } = useResume();
  const { education } = data;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderItems("education", result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Education</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="education-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {education.map((edu, index) => (
                <Draggable key={edu.id} draggableId={edu.id} index={index}>
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
                          <span className="text-xs font-medium text-zinc-400">Education {index + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeEducation(edu.id)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2"><label className="text-xs font-medium text-zinc-500">School</label><Input value={edu.school} onChange={(e) => updateEducation(edu.id, { school: e.target.value })} placeholder="Stanford University" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Degree</label><Input value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} placeholder="B.S." /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Field of Study</label><Input value={edu.field} onChange={(e) => updateEducation(edu.id, { field: e.target.value })} placeholder="Computer Science" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">Start Date</label><Input value={edu.startDate} onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })} placeholder="2013" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">End Date</label><Input value={edu.endDate} onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })} placeholder="2017" /></div>
                        <div className="space-y-1.5"><label className="text-xs font-medium text-zinc-500">GPA</label><Input value={edu.gpa} onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })} placeholder="3.9" /></div>
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
      <Button variant="outline" size="sm" onClick={addEducation} className="w-full border-dashed gap-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"><Plus className="h-3.5 w-3.5" />Add Education</Button>
    </div>
  );
}
