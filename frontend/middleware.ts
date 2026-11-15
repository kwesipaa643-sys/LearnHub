// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/my-courses',
  '/certificates',
  '/orders',
  '/profile',
  '/settings',
  '/learn',
  '/wishlist',
  '/checkout',
];

// Routes only for instructors
const INSTRUCTOR_ROUTES = ['/instructor'];

// Routes only for admins
const ADMIN_ROUTES = ['/admin'];

// Routes for guests only (redirect if logged in)
const GUEST_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Try to parse user from cookie (we store a minimal copy)
  let userRole: string | null = null;
  const userCookie = request.cookies.get('user_role')?.value;
  if (userCookie) userRole = userCookie;

  const isAuthenticated = Boolean(token);

  // Redirect authenticated users away from guest routes
  if (isAuthenticated && GUEST_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Instructor routes
  if (INSTRUCTOR_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (userRole && !['instructor', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Admin routes
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated || userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest.json).*)',
  ],
};
