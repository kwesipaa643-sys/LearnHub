'use client';
// app/(instructor)/instructor/courses/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Eye, Pencil, BarChart3, Trash2, BookOpen, Users, Star, Globe, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { coursesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export default function InstructorCoursesPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => coursesApi.myCourses(),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => coursesApi.publish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['instructor-courses'] }); toast.success('Course submitted for review'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['instructor-courses'] }); toast.success('Course deleted'); },
  });

  const courses = data?.data ?? [];

  const statusBadge: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    archived: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{courses.length} total courses</p>
        </div>
        <Link href="/instructor/courses/new"
          className="flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl shimmer" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No courses yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Create your first course and start teaching!</p>
          <Link href="/instructor/courses/new"
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-xl p-4 flex gap-4 hover:border-primary/30 transition-colors">
              <img src={course.thumbnail_url ?? ''} alt={course.title}
                className="w-28 rounded-lg object-cover flex-shrink-0 bg-muted" style={{ aspectRatio: '16/9' }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[course.status] ?? ''}`}>
                        {course.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">{course.category?.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{course.level}</span>
                      <span className="text-xs font-medium">
                        {course.pricing_type === 'free' ? 'Free' : formatPrice(course.price, course.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {course.enrollments_count.toLocaleString()} students
                      </span>
                      {course.rating_count > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {course.rating_avg.toFixed(1)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {course.lessons_count} lessons · {course.duration_hours}h
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/courses/${course.slug}`} target="_blank"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors" title="Preview">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/instructor/courses/${course.id}/analytics`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors" title="Analytics">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/instructor/courses/${course.id}/edit`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    {course.status === 'draft' && (
                      <button onClick={() => publishMutation.mutate(course.id)}
                        className="flex items-center gap-1.5 h-8 px-3 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                        <Globe className="w-3 h-3" /> Publish
                      </button>
                    )}
                    {course.enrollments_count === 0 && (
                      <button onClick={() => confirm('Delete this course?') && deleteMutation.mutate(course.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
