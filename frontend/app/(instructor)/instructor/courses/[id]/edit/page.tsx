'use client';
// app/(instructor)/instructor/courses/[id]/edit/page.tsx
import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Save, Upload, Globe, Loader2, Eye, BookOpen,
  Plus, X, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { coursesApi, categoriesApi } from '@/lib/api';
import { useForm } from 'react-hook-form';

export default function CourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const qc = useQueryClient();
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const { data: courseRes, isLoading } = useQuery({
    queryKey: ['edit-course', courseId],
    queryFn: () => coursesApi.get(''),  // We'd fetch by ID — using slug placeholder
  });

  const { data: catsRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: Infinity,
  });

  const [learnItems, setLearnItems] = useState<string[]>(courseRes?.data?.what_you_learn ?? ['', '']);
  const [reqItems, setReqItems] = useState<string[]>(courseRes?.data?.requirements ?? ['']);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { isDirty } } = useForm({
    defaultValues: {
      title: courseRes?.data?.title ?? '',
      subtitle: courseRes?.data?.subtitle ?? '',
      description: courseRes?.data?.description ?? '',
      level: courseRes?.data?.level ?? 'all-levels',
      category_id: courseRes?.data?.category?.id ?? '',
      language: courseRes?.data?.language ?? 'en',
      pricing_type: courseRes?.data?.pricing_type ?? 'free',
      price: courseRes?.data?.price ?? '',
      sale_price: courseRes?.data?.sale_price ?? '',
      sale_ends_at: courseRes?.data?.sale_ends_at ?? '',
      certificate_enabled: courseRes?.data?.certificate_enabled ?? true,
    },
  });

  const pricingType = watch('pricing_type');

  const updateMutation = useMutation({
    mutationFn: (data: any) => coursesApi.update(courseId, { ...data, what_you_learn: learnItems.filter(Boolean), requirements: reqItems.filter(Boolean) }),
    onSuccess: () => { toast.success('Course saved!'); qc.invalidateQueries({ queryKey: ['edit-course', courseId] }); },
    onError: () => toast.error('Failed to save changes'),
  });

  const thumbnailMutation = useMutation({
    mutationFn: (file: File) => coursesApi.uploadThumbnail(courseId, file),
    onSuccess: (res) => { setThumbnailPreview(res.data.thumbnail_url); toast.success('Thumbnail updated!'); },
  });

  const publishMutation = useMutation({
    mutationFn: () => coursesApi.publish(courseId),
    onSuccess: () => { toast.success('Course submitted for review!'); qc.invalidateQueries({ queryKey: ['edit-course'] }); },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    thumbnailMutation.mutate(file);
  };

  const addItem = (items: string[], setItems: (v: string[]) => void) => setItems([...items, '']);
  const updateItem = (items: string[], setItems: (v: string[]) => void, idx: number, val: string) => {
    const next = [...items]; next[idx] = val; setItems(next);
  };
  const removeItem = (items: string[], setItems: (v: string[]) => void, idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">Edit Course</h1>
          <div className="flex items-center gap-2 mt-1">
            <Link href={`/instructor/courses/${id}/curriculum`}
              className="text-xs text-primary hover:underline">Curriculum</Link>
            <span className="text-muted-foreground text-xs">·</span>
            <Link href={`/courses/${courseRes?.data?.slug}`} target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" /> Preview
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}
            className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {publishMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            Publish
          </button>
          <button onClick={handleSubmit((d) => updateMutation.mutate(d))} disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        {/* Thumbnail */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Course Thumbnail</h3>
          <div className="flex gap-4">
            <div className="relative w-48 flex-shrink-0 bg-muted rounded-xl overflow-hidden cursor-pointer group"
              style={{ aspectRatio: '16/9' }} onClick={() => thumbnailRef.current?.click()}>
              {thumbnailPreview || courseRes?.data?.thumbnail_url ? (
                <img src={thumbnailPreview ?? courseRes?.data?.thumbnail_url ?? ''}
                  alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              {thumbnailMutation.isPending && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Upload thumbnail</p>
              <p>Recommended: 1280×720px (16:9)</p>
              <p>Max size: 5MB · JPG, PNG, WebP</p>
              <button type="button" onClick={() => thumbnailRef.current?.click()}
                className="mt-3 flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-xs hover:bg-muted transition-colors">
                <Upload className="w-3 h-3" /> Choose File
              </button>
              <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input {...register('title')} className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Subtitle</label>
            <input {...register('subtitle')} placeholder="Brief description shown in course listings"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea {...register('description')} rows={6} placeholder="What will students learn? Why should they take this course?"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select {...register('category_id')}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {(catsRes?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Level</label>
              <select {...register('level')}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {['all-levels', 'beginner', 'intermediate', 'advanced'].map((l) => (
                  <option key={l} value={l}>{l.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Language</label>
              <select {...register('language')}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {[['en', 'English'], ['fr', 'French'], ['es', 'Spanish'], ['ar', 'Arabic'], ['pt', 'Portuguese']].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* What you'll learn */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">What Students Will Learn</h3>
          <div className="space-y-2">
            {learnItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item} onChange={(e) => updateItem(learnItems, setLearnItems, i, e.target.value)}
                  placeholder={`Learning outcome ${i + 1}`}
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {learnItems.length > 1 && (
                  <button type="button" onClick={() => removeItem(learnItems, setLearnItems, i)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addItem(learnItems, setLearnItems)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Requirements</h3>
          <div className="space-y-2">
            {reqItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item} onChange={(e) => updateItem(reqItems, setReqItems, i, e.target.value)}
                  placeholder={`Requirement ${i + 1}`}
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {reqItems.length > 1 && (
                  <button type="button" onClick={() => removeItem(reqItems, setReqItems, i)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addItem(reqItems, setReqItems)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
              <Plus className="w-3.5 h-3.5" /> Add requirement
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Pricing</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Pricing Model</label>
            <select {...register('pricing_type')}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="free">Free</option>
              <option value="paid">Paid (one-time purchase)</option>
              <option value="subscription">Subscription only</option>
            </select>
          </div>
          {pricingType === 'paid' && (
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input {...register('price')} type="number" step="0.01" min="0"
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sale Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input {...register('sale_price')} type="number" step="0.01" min="0"
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sale Ends</label>
                <input {...register('sale_ends_at')} type="datetime-local"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Settings</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input {...register('certificate_enabled')} type="checkbox"
              className="w-4 h-4 rounded accent-primary" />
            <div>
              <p className="text-sm font-medium">Enable Certificate of Completion</p>
              <p className="text-xs text-muted-foreground">Students who complete 100% receive a PDF certificate</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={updateMutation.isPending}
            className="flex items-center gap-2 h-11 px-7 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <Link href={`/instructor/courses/${id}/curriculum`}
            className="flex items-center gap-2 h-11 px-7 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            <BookOpen className="w-4 h-4" /> Go to Curriculum →
          </Link>
        </div>
      </form>
    </div>
  );
}
