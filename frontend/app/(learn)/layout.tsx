// app/(learn)/layout.tsx
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {children}
    </div>
  );
}

// ─── app/not-found.tsx ────────────────────────────────────────
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <div className="text-8xl font-display font-black text-muted-foreground/20 mb-4">404</div>
        <h1 className="text-2xl font-display font-bold mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/"
          className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          <BookOpen className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}

// ─── app/loading.tsx ──────────────────────────────────────────
export function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
