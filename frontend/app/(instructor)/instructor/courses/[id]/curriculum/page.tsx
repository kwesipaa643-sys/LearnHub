'use client';
// app/(instructor)/instructor/courses/[id]/curriculum/page.tsx
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  GripVertical, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Video, FileText, HelpCircle, Download, ExternalLink, Loader2,
  Save, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { sectionsApi, lessonsApi, coursesApi } from '@/lib/api';
import { CourseSection, Lesson } from '@/types/api';

const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'download', label: 'Download', icon: Download },
  { value: 'embed', label: 'Embed', icon: ExternalLink },
];

export default function CurriculumBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const qc = useQueryClient();

  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [addingSectionTitle, setAddingSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [addingLessonFor, setAddingLessonFor] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', type: 'video' });
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const { data: sectionsRes, isLoading } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: () => sectionsApi.list(courseId),
  });

  const sections: CourseSection[] = sectionsRes?.data ?? [];

  // ── SECTION MUTATIONS ─────────────────────────────────────
  const addSection = useMutation({
    mutationFn: () => sectionsApi.create(courseId, {
      title: addingSectionTitle,
      sort_order: sections.length,
    }),
    onSuccess: () => {
      setAddingSectionTitle('');
      qc.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Section added');
    },
  });

  const updateSection = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      sectionsApi.update(courseId, id, { title }),
    onSuccess: () => {
      setEditingSectionId(null);
      qc.invalidateQueries({ queryKey: ['sections', courseId] });
    },
  });

  const deleteSection = useMutation({
    mutationFn: (sectionId: number) => sectionsApi.delete(courseId, sectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Section deleted');
    },
  });

  const reorderSections = useMutation({
    mutationFn: (reordered: CourseSection[]) =>
      sectionsApi.reorder(courseId, reordered.map((s, i) => ({ id: s.id, sort_order: i }))),
  });

  // ── LESSON MUTATIONS ──────────────────────────────────────
  const addLesson = useMutation({
    mutationFn: (sectionId: number) =>
      lessonsApi.create(sectionId, {
        title: newLesson.title,
        type: newLesson.type as Lesson['type'],
        sort_order: sections.find((s) => s.id === sectionId)?.lessons.length ?? 0,
      }),
    onSuccess: (_, sectionId) => {
      setAddingLessonFor(null);
      setNewLesson({ title: '', type: 'video' });
      qc.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Lesson added');
    },
  });

  const updateLesson = useMutation({
    mutationFn: (data: Partial<Lesson> & { id: number }) =>
      lessonsApi.update(data.id, data),
    onSuccess: () => {
      setEditingLesson(null);
      qc.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Lesson updated');
    },
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: number) => lessonsApi.delete(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections', courseId] });
      toast.success('Lesson deleted');
    },
  });

  const togglePublishLesson = useMutation({
    mutationFn: (lesson: Lesson) =>
      lessonsApi.update(lesson.id, { is_published: !lesson.is_published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sections', courseId] }),
  });

  const reorderLessons = useMutation({
    mutationFn: (lessons: { id: number; sort_order: number; section_id: number }[]) =>
      lessonsApi.reorder(lessons),
  });

  // ── DRAG & DROP ───────────────────────────────────────────
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === 'section') {
      const reordered = Array.from(sections);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      // Optimistic update handled by query cache
      reorderSections.mutate(reordered);
      return;
    }

    if (type === 'lesson') {
      const sourceSectionId = Number(source.droppableId);
      const destSectionId = Number(destination.droppableId);
      const sourceSection = sections.find((s) => s.id === sourceSectionId)!;
      const destSection = sections.find((s) => s.id === destSectionId)!;

      const sourceLessons = Array.from(sourceSection.lessons);
      const [movedLesson] = sourceLessons.splice(source.index, 1);

      if (sourceSectionId === destSectionId) {
        sourceLessons.splice(destination.index, 0, movedLesson);
        reorderLessons.mutate(
          sourceLessons.map((l, i) => ({ id: l.id, sort_order: i, section_id: sourceSectionId }))
        );
      } else {
        const destLessons = Array.from(destSection.lessons);
        destLessons.splice(destination.index, 0, { ...movedLesson, section_id: destSectionId });
        reorderLessons.mutate([
          ...sourceLessons.map((l, i) => ({ id: l.id, sort_order: i, section_id: sourceSectionId })),
          ...destLessons.map((l, i) => ({ id: l.id, sort_order: i, section_id: destSectionId })),
        ]);
      }
    }
  };

  const toggleSection = (id: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getLessonIcon = (type: string) => {
    const t = LESSON_TYPES.find((t) => t.value === type);
    return t ? t.icon : Video;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold">Curriculum Builder</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {sections.length} sections · {sections.reduce((s, sec) => s + sec.lessons.length, 0)} lessons
          </p>
        </div>
      </div>

      {/* Sections DnD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 mb-4">
              {sections.map((section, sIdx) => (
                <Draggable key={section.id} draggableId={`section-${section.id}`} index={sIdx}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}
                      className={`border border-border rounded-xl overflow-hidden bg-card ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''}`}>
                      {/* Section header */}
                      <div className="flex items-center gap-2 p-3 bg-muted/40">
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {editingSectionId === section.id ? (
                          <input
                            autoFocus
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateSection.mutate({ id: section.id, title: editingSectionTitle });
                              if (e.key === 'Escape') setEditingSectionId(null);
                            }}
                            className="flex-1 h-8 px-2 text-sm rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        ) : (
                          <button onClick={() => toggleSection(section.id)} className="flex-1 flex items-center gap-2 text-left">
                            {expandedSections.has(section.id)
                              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <span className="font-medium text-sm">{section.title}</span>
                            <span className="text-xs text-muted-foreground">
                              ({section.lessons.length} lessons)
                            </span>
                          </button>
                        )}

                        <div className="flex items-center gap-1">
                          {editingSectionId === section.id ? (
                            <>
                              <button onClick={() => updateSection.mutate({ id: section.id, title: editingSectionTitle })}
                                className="h-7 px-2 bg-primary text-primary-foreground rounded text-xs">Save</button>
                              <button onClick={() => setEditingSectionId(null)}
                                className="h-7 px-2 hover:bg-muted rounded text-xs text-muted-foreground">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingSectionId(section.id); setEditingSectionTitle(section.title); }}
                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => {
                                if (confirm('Delete this section and all its lessons?')) deleteSection.mutate(section.id);
                              }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lessons */}
                      {expandedSections.has(section.id) && (
                        <div>
                          <Droppable droppableId={String(section.id)} type="lesson">
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-border/50">
                                {section.lessons.map((lesson, lIdx) => {
                                  const LIcon = getLessonIcon(lesson.type);
                                  return (
                                    <Draggable key={lesson.id} draggableId={`lesson-${lesson.id}`} index={lIdx}>
                                      {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps}
                                          className={`flex items-center gap-3 px-4 py-2.5 ${snapshot.isDragging ? 'bg-primary/5 shadow' : 'hover:bg-muted/30'} transition-colors`}>
                                          <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground">
                                            <GripVertical className="w-3.5 h-3.5" />
                                          </div>
                                          <LIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                          <span className="flex-1 text-sm truncate">{lesson.title}</span>

                                          {lesson.is_preview && (
                                            <span className="text-[10px] text-primary border border-primary/30 px-1.5 py-0.5 rounded">Preview</span>
                                          )}

                                          <div className="flex items-center gap-1">
                                            <button onClick={() => togglePublishLesson.mutate(lesson)}
                                              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                                                lesson.is_published ? 'text-emerald-500 hover:bg-emerald-50' : 'text-muted-foreground hover:bg-muted'
                                              }`} title={lesson.is_published ? 'Unpublish' : 'Publish'}>
                                              {lesson.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            </button>
                                            <button onClick={() => setEditingLesson(lesson)}
                                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => {
                                              if (confirm('Delete this lesson?')) deleteLesson.mutate(lesson.id);
                                            }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {/* Add lesson */}
                          {addingLessonFor === section.id ? (
                            <div className="p-3 border-t border-border/50 bg-muted/20">
                              <div className="flex gap-2 mb-2">
                                <input autoFocus value={newLesson.title}
                                  onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
                                  placeholder="Lesson title"
                                  onKeyDown={(e) => e.key === 'Enter' && addLesson.mutate(section.id)}
                                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                <select value={newLesson.type}
                                  onChange={(e) => setNewLesson((p) => ({ ...p, type: e.target.value }))}
                                  className="h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none">
                                  {LESSON_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => addLesson.mutate(section.id)}
                                  disabled={!newLesson.title || addLesson.isPending}
                                  className="h-8 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1">
                                  {addLesson.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                  Add Lesson
                                </button>
                                <button onClick={() => setAddingLessonFor(null)}
                                  className="h-8 px-3 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => {
                              setAddingLessonFor(section.id);
                              setExpandedSections((p) => new Set([...p, section.id]));
                            }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors border-t border-border/50">
                              <Plus className="w-3.5 h-3.5" /> Add Lesson
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add section */}
      <div className="border-2 border-dashed border-border rounded-xl p-4">
        {addingSectionTitle !== null && (
          <div className="flex gap-2">
            <input
              value={addingSectionTitle}
              onChange={(e) => setAddingSectionTitle(e.target.value)}
              placeholder="New section title (e.g. Getting Started)"
              onKeyDown={(e) => e.key === 'Enter' && addingSectionTitle && addSection.mutate()}
              className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => addSection.mutate()}
              disabled={!addingSectionTitle || addSection.isPending}
              className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
              {addSection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Section
            </button>
          </div>
        )}
      </div>

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-display font-bold text-lg mb-5">Edit Lesson</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Title</label>
                <input value={editingLesson.title}
                  onChange={(e) => setEditingLesson((p) => p ? { ...p, title: e.target.value } : null)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Video URL (HLS .m3u8)</label>
                <input value={editingLesson.video_url ?? ''}
                  onChange={(e) => setEditingLesson((p) => p ? { ...p, video_url: e.target.value } : null)}
                  placeholder="https://stream.example.com/video.m3u8"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Duration (seconds)</label>
                <input type="number" value={editingLesson.duration_seconds}
                  onChange={(e) => setEditingLesson((p) => p ? { ...p, duration_seconds: Number(e.target.value) } : null)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingLesson.is_preview}
                  onChange={(e) => setEditingLesson((p) => p ? { ...p, is_preview: e.target.checked } : null)}
                  className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm">Free preview (visible without enrollment)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => updateLesson.mutate(editingLesson)}
                disabled={updateLesson.isPending}
                className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {updateLesson.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
              <button onClick={() => setEditingLesson(null)}
                className="h-10 px-4 border border-border rounded-lg text-sm hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
