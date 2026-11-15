'use client';
// app/(dashboard)/settings/page.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Bell, Globe, Shield, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState({
    email_new_course: true,
    email_lesson_reminder: true,
    email_certificate: true,
    push_messages: true,
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });

  const updateNotifs = useMutation({
    mutationFn: () => profileApi.updateNotifications(notifications),
    onSuccess: () => toast.success('Notification preferences saved'),
  });

  const changePassword = useMutation({
    mutationFn: () => profileApi.changePassword(passwordForm),
    onSuccess: () => {
      toast.success('Password changed. Please log in again.');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.errors?.current_password?.[0] ?? 'Failed to change password'),
  });

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-display font-bold">Settings</h1>

      {/* Appearance */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4" /> Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ].map((opt) => (
            <button key={opt.value} onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
              }`}>
              <opt.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { key: 'email_new_course', label: 'New course recommendations', desc: 'Get notified about courses matching your interests' },
            { key: 'email_lesson_reminder', label: 'Lesson reminders', desc: 'Reminders to continue your learning streak' },
            { key: 'email_certificate', label: 'Certificate ready', desc: 'When your completion certificate is generated' },
            { key: 'push_messages', label: 'Discussion replies', desc: 'When someone replies to your discussion posts' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) => setNotifications((p) => ({ ...p, [item.key]: e.target.checked }))}
                className="w-4 h-4 rounded accent-primary flex-shrink-0"
              />
            </label>
          ))}
        </div>
        <button onClick={() => updateNotifs.mutate()} disabled={updateNotifs.isPending}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-4">
          {updateNotifs.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Preferences
        </button>
      </section>

      {/* Password */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Change Password
        </h3>
        <div className="space-y-3">
          <input type="password" placeholder="Current password" value={passwordForm.current_password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="password" placeholder="New password" value={passwordForm.password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="password" placeholder="Confirm new password" value={passwordForm.password_confirmation}
            onChange={(e) => setPasswordForm((p) => ({ ...p, password_confirmation: e.target.value }))}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={() => changePassword.mutate()} disabled={changePassword.isPending || !passwordForm.current_password || !passwordForm.password}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-4">
          {changePassword.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          Update Password
        </button>
      </section>

      {/* Language */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Language
        </h3>
        <select
          defaultValue="en"
          onChange={(e) => {
            document.cookie = `locale=${e.target.value}; path=/; max-age=31536000`;
            window.location.reload();
          }}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
      </section>

      {/* Danger zone */}
      <section className="border border-destructive/30 rounded-xl p-5 bg-destructive/5">
        <h3 className="font-semibold text-sm mb-1 text-destructive">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
        <button className="h-9 px-4 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors">
          Delete Account
        </button>
      </section>
    </div>
  );
}
