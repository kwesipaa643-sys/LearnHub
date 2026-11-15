'use client';
// app/(instructor)/instructor/live/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Video, Plus, Calendar, Users, Play, Square, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { liveClassesApi, coursesApi } from '@/lib/api';

export default function InstructorLivePage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ course_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60 });

  const { data: coursesRes } = useQuery({
    queryKey: ['instructor-courses-simple'],
    queryFn: () => coursesApi.myCourses(),
  });

  const createMutation = useMutation({
    mutationFn: () => liveClassesApi.create({
      ...form,
      course_id: Number(form.course_id),
    } as any),
    onSuccess: () => {
      toast.success('Live class scheduled!');
      setShowModal(false);
      setForm({ course_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60 });
      qc.invalidateQueries({ queryKey: ['instructor-live-classes'] });
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => liveClassesApi.start(id),
    onSuccess: (_, id) => {
      toast.success('Class started!');
      window.location.href = `/live/${id}`;
    },
  });

  const courses = coursesRes?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Live Classes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Schedule and host live sessions for your students</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Schedule Class
        </button>
      </div>

      {/* Empty state since we don't have a list endpoint by instructor directly */}
      <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
        <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">No live classes scheduled</h3>
        <p className="text-muted-foreground text-sm mb-6">Schedule your first live class to engage with students in real-time.</p>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Schedule Your First Class
        </button>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg">Schedule Live Class</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Course</label>
                <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select a course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Q&A Session: Advanced Topics"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Date & Time</label>
                  <input type="datetime-local" value={form.scheduled_at}
                    onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Duration (min)</label>
                  <input type="number" value={form.duration_minutes}
                    onChange={(e) => setForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => createMutation.mutate()} disabled={!form.course_id || !form.title || createMutation.isPending}
                className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Schedule Class
              </button>
              <button onClick={() => setShowModal(false)} className="h-10 px-4 border border-border rounded-lg text-sm hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
