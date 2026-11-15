'use client';
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';

function AuthInit({ children }: { children: React.ReactNode }) {
  const { setUser, setAuth, logout, token } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // Re-validate token on app load
    const cookieToken = Cookies.get('auth_token');
    if (cookieToken) {
      authApi.me()
        .then((res) => {
          setUser(res.data);
          // Store role in cookie for middleware
          Cookies.set('user_role', res.data.role, { expires: 30 });
        })
        .catch(() => {
          logout();
        });
    }
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 min
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthInit>
          {children}
        </AuthInit>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
        <ServiceWorkerRegister />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
