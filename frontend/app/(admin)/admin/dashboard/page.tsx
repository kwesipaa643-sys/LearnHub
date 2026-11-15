'use client';
// app/(admin)/admin/dashboard/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, BookOpen, DollarSign, TrendingUp, ShieldAlert,
  CheckCircle2, XCircle, Eye, MoreVertical, Search, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboardPage() {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'courses' | 'reviews'>('overview');
  const [search, setSearch] = useState('');

  const { data: dashRes, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard(),
  });

  const { data: usersRes } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.users({ search, per_page: 20 }),
    enabled: activeSection === 'users',
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminApi.courses({ status: 'under_review', per_page: 20 }),
    enabled: activeSection === 'courses',
  });

  const { data: reviewsRes } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => adminApi.reviews({ status: 'pending' }),
    enabled: activeSection === 'reviews',
  });

  // Course moderation
  const approveCourse = useMutation({
    mutationFn: (id: number) => adminApi.approveCourse(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course approved!'); },
  });
  const rejectCourse = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectCourse(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course rejected'); },
  });

  // User management
  const updateUserStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status updated'); },
  });

  // Review moderation
  const moderateReview = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'approved' | 'rejected' }) =>
      adminApi.moderateReview(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); },
  });

  const stats = dashRes?.data;
  const navItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'courses', label: 'Course Review' },
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Admin access
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 border-b border-border mb-6">
        {navItems.map((item) => (
          <button key={item.key} onClick={() => setActiveSection(item.key as typeof activeSection)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeSection === item.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats?.total_users.toLocaleString(), icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
              { label: 'Total Courses', value: stats?.total_courses, icon: BookOpen, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950' },
              { label: 'Enrollments', value: stats?.total_enrollments.toLocaleString(), icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
              { label: 'Total Revenue', value: stats ? formatPrice(stats.total_revenue, 'USD') : '—', icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-display font-bold">{isLoading ? '...' : s.value ?? '—'}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {(stats?.monthly_revenue ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats!.monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => [formatPrice(v, 'USD'), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {activeSection === 'users' && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(usersRes?.data ?? []).map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' :
                        user.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                        'bg-muted text-muted-foreground'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-red-100 text-red-700 dark:bg-red-950'
                      }`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => updateUserStatus.mutate({
                          id: user.id,
                          status: user.status === 'active' ? 'suspended' : 'active',
                        })}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                          user.status === 'active'
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                        }`}>
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(usersRes?.data ?? []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No users found</div>
            )}
          </div>
        </div>
      )}

      {/* COURSE REVIEW */}
      {activeSection === 'courses' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            {(coursesRes?.data ?? []).length} courses pending review
          </p>
          {(coursesRes?.data ?? []).map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-xl p-5 flex gap-4">
              <img src={course.thumbnail_url ?? ''} alt={course.title}
                className="w-28 rounded-lg object-cover flex-shrink-0 bg-muted" style={{ aspectRatio: '16/9' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{course.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      by {course.instructor.name} · {course.category?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {course.lessons_count} lessons · {course.duration_hours}h ·{' '}
                      {course.pricing_type === 'free' ? 'Free' : formatPrice(course.price, 'USD')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={`/courses/${course.slug}`} target="_blank"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
                      title="Preview">
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => approveCourse.mutate(course.id)}
                      disabled={approveCourse.isPending}
                      className="flex items-center gap-1.5 h-8 px-3 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) rejectCourse.mutate({ id: course.id, reason });
                    }} className="flex items-center gap-1.5 h-8 px-3 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(coursesRes?.data ?? []).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No courses pending review</p>
            </div>
          )}
        </div>
      )}

      {/* REVIEWS */}
      {activeSection === 'reviews' && (
        <div className="space-y-3">
          {(reviewsRes?.data ?? []).map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <img src={review.user.avatar_url} alt={review.user.name} className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.title && <p className="font-medium text-sm">{review.title}</p>}
                    {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => moderateReview.mutate({ id: review.id, status: 'approved' })}
                    className="flex items-center gap-1 h-8 px-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded-lg text-xs hover:bg-emerald-200 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => moderateReview.mutate({ id: review.id, status: 'rejected' })}
                    className="flex items-center gap-1 h-8 px-3 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-lg text-xs hover:bg-red-200 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(reviewsRes?.data ?? []).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pending reviews</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
