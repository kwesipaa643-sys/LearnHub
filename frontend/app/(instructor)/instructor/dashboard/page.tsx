'use client';
// app/(instructor)/instructor/dashboard/page.tsx
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BookOpen, Users, DollarSign, Star, TrendingUp, Plus,
  ArrowRight, Eye, BarChart3, ChevronRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { instructorApi, coursesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { formatPrice } from '@/lib/utils';
import { CourseDetail } from '@/types/api';

export default function InstructorDashboardPage() {
  const { user } = useAuthStore();

  const { data: dashRes, isLoading } = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: () => instructorApi.dashboard(),
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => coursesApi.myCourses(),
  });

  const stats = dashRes?.data;
  const courses: CourseDetail[] = coursesRes?.data ?? [];

  const statCards = [
    { label: 'Total Students', value: stats?.total_students.toLocaleString() ?? '—', icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950', change: '+12%' },
    { label: 'Total Revenue', value: stats ? formatPrice(stats.total_revenue, 'USD') : '—', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950', change: '+8%' },
    { label: 'Avg Rating', value: stats?.avg_rating.toFixed(1) ?? '—', icon: Star, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950', change: '★' },
    { label: 'Total Courses', value: stats?.total_courses ?? '—', icon: BookOpen, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950', change: '' },
  ];

  const revenueData = stats?.monthly_revenue ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Hello, {user?.name}! Here's your overview.</p>
        </div>
        <Link href="/instructor/courses/new"
          className="flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              {s.change && (
                <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-medium">
                  {s.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-display font-bold">{isLoading ? '...' : s.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {revenueData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold">Revenue Overview</h2>
            <Link href="/instructor/earnings" className="text-sm text-primary hover:underline flex items-center gap-1">
              Full report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs text-muted-foreground" tick={{ fontSize: 11 }} />
              <YAxis className="text-xs text-muted-foreground" tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [formatPrice(v, 'USD'), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Courses list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-semibold">Your Courses</h2>
          <Link href="/instructor/courses" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">You haven't created any courses yet.</p>
            <Link href="/instructor/courses/new"
              className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Create your first course
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {courses.slice(0, 6).map((course) => (
              <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <img src={course.thumbnail_url ?? ''} alt={course.title}
                  className="w-20 rounded-lg object-cover flex-shrink-0 bg-muted" style={{ aspectRatio: '16/9' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{course.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      course.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                      course.status === 'draft' ? 'bg-muted text-muted-foreground' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {course.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {course.enrollments_count}
                    </span>
                    {course.rating_avg > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {course.rating_avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/courses/${course.slug}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
                    title="Preview">
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <Link href={`/instructor/courses/${course.id}/analytics`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
                    title="Analytics">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Link>
                  <Link href={`/instructor/courses/${course.id}/edit`}
                    className="h-8 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
