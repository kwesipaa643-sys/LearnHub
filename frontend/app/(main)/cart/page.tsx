'use client';
// app/(main)/cart/page.tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, ArrowRight, BookOpen, Star, Clock } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, total, count } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">
          Looks like you haven't added any courses yet. Let's fix that!
        </p>
        <Link href="/courses"
          className="inline-flex items-center gap-2 h-11 px-7 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <BookOpen className="w-4 h-4" /> Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-display font-bold mb-2">Shopping Cart</h1>
      <p className="text-muted-foreground text-sm mb-8">{count()} course{count() !== 1 ? 's' : ''} in your cart</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Course list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ course, price }) => (
            <div key={course.id} className="flex gap-4 p-4 bg-card border border-border rounded-xl">
              <Link href={`/courses/${course.slug}`} className="flex-shrink-0">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title}
                    className="w-32 rounded-lg object-cover bg-muted"
                    style={{ aspectRatio: '16/9' }} />
                ) : (
                  <div className="w-32 bg-muted rounded-lg flex items-center justify-center"
                    style={{ aspectRatio: '16/9' }}>
                    <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/courses/${course.slug}`}
                  className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2 mb-1">
                  {course.title}
                </Link>
                <p className="text-xs text-muted-foreground mb-2">
                  by {course.instructor.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {course.rating_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {course.rating_avg.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration_hours}h
                  </span>
                  <span className="capitalize">{course.level}</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <button onClick={() => removeItem(course.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatPrice(price, course.currency)}</div>
                  {course.is_on_sale && course.price > price && (
                    <div className="text-xs text-muted-foreground line-through">
                      {formatPrice(course.price, course.currency)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-20">
            <h3 className="font-semibold mb-4">Order Summary</h3>

            <div className="space-y-2 text-sm mb-4">
              {items.map(({ course, price }) => (
                <div key={course.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2 flex-1">{course.title}</span>
                  <span className="flex-shrink-0">{formatPrice(price, 'USD')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mb-5">
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(total(), 'USD')}</span>
              </div>
            </div>

            <button onClick={handleCheckout}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link href="/courses"
              className="w-full h-10 mt-3 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-2">
              Continue Shopping
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-4">
              🔒 Secure checkout · 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
