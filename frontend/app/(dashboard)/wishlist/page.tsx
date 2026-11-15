'use client';
// app/(dashboard)/wishlist/page.tsx
import { useQuery } from '@tanstack/react-query';
import { Heart, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { wishlistApi } from '@/lib/api';
import { CourseCard } from '@/components/course/CourseCard';

export default function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.list(),
  });

  const courses = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-display font-bold">My Wishlist</h1>
        {courses.length > 0 && (
          <span className="text-sm text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {courses.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="shimmer bg-muted" style={{ aspectRatio: '16/9' }} />
              <div className="p-4 space-y-2">
                <div className="shimmer h-3 w-1/3 rounded" />
                <div className="shimmer h-4 w-full rounded" />
                <div className="shimmer h-4 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard key={course.id} course={{ ...course, is_wishlisted: true }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-5">
            <Heart className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Save courses you're interested in and come back to them later.
          </p>
          <Link href="/courses"
            className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <BookOpen className="w-4 h-4" /> Explore Courses
          </Link>
        </div>
      )}
    </div>
  );
}
