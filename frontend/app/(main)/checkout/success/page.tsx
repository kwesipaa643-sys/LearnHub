'use client';
// app/(main)/checkout/success/page.tsx
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cartStore';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-3">Payment Successful! 🎉</h1>
        <p className="text-muted-foreground mb-2">
          Your order #{orderId} has been confirmed. You're now enrolled in your courses.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          A confirmation email has been sent to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            <BookOpen className="w-4 h-4" /> Start Learning
          </Link>
          <Link href="/courses"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors">
            Browse More Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
