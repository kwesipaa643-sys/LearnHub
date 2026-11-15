'use client';
// components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  BookOpen, Search, ShoppingCart, Bell, Sun, Moon, Menu, X,
  ChevronDown, GraduationCap, LayoutDashboard, LogOut, Settings, User,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.count());
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      router.push('/');
      toast.success('Logged out successfully');
    }
  };

  const navLinks = [
    { href: '/courses', label: 'Courses' },
    { href: '/categories', label: 'Categories' },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-shadow bg-background/95 backdrop-blur-sm ${scrolled ? 'shadow-sm border-b border-border' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold hidden sm:block">LearnHub</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 hidden sm:block max-w-xs">
            <Link href="/courses" className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:border-ring transition-colors">
              <Search className="w-3.5 h-3.5" />
              Search courses...
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle */}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Link href="/dashboard" className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <Bell className="w-4 h-4" />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted transition-colors">
                    <img src={user.avatar_url} alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-border" />
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-20 py-2">
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <div className="font-medium text-sm truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>

                        {['instructor', 'admin'].includes(user.role) && (
                          <Link href={user.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            {user.role === 'admin' ? 'Admin Panel' : 'Instructor Dashboard'}
                          </Link>
                        )}

                        <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                          My Learning
                        </Link>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                          <User className="w-4 h-4 text-muted-foreground" />
                          Profile
                        </Link>
                        <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          Settings
                        </Link>

                        <div className="border-t border-border mt-1 pt-1">
                          <button onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left">
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"
                  className="h-9 px-4 text-sm font-medium rounded-lg hover:bg-muted transition-colors flex items-center">
                  Sign in
                </Link>
                <Link href="/register"
                  className="h-9 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center">
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted">
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-border pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
