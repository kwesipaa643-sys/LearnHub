// app/(main)/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Star, Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import { coursesApi, categoriesApi } from '@/lib/api';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseSummary, Category } from '@/types/api';

async function getFeaturedData() {
  try {
    const [coursesRes, categoriesRes] = await Promise.all([
      coursesApi.featured(),
      categoriesApi.list(),
    ]);
    return {
      courses: coursesRes.data ?? [],
      categories: categoriesRes.data ?? [],
    };
  } catch {
    return { courses: [], categories: [] };
  }
}

export default async function HomePage() {
  const { courses, categories } = await getFeaturedData();

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6 border border-white/20">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-indigo-100">Join 50,000+ learners worldwide</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Learn Without
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300"> Limits</span>
            </h1>

            <p className="text-xl text-indigo-100 mb-8 max-w-2xl leading-relaxed">
              Expert-led courses in development, design, business, and more.
              Build real skills at your own pace, earn certificates, and advance your career.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/courses"
                className="inline-flex items-center gap-2 h-12 px-7 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
                Explore courses
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register?role=instructor"
                className="inline-flex items-center gap-2 h-12 px-7 bg-white/10 backdrop-blur-sm border border-white/20 font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm">
                <Play className="w-4 h-4 fill-current" />
                Become an instructor
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { icon: BookOpen, value: '1,200+', label: 'Expert courses' },
                { icon: Users, value: '50K+', label: 'Active learners' },
                { icon: Star, value: '4.9★', label: 'Average rating' },
                { icon: Award, value: '25K+', label: 'Certificates issued' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg">{stat.value}</div>
                    <div className="text-indigo-300 text-xs">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold">Browse by Category</h2>
              <p className="text-muted-foreground text-sm mt-1">Explore our most popular learning paths</p>
            </div>
            <Link href="/categories" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              All categories <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 12).map((cat: Category) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all group text-center">
                <div className="text-3xl">{cat.icon || '📚'}</div>
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold">Featured Courses</h2>
              <p className="text-muted-foreground text-sm mt-1">Hand-picked by our team</p>
            </div>
            <Link href="/courses?featured=1" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {courses.map((course: CourseSummary) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* BECOME INSTRUCTOR CTA */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl font-display font-bold mb-4">Share Your Expertise</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Join thousands of instructors teaching on LearnHub. Earn money, build your brand,
            and impact learners worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register?role=instructor"
              className="inline-flex items-center gap-2 h-12 px-7 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
              Start teaching today
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/instructor"
              className="inline-flex items-center gap-2 h-12 px-7 bg-white/10 border border-white/20 font-medium rounded-xl hover:bg-white/20 transition-colors text-sm">
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
