'use client';
// app/(main)/courses/[slug]/page.tsx
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Star, Clock, Users, BookOpen, Award, Globe, Play,
  CheckCircle2, ChevronDown, ChevronRight, Lock, Loader2,
  ShoppingCart, Heart, Share2, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesApi, enrollmentApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { CourseSection, Lesson } from '@/types/api';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useState } from 'react';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { addItem, hasItem } = useCartStore();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'discussion'>('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => coursesApi.get(slug),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsApi.list(slug, { sort: 'newest' }),
    enabled: activeTab === 'reviews',
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentApi.enroll(course!.id),
    onSuccess: () => {
      toast.success('Enrolled successfully!');
      qc.invalidateQueries({ queryKey: ['course', slug] });
      router.push(`/learn/${slug}`);
    },
    onError: () => toast.error('Failed to enroll. Please try again.'),
  });

  if (isLoading) return <CourseDetailSkeleton />;
  const course = data?.data;
  if (!course) return <div>Course not found</div>;

  const isEnrolled = !!course.enrollment;
  const inCart = hasItem(course.id);
  const isFree = course.pricing_type === 'free';
  const isOwner = user?.id === course.instructor.id;

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const previewLessons = course.sections.flatMap((s) => s.lessons).filter((l) => l.is_preview);

  const handleEnroll = () => {
    if (!isAuthenticated) return router.push(`/login?redirect=/courses/${slug}`);
    if (isFree) return enrollMutation.mutate();
    // Paid: add to cart
    addItem(course);
    router.push('/cart');
  };

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
          <div className="lg:max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/categories/${course.category.slug}`} className="hover:text-white transition-colors">
                {course.category.name}
              </Link>
            </div>

            <h1 className="text-3xl lg:text-4xl font-display font-bold mb-3 leading-tight">{course.title}</h1>
            {course.subtitle && <p className="text-lg text-gray-300 mb-5">{course.subtitle}</p>}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-5">
              {course.rating_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-white">{course.rating_avg.toFixed(1)}</strong>
                  <span>({course.rating_count.toLocaleString()} ratings)</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {course.enrollments_count.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.duration_hours}h total
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {course.lessons_count} lessons
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {course.language.toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="capitalize">{course.level}</span>
              </span>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <img src={course.instructor.avatar_url} alt={course.instructor.name}
                className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm">
                Created by{' '}
                <Link href={`/instructors/${course.instructor.id}`}
                  className="text-indigo-400 hover:text-indigo-300 font-medium">
                  {course.instructor.name}
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:flex lg:gap-8">
        {/* LEFT — Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex border-b border-border mb-6 gap-1">
            {(['overview', 'curriculum', 'reviews', 'discussion'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* What you'll learn */}
              {course.what_you_learn?.length > 0 && (
                <div>
                  <h2 className="text-xl font-display font-bold mb-4">What you'll learn</h2>
                  <div className="grid sm:grid-cols-2 gap-2 p-5 bg-muted/40 rounded-xl border border-border">
                    {course.what_you_learn.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {course.description && (
                <div>
                  <h2 className="text-xl font-display font-bold mb-3">About this course</h2>
                  <div className="prose dark:prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: course.description }} />
                </div>
              )}

              {/* Requirements */}
              {course.requirements?.length > 0 && (
                <div>
                  <h2 className="text-xl font-display font-bold mb-3">Requirements</h2>
                  <ul className="space-y-1.5">
                    {course.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructor bio */}
              <div className="p-5 bg-card border border-border rounded-xl">
                <h2 className="text-lg font-display font-semibold mb-3">About the instructor</h2>
                <div className="flex items-start gap-4">
                  <img src={course.instructor.avatar_url} alt={course.instructor.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <Link href={`/instructors/${course.instructor.id}`}
                      className="font-semibold hover:text-primary transition-colors">
                      {course.instructor.name}
                    </Link>
                    {course.instructor.profile?.headline && (
                      <p className="text-muted-foreground text-sm">{course.instructor.profile.headline}</p>
                    )}
                    {course.instructor.profile?.bio && (
                      <p className="text-sm mt-2 text-muted-foreground line-clamp-3">{course.instructor.profile.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CURRICULUM TAB */}
          {activeTab === 'curriculum' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {course.sections.length} sections • {totalLessons} lessons • {course.duration_hours}h total
                </p>
              </div>

              {course.sections.map((section, idx) => (
                <div key={section.id} className="border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left">
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{section.lessons.length} lessons</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.has(idx) ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {expandedSections.has(idx) && (
                    <div className="divide-y divide-border">
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                          {lesson.is_preview || isEnrolled ? (
                            <Play className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm flex-1 truncate">{lesson.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lesson.is_preview && !isEnrolled && (
                              <span className="text-[10px] text-primary border border-primary/30 px-1.5 py-0.5 rounded">Preview</span>
                            )}
                            {lesson.duration_seconds > 0 && (
                              <span className="text-xs text-muted-foreground">{formatDuration(lesson.duration_seconds)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div>
              {/* Rating summary */}
              <div className="flex items-center gap-6 p-5 bg-muted/40 rounded-xl border border-border mb-6">
                <div className="text-center">
                  <div className="text-5xl font-display font-bold text-amber-500">
                    {course.reviews_summary.avg.toFixed(1)}
                  </div>
                  <div className="flex justify-center my-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(course.reviews_summary.avg) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">Course rating</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = course.reviews_summary.distribution[star] || 0;
                    const pct = course.reviews_summary.total ? (count / course.reviews_summary.total) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs w-2 text-right">{star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <div className="flex-1 progress-bar h-1.5">
                          <div className="progress-fill h-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews list */}
              <div className="space-y-4">
                {(reviewsData?.data ?? []).map((review) => (
                  <div key={review.id} className="p-4 border border-border rounded-xl">
                    <div className="flex items-start gap-3">
                      <img src={review.user.avatar_url} alt={review.user.name} className="w-9 h-9 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{review.user.name}</span>
                          <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex mt-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                          ))}
                        </div>
                        {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                        {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Purchase Card */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 mt-8 lg:mt-0">
          <div className="sticky top-20 bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            {/* Preview video or thumbnail */}
            {course.trailer_video ? (
              <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                <video src={course.trailer_video} controls className="w-full h-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors cursor-pointer">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-900 fill-current ml-1" />
                  </div>
                </div>
              </div>
            ) : course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full object-cover" style={{ aspectRatio: '16/9' }} />
            ) : null}

            <div className="p-5">
              {/* Price */}
              <div className="flex items-baseline gap-3 mb-1">
                {isFree ? (
                  <span className="text-3xl font-display font-bold text-emerald-600">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-display font-bold">
                      {formatPrice(course.effective_price, course.currency)}
                    </span>
                    {course.is_on_sale && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(course.price, course.currency)}
                      </span>
                    )}
                  </>
                )}
              </div>

              {course.is_on_sale && course.sale_ends_at && (
                <p className="text-xs text-red-500 mb-3">
                  Sale ends {new Date(course.sale_ends_at).toLocaleDateString()}
                </p>
              )}

              {/* CTA */}
              {isOwner ? (
                <Link href={`/instructor/courses/${course.id}/edit`}
                  className="w-full flex items-center justify-center h-11 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors mb-3">
                  Edit Course
                </Link>
              ) : isEnrolled ? (
                <Link href={`/learn/${slug}`}
                  className="w-full flex items-center justify-center h-11 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors mb-3">
                  Continue Learning
                </Link>
              ) : (
                <>
                  {!isFree && (
                    <button onClick={() => { addItem(course); toast.success('Added to cart!'); }}
                      className="w-full flex items-center justify-center gap-2 h-11 border border-primary text-primary rounded-lg font-medium text-sm hover:bg-primary/5 transition-colors mb-2">
                      <ShoppingCart className="w-4 h-4" />
                      {inCart ? 'Added to cart' : 'Add to cart'}
                    </button>
                  )}
                  <button onClick={handleEnroll} disabled={enrollMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mb-3">
                    {enrollMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Enrolling...</>
                    ) : isFree ? 'Enroll for Free' : 'Buy Now'}
                  </button>
                </>
              )}

              {/* Share */}
              <div className="flex gap-2 mb-4">
                <button className="flex-1 flex items-center justify-center gap-1.5 h-9 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Heart className="w-3.5 h-3.5" /> Wishlist
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 h-9 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>

              {/* Course includes */}
              <div className="text-sm space-y-2">
                <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">This course includes:</p>
                {[
                  [BookOpen, `${course.lessons_count} lessons`],
                  [Clock, `${course.duration_hours} hours of content`],
                  [Globe, 'Full lifetime access'],
                  ...(course.certificate_enabled ? [[Award, 'Certificate of completion']] : []),
                ].map(([Icon, text], i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{text as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-muted" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-8 bg-muted rounded w-2/3 mb-4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
