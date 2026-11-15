'use client';
// components/shared/StarRating.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRating({ value = 0, onChange, readonly = false, size = 'md', showValue = false }: Props) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <Star className={`${sizes[size]} transition-colors ${
              filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
            }`} />
          </button>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

// components/shared/EmptyState.tsx
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
        {emoji ? (
          <span className="text-4xl">{emoji}</span>
        ) : Icon ? (
          <Icon className="w-10 h-10 text-muted-foreground/30" />
        ) : null}
      </div>
      <h3 className="font-display font-bold text-xl mb-2">{title}</h3>
      {description && <p className="text-muted-foreground text-sm mb-6 max-w-sm">{description}</p>}
      {action && (
        action.href ? (
          <Link href={action.href}
            className="h-11 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick}
            className="h-11 px-6 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

// components/shared/LoadingSpinner.tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };
  return (
    <div className={`inline-block rounded-full border-primary/20 border-t-primary animate-spin ${sizes[size]} ${className}`} />
  );
}

// components/shared/UserAvatar.tsx
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  if (src) {
    return (
      <img src={src} alt={name}
        className={`rounded-full object-cover flex-shrink-0 ${sizes[size]} ${className}`} />
    );
  }

  return (
    <div className={`rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
}

// components/shared/CategoryBadge.tsx
interface CategoryBadgeProps {
  name: string;
  color?: string;
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {name}
    </span>
  );
}

// components/shared/SearchBar.tsx
import { Search, X } from 'lucide-react';
import { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-9 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      />
      {value && (
        <button onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
