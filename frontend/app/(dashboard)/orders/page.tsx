'use client';
// app/(dashboard)/orders/page.tsx
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Download, ExternalLink } from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function OrdersPage() {
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => paymentsApi.orders(),
  });

  const orders = ordersRes?.data ?? [];

  const statusColor: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    refunded: 'bg-muted text-muted-foreground',
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Order History</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl shimmer" />)}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor[order.status] ?? ''}`}>
                    {order.status}
                  </span>
                  <span className="font-bold">{formatPrice(order.total, order.currency)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.course?.thumbnail_url ?? ''} alt={item.course_title}
                      className="w-12 h-8 rounded object-cover bg-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.course_title}</p>
                    </div>
                    <span className="text-sm font-medium flex-shrink-0">
                      {formatPrice(item.price, item.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                {order.status === 'completed' && (
                  <a href={paymentsApi.invoice(order.id)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-xs hover:bg-muted transition-colors">
                    <Download className="w-3 h-3" /> Invoice
                  </a>
                )}
                {order.items?.[0]?.course && (
                  <Link href={`/courses/${order.items[0].course_title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-xs hover:bg-muted transition-colors">
                    <ExternalLink className="w-3 h-3" /> View Course
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg mb-2">No orders yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Your purchase history will appear here.</p>
          <Link href="/courses"
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
