'use client';
// components/course/CourseCard.tsx
import Link from 'next/link';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { CourseSummary } from '@/types/api';
import { WishlistButton } from './WishlistButton';
import { formatPrice, formatDuration } from '@/lib/utils';

interface Props {
  course: CourseSummary;
  showProgress?: boolean;
  progressPercent?: number;
}

export function CourseCard({ course, showProgress, progressPercent }: Props) {
  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col">
      {/* Thumbnail */}
      <Link href={`/courses/${course.slug}`} className="relative block overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        {course.is_on_sale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            SALE
          </span>
        )}
        {course.is_featured && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            FEATURED
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & Level */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full truncate">
            {course.category.name}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">{course.level}</span>
        </div>

        {/* Title */}
        <Link href={`/courses/${course.slug}`}
          className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors mb-2 flex-1">
          {course.title}
        </Link>

        {/* Instructor */}
        <p className="text-xs text-muted-foreground mb-3">
          by <span className="hover:text-foreground transition-colors">{course.instructor.name}</span>
        </p>

        {/* Progress bar (in My Courses context) */}
        {showProgress && progressPercent !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {/* Rating & Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {course.rating_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{course.rating_avg.toFixed(1)}</span>
              <span>({course.rating_count})</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {course.enrollments_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration_hours}h
          </span>
        </div>

        {/* Price & Wishlist */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {course.pricing_type === 'free' ? (
              <span className="text-emerald-600 font-bold text-sm">Free</span>
            ) : (
              <>
                <span className="font-bold text-sm">
                  {formatPrice(course.effective_price, course.currency)}
                </span>
                {course.is_on_sale && course.price > course.effective_price && (
                  <span className="text-muted-foreground line-through text-xs">
                    {formatPrice(course.price, course.currency)}
                  </span>
                )}
              </>
            )}
          </div>
          <WishlistButton courseId={course.id} initialState={course.is_wishlisted} />
        </div>
      </div>
    </div>
  );
}
