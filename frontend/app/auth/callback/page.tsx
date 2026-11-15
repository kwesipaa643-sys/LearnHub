'use client';
// app/auth/callback/page.tsx
// Handles redirect from Laravel social OAuth
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export default function OAuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    const role  = params.get('role');
    const error = params.get('error');

    if (error) {
      toast.error('Social login failed. Please try again.');
      router.replace('/login');
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    // Store token then fetch user profile
    Cookies.set('auth_token', token, { expires: 30, sameSite: 'lax' });
    if (role) Cookies.set('user_role', role, { expires: 30 });

    authApi.me()
      .then((res) => {
        setAuth(res.data, token);
        toast.success(`Welcome, ${res.data.name}!`);
        router.replace(role === 'instructor' ? '/instructor/dashboard' : '/dashboard');
      })
      .catch(() => {
        Cookies.remove('auth_token');
        toast.error('Authentication failed. Please try again.');
        router.replace('/login');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
