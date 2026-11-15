'use client';
// app/(dashboard)/dashboard/page.tsx
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, Clock, Award, TrendingUp, Play, ChevronRight, Star } from 'lucide-react';
import { enrollmentApi, certificatesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { CourseCard } from '@/components/course/CourseCard';
import { EnrolledCourse } from '@/types/api';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: myCoursesRes, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => enrollmentApi.myCourses(),
  });

  const { data: certsRes } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificatesApi.list(),
  });

  const courses: EnrolledCourse[] = myCoursesRes?.data ?? [];
  const inProgress = courses.filter((c) => c.progress.percentage > 0 && c.progress.percentage < 100);
  const notStarted = courses.filter((c) => c.progress.percentage === 0);
  const completed = courses.filter((c) => c.progress.percentage === 100);
  const totalHoursLearned = courses.reduce((s, c) => s + (c.progress.completed_lessons * 0.2), 0);

  // Find last watched course
  const lastCourse = inProgress[0] ?? courses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Pick up where you left off</p>
        </div>
        <Link href="/courses"
          className="hidden sm:flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Browse Courses
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Enrolled Courses', value: courses.length, icon: BookOpen, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
          { label: 'In Progress', value: inProgress.length, icon: TrendingUp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
          { label: 'Completed', value: completed.length, icon: Award, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Hours Learned', value: `${totalHoursLearned.toFixed(0)}h`, icon: Clock, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-display font-bold">{stat.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {lastCourse && (
        <div className="mb-8">
          <h2 className="text-lg font-display font-semibold mb-4">Continue Learning</h2>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <img
              src={lastCourse.course.thumbnail_url ?? '/images/placeholder.jpg'}
              alt={lastCourse.course.title}
              className="w-full sm:w-40 rounded-xl object-cover flex-shrink-0"
              style={{ aspectRatio: '16/9' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-indigo-200 text-xs mb-1">{lastCourse.course.category?.name}</p>
              <h3 className="font-display font-bold text-xl mb-2 line-clamp-2">{lastCourse.course.title}</h3>

              {lastCourse.progress.last_lesson && (
                <p className="text-indigo-200 text-sm mb-3 truncate">
                  Next: {lastCourse.progress.last_lesson.title}
                </p>
              )}

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-indigo-200 mb-1">
                  <span>{lastCourse.progress.completed_lessons} / {lastCourse.progress.total_lessons} lessons</span>
                  <span>{lastCourse.progress.percentage}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${lastCourse.progress.percentage}%` }} />
                </div>
              </div>

              <Link
                href={`/learn/${lastCourse.course.slug}/${lastCourse.progress.last_lesson?.id ?? ''}`}
                className="inline-flex items-center gap-2 h-10 px-5 bg-white text-indigo-900 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors">
                <Play className="w-4 h-4 fill-current" />
                Continue Learning
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">In Progress ({inProgress.length})</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inProgress.map((ec) => (
              <CourseCard
                key={ec.course.id}
                course={ec.course}
                showProgress
                progressPercent={ec.progress.percentage}
              />
            ))}
          </div>
        </section>
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-display font-semibold mb-4">Not Started ({notStarted.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notStarted.map((ec) => (
              <CourseCard key={ec.course.id} course={ec.course} showProgress progressPercent={0} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-display font-semibold mb-4">Completed 🎉 ({completed.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {completed.map((ec) => (
              <div key={ec.course.id} className="relative">
                <CourseCard course={ec.course} showProgress progressPercent={100} />
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ✓ Done
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {courses.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Start your learning journey</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            You haven't enrolled in any courses yet. Explore thousands of expert-led courses.
          </p>
          <Link href="/courses"
            className="h-11 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Browse Courses
          </Link>
        </div>
      )}

      {/* Certificates preview */}
      {(certsRes?.data ?? []).length > 0 && (
        <section className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">My Certificates</h2>
            <Link href="/certificates" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(certsRes?.data ?? []).slice(0, 3).map((cert) => (
              <div key={cert.id} className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                <Award className="w-8 h-8 text-amber-500 mb-3" />
                <p className="font-semibold text-sm">{cert.course?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Issued {new Date(cert.issued_at).toLocaleDateString()}
                </p>
                <a href={cert.pdf_url ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-medium mt-3 hover:underline">
                  Download PDF →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
