'use client';
// app/(main)/courses/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, Loader2, Grid3X3, List } from 'lucide-react';
import { coursesApi, categoriesApi } from '@/lib/api';
import { CourseCard } from '@/components/course/CourseCard';
import { CourseSummary } from '@/types/api';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all-levels'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
    price_type: searchParams.get('price_type') || '',
    sort: searchParams.get('sort') || 'popular',
    page: Number(searchParams.get('page')) || 1,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: Infinity,
  });

  const { data: coursesRes, isLoading, isFetching } = useQuery({
    queryKey: ['courses', filters],
    queryFn: () => coursesApi.list(Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== 0)
    )),
    placeholderData: (prev) => prev,
  });

  const updateFilter = useCallback((key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  }, []);

  const clearFilter = (key: string) => updateFilter(key, '');

  const activeFilterCount = [filters.category, filters.level, filters.price_type].filter(Boolean).length;
  const courses: CourseSummary[] = coursesRes?.data ?? [];
  const meta = coursesRes?.meta;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">All Courses</h1>
          {meta && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {meta.total.toLocaleString()} courses available
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* View mode */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={`w-9 h-9 flex items-center justify-center text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`w-9 h-9 flex items-center justify-center text-sm transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter toggle (mobile) */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden relative flex items-center gap-2 h-9 px-3 rounded-lg border border-border hover:bg-muted text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* SIDEBAR FILTERS */}
        <aside className={`w-64 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-card border border-border rounded-xl p-5 sticky top-20 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={() => setFilters((p) => ({ ...p, category: '', level: '', price_type: '' }))}
                  className="text-xs text-primary hover:underline">
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Keywords..."
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Price Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Price</label>
              <div className="space-y-1.5">
                {[{ value: '', label: 'All' }, { value: 'free', label: 'Free' }, { value: 'paid', label: 'Paid' }].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="price_type" value={opt.value}
                      checked={filters.price_type === opt.value}
                      onChange={() => updateFilter('price_type', opt.value)}
                      className="accent-primary" />
                    <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Level</label>
              <div className="space-y-1.5">
                {['', ...LEVELS].map((l) => (
                  <label key={l} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="level" value={l}
                      checked={filters.level === l}
                      onChange={() => updateFilter('level', l)}
                      className="accent-primary" />
                    <span className="text-sm group-hover:text-foreground text-muted-foreground capitalize transition-colors">
                      {l || 'All Levels'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Category</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                {(categoriesRes?.data ?? []).map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="category" value={cat.slug}
                      checked={filters.category === cat.slug}
                      onChange={() => updateFilter('category', cat.slug)}
                      className="accent-primary" />
                    <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors truncate">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* COURSE GRID */}
        <div className="flex-1 min-w-0">
          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.level && (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-primary/10 text-primary text-xs rounded-full">
                  {filters.level}
                  <button onClick={() => clearFilter('level')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.price_type && (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-primary/10 text-primary text-xs rounded-full capitalize">
                  {filters.price_type}
                  <button onClick={() => clearFilter('price_type')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-primary/10 text-primary text-xs rounded-full">
                  {categoriesRes?.data.find((c) => c.slug === filters.category)?.name || filters.category}
                  <button onClick={() => clearFilter('category')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className={`grid gap-5 ${viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="shimmer bg-muted" style={{ aspectRatio: '16/9' }} />
                  <div className="p-4 space-y-2">
                    <div className="shimmer h-3 w-1/3 rounded" />
                    <div className="shimmer h-4 w-full rounded" />
                    <div className="shimmer h-4 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Courses */}
          {!isLoading && courses.length > 0 && (
            <>
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {courses.map((course) => <CourseCard key={course.id} course={course} />)}
              </div>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => updateFilter('page', p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === p
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border hover:bg-muted'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!isLoading && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-semibold text-lg mb-2">No courses found</h3>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters or search terms</p>
              <button onClick={() => setFilters((p) => ({ ...p, search: '', category: '', level: '', price_type: '' }))}
                className="text-primary text-sm hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
