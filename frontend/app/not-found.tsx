// app/not-found.tsx
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center bg-background">
      <div>
        <div className="text-9xl font-display font-black text-muted-foreground/10 mb-4 select-none">404</div>
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/"
            className="h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors inline-flex items-center">
            Go Home
          </Link>
          <Link href="/courses"
            className="h-11 px-6 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors inline-flex items-center">
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
