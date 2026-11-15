// components/layout/Footer.tsx
import Link from 'next/link';
import { BookOpen, Twitter, Github, Linkedin, Youtube } from 'lucide-react';

const links = {
  Learn: [
    { href: '/courses', label: 'All Courses' },
    { href: '/categories', label: 'Categories' },
    { href: '/instructors', label: 'Instructors' },
    { href: '/free-courses', label: 'Free Courses' },
  ],
  Teach: [
    { href: '/teach', label: 'Become an Instructor' },
    { href: '/instructor/dashboard', label: 'Instructor Dashboard' },
    { href: '/affiliate', label: 'Affiliate Program' },
    { href: '/resources', label: 'Teaching Resources' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/careers', label: 'Careers' },
    { href: '/press', label: 'Press' },
  ],
  Support: [
    { href: '/help', label: 'Help Center' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg">LearnHub</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Empowering learners worldwide with expert-led courses and a thriving community.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-3">{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LearnHub. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>🌍</span>
            <select
              className="bg-transparent text-sm text-muted-foreground border-none focus:outline-none cursor-pointer"
              onChange={(e) => {
                document.cookie = `locale=${e.target.value}; path=/; max-age=31536000`;
                window.location.reload();
              }}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
