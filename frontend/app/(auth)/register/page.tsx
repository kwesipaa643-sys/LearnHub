'use client';
// app/(auth)/register/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, BookOpen, CheckCircle2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  password_confirmation: z.string(),
  role: z.enum(['student', 'instructor']),
  terms: z.boolean().refine(Boolean, 'You must accept the terms'),
}).refine((d) => d.password === d.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student' },
  });

  const password = watch('password', '');
  const role = watch('role');

  const passwordChecks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: data.role,
      });
      setAuth(res.data.user, res.data.token);
      Cookies.set('user_role', res.data.user.role, { expires: 30 });
      toast.success('Account created! Please check your email to verify.');
      router.push(data.role === 'instructor' ? '/instructor/dashboard' : '/dashboard');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors?.email) toast.error(errors.email[0]);
      else toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-display font-bold">LearnHub</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-display font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6">Start learning or teaching today — free forever</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['student', 'instructor'] as const).map((r) => (
              <label key={r} className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                role === r ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
              }`}>
                <input {...register('role')} type="radio" value={r} className="sr-only" />
                <span className="text-2xl">{r === 'student' ? '🎓' : '🧑‍🏫'}</span>
                <span className="font-medium text-sm capitalize">{r}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {r === 'student' ? 'Learn new skills' : 'Share your knowledge'}
                </span>
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full name</label>
              <input
                {...register('name')}
                type="text"
                autoComplete="name"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Jane Doe"
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-11 px-4 pr-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((c) => (
                    <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      <CheckCircle2 className={`w-3 h-3 ${c.ok ? 'fill-emerald-600 dark:fill-emerald-400' : ''}`} />
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm password</label>
              <input
                {...register('password_confirmation')}
                type={showPassword ? 'text' : 'password'}
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Repeat your password"
              />
              {errors.password_confirmation && (
                <p className="text-destructive text-xs mt-1">{errors.password_confirmation.message}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input {...register('terms')} type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border accent-primary" />
              <span className="text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && <p className="text-destructive text-xs">{errors.terms.message}</p>}

            <button type="submit" disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
