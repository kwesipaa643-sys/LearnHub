<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

class Course extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'slug',
        'subtitle',
        'description',
        'what_you_learn',
        'requirements',
        'for_whom',
        'thumbnail',
        'trailer_video',
        'level',
        'status',
        'pricing_type',
        'price',
        'sale_price',
        'sale_ends_at',
        'currency',
        'language',
        'is_featured',
        'certificate_enabled',
        'duration_hours',
        'lessons_count',
        'enrollments_count',
        'rating_avg',
        'rating_count',
        'meta',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'what_you_learn' => 'array',
            'requirements' => 'array',
            'for_whom' => 'array',
            'meta' => 'array',
            'is_featured' => 'boolean',
            'certificate_enabled' => 'boolean',
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'sale_ends_at' => 'datetime',
            'published_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // ============================================================
    // BOOT - Auto-generate slug
    // ============================================================

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Course $course) {
            if (empty($course->slug)) {
                $course->slug = Str::slug($course->title);
                // Ensure uniqueness
                $count = static::whereRaw("slug RLIKE '^{$course->slug}(-[0-9]+)?$'")->count();
                if ($count > 0) {
                    $course->slug = "{$course->slug}-{$count}";
                }
            }
        });
    }

    // ============================================================
    // RELATIONSHIPS
    // ============================================================

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sort_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('status', 'approved');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'course_tags');
    }

    public function liveClasses(): HasMany
    {
        return $this->hasMany(LiveClass::class);
    }

    public function discussions(): HasMany
    {
        return $this->hasMany(Discussion::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function coupons(): BelongsToMany
    {
        return $this->belongsToMany(Coupon::class, 'coupon_courses');
    }

    // ============================================================
    // SCOPES
    // ============================================================

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeForLevel(Builder $query, string $level): Builder
    {
        return $query->where('level', $level);
    }

    public function scopeByCategory(Builder $query, string $categorySlug): Builder
    {
        return $query->whereHas('category', fn($q) => $q->where('slug', $categorySlug));
    }

    public function scopeByPriceType(Builder $query, string $type): Builder
    {
        return $query->where('pricing_type', $type);
    }

    public function scopeWithinPriceRange(Builder $query, float $min, float $max): Builder
    {
        return $query->whereBetween('price', [$min, $max]);
    }

    public function scopeWithMinRating(Builder $query, float $rating): Builder
    {
        return $query->where('rating_avg', '>=', $rating);
    }

    public function scopePopular(Builder $query): Builder
    {
        return $query->orderByDesc('enrollments_count');
    }

    // ============================================================
    // ACCESSORS
    // ============================================================

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail
            ? \Storage::url($this->thumbnail)
            : null;
    }

    public function getEffectivePriceAttribute(): float
    {
        if ($this->sale_price && $this->sale_ends_at && $this->sale_ends_at->isFuture()) {
            return (float) $this->sale_price;
        }

        return (float) $this->price;
    }

    public function getIsOnSaleAttribute(): bool
    {
        return $this->sale_price !== null
            && $this->sale_ends_at !== null
            && $this->sale_ends_at->isFuture();
    }

    // ============================================================
    // SCOUT SEARCHABLE
    // ============================================================

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => strip_tags($this->description ?? ''),
            'level' => $this->level,
            'pricing_type' => $this->pricing_type,
            'price' => $this->price,
            'rating_avg' => $this->rating_avg,
            'enrollments_count' => $this->enrollments_count,
            'language' => $this->language,
            'category' => $this->category?->name,
            'instructor' => $this->instructor?->name,
            'status' => $this->status,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published';
    }

    // ============================================================
    // HELPERS
    // ============================================================

    /**
     * Recalculate and update denormalized stats
     */
    public function recalculateStats(): void
    {
        $totalSeconds = $this->lessons()->sum('duration_seconds');

        $this->update([
            'lessons_count' => $this->lessons()->where('is_published', true)->count(),
            'duration_hours' => (int) ceil($totalSeconds / 3600),
            'enrollments_count' => $this->enrollments()->where('status', 'active')->count(),
            'rating_avg' => $this->reviews()->avg('rating') ?? 0,
            'rating_count' => $this->reviews()->count(),
        ]);
    }

    /**
     * Get rating distribution (1-5 stars with counts)
     */
    public function getRatingDistribution(): array
    {
        $distribution = [];
        for ($i = 5; $i >= 1; $i--) {
            $distribution[$i] = $this->reviews()->where('rating', $i)->count();
        }

        return $distribution;
    }
}
