'use client';
// app/(learn)/learn/[slug]/[lessonId]/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Menu, X,
  BookOpen, FileText, HelpCircle, Video, Download, ExternalLink,
  MessageSquare, Award, Loader2
} from 'lucide-react';
import { coursesApi, enrollmentApi, notesApi } from '@/lib/api';
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { QuizViewer } from '@/components/lesson/QuizViewer';
import { toast } from 'sonner';
import { Lesson, CourseSection } from '@/types/api';

const LESSON_TYPE_ICON: Record<string, React.ElementType> = {
  video: Video,
  article: FileText,
  quiz: HelpCircle,
  assignment: FileText,
  download: Download,
  embed: ExternalLink,
  live: Video,
};

export default function LearnPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'discussion'>('content');

  // Fetch full course data with curriculum
  const { data: courseRes, isLoading: courseLoading } = useQuery({
    queryKey: ['learn-course', slug],
    queryFn: () => coursesApi.get(slug),
  });

  // Fetch progress
  const { data: progressRes } = useQuery({
    queryKey: ['progress', slug],
    queryFn: () => enrollmentApi.progress(slug),
  });

  // Fetch notes for current lesson
  const { data: notesRes, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', lessonId],
    queryFn: () => notesApi.list(Number(lessonId)),
  });

  const course = courseRes?.data;
  const progress = progressRes?.data;

  // Flatten all lessons across sections
  const allLessons: (Lesson & { sectionTitle: string })[] = course?.sections.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, sectionTitle: s.title }))
  ) ?? [];

  const currentLesson = allLessons.find((l) => l.id === Number(lessonId));
  const currentIndex = allLessons.findIndex((l) => l.id === Number(lessonId));
  const prevLesson = allLessons[currentIndex - 1];
  const nextLesson = allLessons[currentIndex + 1];

  const completedIds = new Set(progress?.completed_lesson_ids ?? []);

  const markComplete = useMutation({
    mutationFn: () => enrollmentApi.updateProgress({
      lesson_id: Number(lessonId),
      is_completed: true,
      watch_percent: 100,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', slug] });
      toast.success('Lesson marked as complete!');
      if (nextLesson) {
        setTimeout(() => router.push(`/learn/${slug}/${nextLesson.id}`), 800);
      }
    },
  });

  if (courseLoading) return <LearnSkeleton />;
  if (!course || !course.enrollment) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">You need to enroll in this course first.</p>
        <Link href={`/courses/${slug}`} className="text-primary hover:underline">Go to course page</Link>
      </div>
    );
  }
  if (!currentLesson) return <div className="flex items-center justify-center min-h-screen">Lesson not found.</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR */}
      <aside className={`flex-shrink-0 border-r border-border bg-card overflow-y-auto transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
      }`}>
        {/* Course header */}
        <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
          <Link href={`/courses/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to course
          </Link>
          <h2 className="font-semibold text-sm line-clamp-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress?.percentage ?? 0}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress?.percentage ?? 0}%` }} />
            </div>
          </div>
        </div>

        {/* Curriculum */}
        <div className="py-2">
          {course.sections.map((section) => (
            <div key={section.id}>
              <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-[88px]">
                {section.title}
              </div>
              {section.lessons.map((lesson) => {
                const isActive = lesson.id === Number(lessonId);
                const isDone = completedIds.has(lesson.id);
                const Icon = LESSON_TYPE_ICON[lesson.type] ?? Video;

                return (
                  <Link key={lesson.id} href={`/learn/${slug}/${lesson.id}`}
                    className={`flex items-start gap-3 px-4 py-3 text-sm transition-colors border-l-2 ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}>
                    {/* Complete indicator */}
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="line-clamp-2 text-xs leading-snug">{lesson.title}</span>
                      </div>
                      {lesson.duration_seconds > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.floor(lesson.duration_seconds / 60)}m
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 flex-shrink-0 bg-background">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{currentLesson.sectionTitle}</p>
            <p className="text-sm font-medium truncate">{currentLesson.title}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {prevLesson && (
              <Link href={`/learn/${slug}/${prevLesson.id}`}
                className="flex items-center gap-1 h-8 px-3 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Link>
            )}
            <button
              onClick={() => markComplete.mutate()}
              disabled={completedIds.has(Number(lessonId)) || markComplete.isPending}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                completedIds.has(Number(lessonId))
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 cursor-default'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}>
              {markComplete.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {completedIds.has(Number(lessonId)) ? 'Completed' : 'Mark complete'}
            </button>
            {nextLesson && (
              <Link href={`/learn/${slug}/${nextLesson.id}`}
                className="flex items-center gap-1 h-8 px-3 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* VIDEO */}
          {currentLesson.type === 'video' && currentLesson.video_url && (
            <div className="max-w-5xl mx-auto">
              <VideoPlayer
                videoUrl={currentLesson.video_url}
                lessonId={currentLesson.id}
                courseId={course.id}
                duration={currentLesson.duration_seconds}
                notes={notesRes?.data ?? []}
                onNoteAdded={refetchNotes}
                onComplete={() => {
                  qc.invalidateQueries({ queryKey: ['progress', slug] });
                  toast.success('🎉 Lesson completed!');
                }}
              />
            </div>
          )}

          {/* ARTICLE */}
          {currentLesson.type === 'article' && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <h1 className="text-2xl font-display font-bold mb-6">{currentLesson.title}</h1>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentLesson.content ?? '' }}
              />
            </div>
          )}

          {/* EMBED */}
          {currentLesson.type === 'embed' && currentLesson.embed_url && (
            <div className="max-w-5xl mx-auto px-4 py-4">
              <div style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={currentLesson.embed_url.replace('watch?v=', 'embed/')}
                  className="w-full h-full rounded-xl"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          )}

          {/* QUIZ */}
          {currentLesson.type === 'quiz' && currentLesson.quiz_id && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <QuizViewer
                quizId={currentLesson.quiz_id}
                onPass={() => {
                  enrollmentApi.updateProgress({ lesson_id: currentLesson.id, is_completed: true });
                  qc.invalidateQueries({ queryKey: ['progress', slug] });
                }}
              />
            </div>
          )}

          {/* DOWNLOAD */}
          {currentLesson.type === 'download' && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <h2 className="text-xl font-display font-bold mb-4">Downloads</h2>
              {currentLesson.content && (
                <div className="prose dark:prose-invert mb-6"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
              )}
              <div className="space-y-3">
                {(currentLesson.attachments ?? []).map((att, i) => (
                  <a key={i} href={att.url} download
                    className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted transition-colors group">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{att.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.mime_type} · {Math.round(att.size / 1024)} KB
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tabs: Notes / Discussion */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 pb-12">
            <div className="border-b border-border flex gap-1 mb-6">
              {(['notes', 'discussion'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                    activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  {tab === 'notes' ? '📝 My Notes' : '💬 Discussion'}
                </button>
              ))}
            </div>

            {activeTab === 'notes' && (
              <div className="space-y-3">
                {(notesRes?.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notes yet. Use the notes panel in the video player to add notes.</p>
                ) : (
                  (notesRes?.data ?? []).map((note) => (
                    <div key={note.id} className="flex gap-3 p-3 bg-muted/50 rounded-xl">
                      {note.timestamp_seconds != null && (
                        <span className="text-primary text-xs font-mono bg-primary/10 px-2 py-1 rounded h-fit whitespace-nowrap">
                          {Math.floor(note.timestamp_seconds / 60)}:{String(note.timestamp_seconds % 60).padStart(2, '0')}
                        </span>
                      )}
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Discussion for this lesson</p>
                <Link href={`/courses/${slug}/discussions?lesson=${lessonId}`}
                  className="text-primary text-sm hover:underline mt-1 block">
                  Open full discussion →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearnSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-border bg-card" />
      <div className="flex-1 animate-pulse">
        <div className="h-14 border-b border-border" />
        <div className="bg-black" style={{ aspectRatio: '16/9' }} />
      </div>
    </div>
  );
}
