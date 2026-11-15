'use client';
// app/(instructor)/instructor/earnings/page.tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Clock, Download, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { instructorApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function InstructorEarningsPage() {
  const { data: dashRes } = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: () => instructorApi.dashboard(),
  });

  const { data: earningsRes, isLoading } = useQuery({
    queryKey: ['instructor-earnings'],
    queryFn: () => instructorApi.earnings(),
  });

  const payoutMutation = useMutation({
    mutationFn: () => instructorApi.earnings(), // placeholder — would call payout endpoint
    onSuccess: () => toast.success('Payout request submitted!'),
  });

  const stats = dashRes?.data;
  const earnings = (earningsRes?.data as any[]) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Earnings</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: stats ? formatPrice(stats.total_revenue, 'USD') : '—', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Pending Payout', value: stats ? formatPrice(stats.pending_payout, 'USD') : '—', icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
          { label: 'This Month', value: stats?.monthly_revenue?.length ? formatPrice(stats.monthly_revenue[stats.monthly_revenue.length - 1]?.amount ?? 0, 'USD') : '$0', icon: TrendingUp, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-display font-bold">{s.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payout request */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="font-semibold text-sm">Request a Payout</p>
            <p className="text-xs text-muted-foreground">Processed within 5-7 business days</p>
          </div>
        </div>
        <button onClick={() => payoutMutation.mutate()}
          className="h-9 px-5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Request Payout
        </button>
      </div>

      {/* Revenue chart */}
      {(stats?.monthly_revenue ?? []).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Revenue by Month</h3>
          <ResponsiveContainer width="100%" height={240}>
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

      {/* Earnings table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold">Earnings History</h3>
          <button className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-xs hover:bg-muted transition-colors">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gross</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net (70%)</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {earnings.map((row: any, i: number) => (
              <tr key={i}>
                <td className="px-4 py-3">{row.period}</td>
                <td className="px-4 py-3 text-right">{formatPrice(row.gross, 'USD')}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(row.net, 'USD')}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{row.sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && earnings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No earnings yet</div>
        )}
      </div>
    </div>
  );
}
