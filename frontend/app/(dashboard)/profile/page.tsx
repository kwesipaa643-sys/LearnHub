'use client';
// app/(dashboard)/profile/page.tsx
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Twitter, Linkedin, Github, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

const profileSchema = z.object({
  name: z.string().min(2),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  timezone: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      headline: user?.profile?.headline ?? '',
      bio: user?.profile?.bio ?? '',
      website: user?.profile?.website ?? '',
      twitter: user?.profile?.twitter ?? '',
      linkedin: user?.profile?.linkedin ?? '',
      github: user?.profile?.github ?? '',
      timezone: user?.profile?.timezone ?? 'UTC',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => profileApi.update(data),
    onSuccess: (res) => {
      setUser(res.data);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (res) => {
      setUser({ ...user!, avatar_url: res.data.avatar_url });
      toast.success('Avatar updated!');
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file);
  };

  const timezones = Intl.supportedValuesOf('timeZone');

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <img
            src={avatarPreview ?? user?.avatar_url}
            alt={user?.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-border"
          />
          {uploadAvatar.isPending && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm">
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input {...register('name')}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Headline</label>
            <input {...register('headline')} placeholder="e.g. Senior Laravel Developer"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Bio</label>
          <textarea {...register('bio')} rows={4} placeholder="Tell us about yourself..."
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Timezone</label>
          <select {...register('timezone')}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Social Links</h3>
          {[
            { field: 'website', icon: Globe, placeholder: 'https://yoursite.com' },
            { field: 'twitter', icon: Twitter, placeholder: '@yourusername' },
            { field: 'linkedin', icon: Linkedin, placeholder: 'linkedin.com/in/you' },
            { field: 'github', icon: Github, placeholder: 'github.com/you' },
          ].map(({ field, icon: Icon, placeholder }) => (
            <div key={field} className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input {...register(field as keyof ProfileForm)} placeholder={placeholder}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
        </div>

        <button type="submit" disabled={!isDirty || updateProfile.isPending}
          className="flex items-center gap-2 h-10 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
