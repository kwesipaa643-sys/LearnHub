'use client';
// app/(instructor)/instructor/courses/new/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { coursesApi, categoriesApi } from '@/lib/api';

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  category_id: z.coerce.number().min(1, 'Select a category'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all-levels']),
  pricing_type: z.enum(['free', 'paid', 'subscription']),
  price: z.coerce.number().min(0).optional(),
  language: z.string().default('en'),
});
type FormData = z.infer<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { data: catsRes } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { level: 'all-levels', pricing_type: 'free', language: 'en' },
  });

  const pricingType = watch('pricing_type');

  const createMutation = useMutation({
    mutationFn: (data: FormData) => coursesApi.create(data as any),
    onSuccess: (res) => {
      toast.success('Course created! Now add your content.');
      router.push(`/instructor/courses/${res.data.id}/edit`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create course'),
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">Create New Course</h1>
        <p className="text-muted-foreground text-sm mt-1">Start with the basics — you can edit everything later.</p>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-5">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Course Title <span className="text-destructive">*</span></label>
            <input {...register('title')} placeholder="e.g. Complete Laravel 11: Build Production Apps"
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Make it descriptive and searchable</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category <span className="text-destructive">*</span></label>
              <select {...register('category_id')}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select category</option>
                {(catsRes?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-destructive text-xs mt-1">{errors.category_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Level</label>
              <select {...register('level')}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {['all-levels', 'beginner', 'intermediate', 'advanced'].map((l) => (
                  <option key={l} value={l} className="capitalize">{l.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Pricing</label>
              <select {...register('pricing_type')}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="free">Free</option>
                <option value="paid">Paid (one-time)</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            {pricingType === 'paid' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input {...register('price')} type="number" step="0.01" min="0"
                    placeholder="29.99"
                    className="w-full h-11 pl-7 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Language</label>
              <select {...register('language')}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="ar">Arabic</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={createMutation.isPending}
          className="flex items-center gap-2 h-11 px-7 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Create & Continue
        </button>
      </form>
    </div>
  );
}
