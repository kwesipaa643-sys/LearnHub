<?php
// ============================================================
// REMAINING MODELS — Place each in app/Models/
// ============================================================

// ---- UserProfile.php ----
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id', 'bio', 'headline', 'website', 'twitter', 'linkedin',
        'youtube', 'github', 'timezone', 'language', 'phone', 'country',
        'preferences', 'revenue_share', 'payout_email', 'payout_info',
    ];

    protected function casts(): array
    {
        return ['preferences' => 'array', 'payout_info' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// ---- Category.php ----
class Category extends Model
{
    protected $fillable = ['name', 'slug', 'icon', 'color', 'description', 'parent_id', 'sort_order', 'is_featured'];

    protected function casts(): array
    {
        return ['is_featured' => 'boolean'];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
}

// ---- CourseSection.php ----
class CourseSection extends Model
{
    protected $fillable = ['course_id', 'title', 'description', 'sort_order'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class, 'section_id')->orderBy('sort_order');
    }
}

// ---- Lesson.php ----
class Lesson extends Model
{
    protected $fillable = [
        'section_id', 'course_id', 'title', 'description', 'type', 'content',
        'video_url', 'video_playback_id', 'duration_seconds', 'embed_url',
        'attachments', 'quiz_id', 'is_preview', 'is_published', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'is_preview' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function notes()
    {
        return $this->hasMany(LessonNote::class);
    }

    public function getFormattedDurationAttribute(): string
    {
        $minutes = floor($this->duration_seconds / 60);
        $seconds = $this->duration_seconds % 60;

        return sprintf('%d:%02d', $minutes, $seconds);
    }
}

// ---- Enrollment.php ----
class Enrollment extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'order_item_id', 'status',
        'amount_paid', 'currency', 'enrolled_at', 'completed_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function orderItem(): BelongsTo { return $this->belongsTo(OrderItem::class); }

    /**
     * Get course completion percentage for this enrollment
     */
    public function getProgressPercentageAttribute(): float
    {
        $totalLessons = $this->course->lessons()->where('is_published', true)->count();
        if ($totalLessons === 0) return 0;

        $completed = LessonProgress::where('user_id', $this->user_id)
            ->where('course_id', $this->course_id)
            ->where('is_completed', true)
            ->count();

        return round(($completed / $totalLessons) * 100, 1);
    }
}

// ---- LessonProgress.php ----
class LessonProgress extends Model
{
    protected $fillable = [
        'user_id', 'lesson_id', 'course_id', 'is_completed',
        'watch_seconds', 'watch_percent', 'last_watched_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'last_watched_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function lesson(): BelongsTo { return $this->belongsTo(Lesson::class); }
}

// ---- LessonNote.php ----
class LessonNote extends Model
{
    protected $fillable = ['user_id', 'lesson_id', 'timestamp_seconds', 'content'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function lesson(): BelongsTo { return $this->belongsTo(Lesson::class); }
}

// ---- Quiz.php ----
class Quiz extends Model
{
    protected $fillable = [
        'course_id', 'title', 'description', 'time_limit_minutes',
        'passing_score', 'max_attempts', 'randomize_questions', 'show_answers_after',
    ];

    protected function casts(): array
    {
        return ['randomize_questions' => 'boolean', 'show_answers_after' => 'boolean'];
    }

    public function course(): BelongsTo { return $this->belongsTo(Course::class); }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order');
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }
}

// ---- QuizQuestion.php ----
class QuizQuestion extends Model
{
    protected $fillable = ['quiz_id', 'type', 'question', 'explanation', 'points', 'sort_order'];

    public function quiz(): BelongsTo { return $this->belongsTo(Quiz::class); }

    public function options()
    {
        return $this->hasMany(QuizOption::class, 'question_id')->orderBy('sort_order');
    }
}

// ---- QuizOption.php ----
class QuizOption extends Model
{
    protected $fillable = ['question_id', 'content', 'is_correct', 'sort_order'];

    protected function casts(): array { return ['is_correct' => 'boolean']; }

    public function question(): BelongsTo { return $this->belongsTo(QuizQuestion::class); }
}

// ---- QuizAttempt.php ----
class QuizAttempt extends Model
{
    protected $fillable = [
        'user_id', 'quiz_id', 'score', 'max_score', 'percentage',
        'passed', 'time_taken_seconds', 'started_at', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function quiz(): BelongsTo { return $this->belongsTo(Quiz::class); }
    public function answers() { return $this->hasMany(QuizAttemptAnswer::class, 'attempt_id'); }
}

// ---- Review.php ----
class Review extends Model
{
    use \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'user_id', 'course_id', 'rating', 'title', 'content',
        'status', 'is_verified_purchase',
    ];

    protected function casts(): array
    {
        return ['is_verified_purchase' => 'boolean'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }

    protected static function boot(): void
    {
        parent::boot();
        // After saving, recalculate course rating
        static::saved(fn(Review $review) => $review->course->recalculateStats());
        static::deleted(fn(Review $review) => $review->course->recalculateStats());
    }
}

// ---- Order.php ----
class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'subtotal', 'discount', 'tax', 'total',
        'currency', 'coupon_id', 'status', 'payment_method', 'billing_address',
    ];

    protected function casts(): array
    {
        return ['billing_address' => 'array'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function coupon(): BelongsTo { return $this->belongsTo(Coupon::class); }

    public static function generateOrderNumber(): string
    {
        return 'ORD-' . date('Y') . '-' . str_pad(
            static::whereYear('created_at', date('Y'))->count() + 1,
            6, '0', STR_PAD_LEFT
        );
    }
}

// ---- OrderItem.php ----
class OrderItem extends Model
{
    protected $fillable = ['order_id', 'course_id', 'course_title', 'price', 'currency'];

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function enrollment() { return $this->hasOne(Enrollment::class); }
}

// ---- Payment.php ----
class Payment extends Model
{
    protected $fillable = [
        'order_id', 'user_id', 'provider', 'provider_payment_id', 'provider_intent_id',
        'amount', 'currency', 'status', 'provider_response', 'paid_at',
    ];

    protected function casts(): array
    {
        return ['provider_response' => 'array', 'paid_at' => 'datetime'];
    }

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}

// ---- Certificate.php ----
class Certificate extends Model
{
    protected $fillable = ['uuid', 'user_id', 'course_id', 'enrollment_id', 'pdf_path', 'issued_at'];

    protected function casts(): array { return ['issued_at' => 'datetime']; }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }

    public function getPdfUrlAttribute(): ?string
    {
        return $this->pdf_path ? \Storage::url($this->pdf_path) : null;
    }

    public function getVerifyUrlAttribute(): string
    {
        return config('app.frontend_url') . '/certificates/' . $this->uuid;
    }
}

// ---- LiveClass.php ----
class LiveClass extends Model
{
    protected $fillable = [
        'course_id', 'instructor_id', 'title', 'description', 'room_name',
        'livekit_token', 'status', 'scheduled_at', 'duration_minutes',
        'started_at', 'ended_at', 'recording_url', 'max_attendees',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function instructor(): BelongsTo { return $this->belongsTo(User::class, 'instructor_id'); }
    public function attendees() { return $this->hasMany(LiveClassAttendee::class); }
}

// ---- Discussion.php ----
class Discussion extends Model
{
    use \Illuminate\Database\Eloquent\SoftDeletes;

    protected $fillable = [
        'user_id', 'course_id', 'lesson_id', 'title', 'content',
        'is_pinned', 'is_answered', 'views_count', 'replies_count',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function lesson(): BelongsTo { return $this->belongsTo(Lesson::class); }

    public function replies()
    {
        return $this->hasMany(DiscussionReply::class)->whereNull('parent_id')->latest();
    }
}

// ---- Wishlist.php ----
class Wishlist extends Model
{
    protected $fillable = ['user_id', 'course_id'];
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
}

// ---- Coupon.php ----
class Coupon extends Model
{
    protected $fillable = [
        'code', 'type', 'value', 'max_discount', 'min_order_amount',
        'max_uses', 'used_count', 'max_uses_per_user', 'is_active',
        'starts_at', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->expires_at && $this->expires_at->isPast()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;

        return true;
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($this->type === 'percentage') {
            $discount = $subtotal * ($this->value / 100);
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }
        } else {
            $discount = $this->value;
        }

        return min($discount, $subtotal);
    }
}
