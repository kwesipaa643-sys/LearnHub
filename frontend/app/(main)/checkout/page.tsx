'use client';
// app/(main)/checkout/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShoppingCart, Tag, Loader2, CheckCircle2, Lock, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { paymentsApi } from '@/lib/api';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? 'Payment failed');
      setPaying(false);
    } else {
      clearCart();
      toast.success('Payment successful! 🎉');
      router.push(`/checkout/success?order=${orderId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Payment Details
        </h3>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <button type="submit" disabled={paying || !stripe || !elements}
        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {paying ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : (
          <><Lock className="w-4 h-4" />Pay Now</>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> Secured by Stripe. Your payment info is encrypted.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem, total, clearCart } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number; final_total: number } | null>(null);
  const [checkoutData, setCheckoutData] = useState<{ clientSecret: string; orderId: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login?redirect=/checkout');
  }, [isAuthenticated]);

  const validateCouponMutation = useMutation({
    mutationFn: () => paymentsApi.validateCoupon(couponCode, items.map((i) => i.course.id)),
    onSuccess: (res) => {
      setAppliedCoupon({
        code: couponCode,
        discount_amount: res.data.discount_amount,
        final_total: res.data.final_total,
      });
      toast.success(`Coupon applied! You saved ${formatPrice(res.data.discount_amount, 'USD')}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Invalid coupon'),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => paymentsApi.checkout({
      items: items.map((i) => ({ course_id: i.course.id })),
      coupon_code: appliedCoupon?.code,
    }),
    onSuccess: (res) => {
      if (res.data.free) {
        clearCart();
        toast.success('Enrolled successfully!');
        router.push('/dashboard');
        return;
      }
      if (res.data.client_secret) {
        setCheckoutData({ clientSecret: res.data.client_secret, orderId: res.data.order_id });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Checkout failed'),
  });

  if (items.length === 0 && !checkoutData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some courses and come back here.</p>
        <Link href="/courses" className="h-11 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center">
          Browse Courses
        </Link>
      </div>
    );
  }

  const subtotal = total();
  const discount = appliedCoupon?.discount_amount ?? 0;
  const finalTotal = appliedCoupon?.final_total ?? subtotal;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-display font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* LEFT — Order summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.course.id} className="flex gap-3">
                  <img src={item.course.thumbnail_url ?? ''} alt={item.course.title}
                    className="w-16 rounded-lg object-cover flex-shrink-0" style={{ aspectRatio: '16/9' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.course.title}</p>
                    <p className="text-sm font-bold mt-1">{formatPrice(item.price, 'USD')}</p>
                  </div>
                  {!checkoutData && (
                    <button onClick={() => removeItem(item.course.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors h-fit">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Coupon */}
            {!checkoutData && (
              <div className="border-t border-border pt-4 mb-4">
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring uppercase" />
                  <button onClick={() => validateCouponMutation.mutate()}
                    disabled={!couponCode || validateCouponMutation.isPending}
                    className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1">
                    {validateCouponMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between mt-2 text-xs text-emerald-600">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{appliedCoupon.code} applied</span>
                    <button onClick={() => setAppliedCoupon(null)} className="hover:text-destructive">Remove</button>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, 'USD')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount, 'USD')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'USD')}</span>
              </div>
            </div>
          </div>

          {/* 30-day guarantee */}
          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm">
            <p className="font-semibold text-emerald-800 dark:text-emerald-400 mb-1">30-Day Money-Back Guarantee</p>
            <p className="text-emerald-700 dark:text-emerald-500 text-xs">
              Not satisfied? Get a full refund within 30 days, no questions asked.
            </p>
          </div>
        </div>

        {/* RIGHT — Payment */}
        <div className="lg:col-span-3">
          {checkoutData ? (
            <Elements stripe={stripePromise} options={{
              clientSecret: checkoutData.clientSecret,
              appearance: { theme: 'stripe', variables: { colorPrimary: '#6366f1' } },
            }}>
              <CheckoutForm clientSecret={checkoutData.clientSecret} orderId={checkoutData.orderId} />
            </Elements>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6">Payment Method</h3>
              <button onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {checkoutMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                  : <><Lock className="w-4 h-4" />Proceed to Payment — {formatPrice(finalTotal, 'USD')}</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
