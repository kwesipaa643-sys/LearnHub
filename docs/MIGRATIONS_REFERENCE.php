<?php
/**
 * ============================================================
 * LearnHub — Database Migrations (Laravel 11)
 * Run: php artisan migrate --seed
 * ============================================================
 * 
 * Migration Files to create under database/migrations/:
 *  01 - users (extended)
 *  02 - user_profiles
 *  03 - social_accounts
 *  04 - categories
 *  05 - courses
 *  06 - course_sections
 *  07 - lessons
 *  08 - enrollments
 *  09 - lesson_progress
 *  10 - lesson_notes
 *  11 - quizzes
 *  12 - quiz_questions
 *  13 - quiz_options
 *  14 - quiz_attempts
 *  15 - quiz_attempt_answers
 *  16 - reviews
 *  17 - orders
 *  18 - order_items
 *  19 - payments
 *  20 - subscription_plans
 *  21 - subscriptions
 *  22 - live_classes
 *  23 - live_class_attendees
 *  24 - certificates
 *  25 - discussions
 *  26 - discussion_replies
 *  27 - wishlists
 *  28 - tags
 *  29 - course_tags
 *  30 - coupons
 *  31 - course_coupons
 *  32 - notifications (built-in Laravel)
 *  33 - media (file uploads)
 *  34 - analytics_events
 */

// ============================================================
// 1. EXTEND USERS TABLE
// ============================================================
// File: 0001_01_01_000000_create_users_table.php
// (Modify the default Laravel users migration)

Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password')->nullable(); // nullable for social login
    $table->enum('role', ['student', 'instructor', 'admin'])->default('student');
    $table->enum('status', ['active', 'suspended', 'pending'])->default('active');
    $table->string('avatar')->nullable();
    $table->string('stripe_customer_id')->nullable();
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index(['email', 'role']);
    $table->index('status');
});

// ============================================================
// 2. USER PROFILES
// ============================================================
Schema::create('user_profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->text('bio')->nullable();
    $table->string('headline')->nullable();       // "Senior Laravel Developer"
    $table->string('website')->nullable();
    $table->string('twitter')->nullable();
    $table->string('linkedin')->nullable();
    $table->string('youtube')->nullable();
    $table->string('github')->nullable();
    $table->string('timezone')->default('UTC');
    $table->string('language')->default('en');
    $table->string('phone')->nullable();
    $table->string('country')->nullable();
    $table->json('preferences')->nullable();       // UI prefs, notification settings
    $table->decimal('revenue_share', 5, 2)->default(70.00); // 70% to instructor
    $table->string('payout_email')->nullable();
    $table->json('payout_info')->nullable();       // Bank/mobile money details
    $table->timestamps();
});

// ============================================================
// 3. SOCIAL ACCOUNTS (OAuth)
// ============================================================
Schema::create('social_accounts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('provider');                    // google, github
    $table->string('provider_id');
    $table->string('provider_token')->nullable();
    $table->string('provider_refresh_token')->nullable();
    $table->timestamps();
    
    $table->unique(['provider', 'provider_id']);
    $table->index('user_id');
});

// ============================================================
// 4. CATEGORIES (Hierarchical)
// ============================================================
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('icon')->nullable();            // emoji or icon name
    $table->string('color')->nullable();           // hex color for UI
    $table->text('description')->nullable();
    $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
    $table->integer('sort_order')->default(0);
    $table->boolean('is_featured')->default(false);
    $table->timestamps();
    
    $table->index(['parent_id', 'sort_order']);
});

// ============================================================
// 5. COURSES
// ============================================================
Schema::create('courses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // instructor
    $table->foreignId('category_id')->constrained()->restrictOnDelete();
    $table->string('title');
    $table->string('slug')->unique();
    $table->text('subtitle')->nullable();
    $table->longText('description')->nullable();
    $table->json('what_you_learn')->nullable();     // array of bullet points
    $table->json('requirements')->nullable();       // prerequisite bullet points
    $table->json('for_whom')->nullable();           // target audience
    $table->string('thumbnail')->nullable();
    $table->string('trailer_video')->nullable();
    $table->enum('level', ['beginner', 'intermediate', 'advanced', 'all-levels'])->default('all-levels');
    $table->enum('status', ['draft', 'under_review', 'published', 'archived'])->default('draft');
    $table->enum('pricing_type', ['free', 'paid', 'subscription'])->default('free');
    $table->decimal('price', 10, 2)->default(0);
    $table->decimal('sale_price', 10, 2)->nullable();
    $table->timestamp('sale_ends_at')->nullable();
    $table->string('currency', 3)->default('USD');
    $table->string('language')->default('en');
    $table->boolean('is_featured')->default(false);
    $table->boolean('certificate_enabled')->default(true);
    $table->integer('duration_hours')->default(0); // auto-calculated
    $table->integer('lessons_count')->default(0);  // denormalized
    $table->integer('enrollments_count')->default(0); // denormalized
    $table->decimal('rating_avg', 3, 2)->default(0); // denormalized
    $table->integer('rating_count')->default(0);
    $table->json('meta')->nullable();              // SEO, etc.
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
    
    $table->index(['status', 'pricing_type']);
    $table->index(['category_id', 'status']);
    $table->index(['user_id', 'status']);
    $table->index('is_featured');
    $table->fullText(['title', 'subtitle', 'description']);
});

// ============================================================
// 6. COURSE SECTIONS
// ============================================================
Schema::create('course_sections', function (Blueprint $table) {
    $table->id();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    
    $table->index(['course_id', 'sort_order']);
});

// ============================================================
// 7. LESSONS
// ============================================================
Schema::create('lessons', function (Blueprint $table) {
    $table->id();
    $table->foreignId('section_id')->constrained('course_sections')->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete(); // denorm
    $table->string('title');
    $table->text('description')->nullable();
    $table->enum('type', ['video', 'article', 'quiz', 'assignment', 'download', 'embed', 'live'])->default('video');
    $table->longText('content')->nullable();       // article HTML
    $table->string('video_url')->nullable();       // Mux/Bunny HLS URL
    $table->string('video_playback_id')->nullable();// Mux playback ID
    $table->integer('duration_seconds')->default(0);
    $table->string('embed_url')->nullable();       // YouTube, Loom, etc.
    $table->json('attachments')->nullable();       // downloadable files
    $table->foreignId('quiz_id')->nullable()->constrained()->nullOnDelete();
    $table->boolean('is_preview')->default(false); // free preview
    $table->boolean('is_published')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    
    $table->index(['course_id', 'is_published']);
    $table->index(['section_id', 'sort_order']);
});

// ============================================================
// 8. ENROLLMENTS
// ============================================================
Schema::create('enrollments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->foreignId('order_item_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('status', ['active', 'completed', 'refunded', 'expired'])->default('active');
    $table->decimal('amount_paid', 10, 2)->default(0);
    $table->string('currency', 3)->default('USD');
    $table->timestamp('enrolled_at')->useCurrent();
    $table->timestamp('completed_at')->nullable();
    $table->timestamp('expires_at')->nullable();   // for subscription
    $table->timestamps();
    
    $table->unique(['user_id', 'course_id']);
    $table->index(['course_id', 'status']);
});

// ============================================================
// 9. LESSON PROGRESS
// ============================================================
Schema::create('lesson_progress', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete(); // denorm
    $table->boolean('is_completed')->default(false);
    $table->integer('watch_seconds')->default(0);  // video watch time
    $table->decimal('watch_percent', 5, 2)->default(0);
    $table->timestamp('last_watched_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->timestamps();
    
    $table->unique(['user_id', 'lesson_id']);
    $table->index(['user_id', 'course_id']);
});

// ============================================================
// 10. LESSON NOTES
// ============================================================
Schema::create('lesson_notes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
    $table->integer('timestamp_seconds')->nullable(); // video timestamp
    $table->text('content');
    $table->timestamps();
    
    $table->index(['user_id', 'lesson_id']);
});

// ============================================================
// 11. QUIZZES
// ============================================================
Schema::create('quizzes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->integer('time_limit_minutes')->nullable(); // null = unlimited
    $table->integer('passing_score')->default(70);    // percentage
    $table->integer('max_attempts')->nullable();      // null = unlimited
    $table->boolean('randomize_questions')->default(false);
    $table->boolean('show_answers_after')->default(true);
    $table->timestamps();
});

// ============================================================
// 12. QUIZ QUESTIONS
// ============================================================
Schema::create('quiz_questions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['multiple_choice', 'true_false', 'fill_blank', 'multi_select'])->default('multiple_choice');
    $table->text('question');
    $table->text('explanation')->nullable();    // shown after answer
    $table->integer('points')->default(1);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    
    $table->index(['quiz_id', 'sort_order']);
});

// ============================================================
// 13. QUIZ OPTIONS
// ============================================================
Schema::create('quiz_options', function (Blueprint $table) {
    $table->id();
    $table->foreignId('question_id')->constrained('quiz_questions')->cascadeOnDelete();
    $table->text('content');
    $table->boolean('is_correct')->default(false);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});

// ============================================================
// 14. QUIZ ATTEMPTS
// ============================================================
Schema::create('quiz_attempts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
    $table->integer('score')->default(0);           // achieved score
    $table->integer('max_score')->default(0);       // total possible
    $table->decimal('percentage', 5, 2)->default(0);
    $table->boolean('passed')->default(false);
    $table->integer('time_taken_seconds')->nullable();
    $table->timestamp('started_at')->useCurrent();
    $table->timestamp('submitted_at')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'quiz_id']);
});

// ============================================================
// 15. QUIZ ATTEMPT ANSWERS
// ============================================================
Schema::create('quiz_attempt_answers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attempt_id')->constrained('quiz_attempts')->cascadeOnDelete();
    $table->foreignId('question_id')->constrained('quiz_questions')->cascadeOnDelete();
    $table->json('selected_options')->nullable();   // array of option IDs
    $table->string('text_answer')->nullable();      // for fill_blank
    $table->boolean('is_correct')->default(false);
    $table->integer('points_earned')->default(0);
    $table->timestamps();
});

// ============================================================
// 16. REVIEWS
// ============================================================
Schema::create('reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->tinyInteger('rating');                 // 1-5
    $table->string('title')->nullable();
    $table->text('content')->nullable();
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved');
    $table->boolean('is_verified_purchase')->default(false);
    $table->timestamps();
    $table->softDeletes();
    
    $table->unique(['user_id', 'course_id']);
    $table->index(['course_id', 'status', 'rating']);
});

// ============================================================
// 17. ORDERS
// ============================================================
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->string('order_number')->unique();       // ORD-2024-XXXXXX
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->decimal('subtotal', 10, 2)->default(0);
    $table->decimal('discount', 10, 2)->default(0);
    $table->decimal('tax', 10, 2)->default(0);
    $table->decimal('total', 10, 2)->default(0);
    $table->string('currency', 3)->default('USD');
    $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('status', ['pending', 'completed', 'refunded', 'failed'])->default('pending');
    $table->string('payment_method')->nullable();  // stripe, flutterwave
    $table->json('billing_address')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'status']);
    $table->index('order_number');
});

// ============================================================
// 18. ORDER ITEMS
// ============================================================
Schema::create('order_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->restrictOnDelete();
    $table->string('course_title');                // snapshot at purchase
    $table->decimal('price', 10, 2);
    $table->string('currency', 3)->default('USD');
    $table->timestamps();
});

// ============================================================
// 19. PAYMENTS
// ============================================================
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('provider');                    // stripe, flutterwave
    $table->string('provider_payment_id')->unique(); // charge ID / transaction ref
    $table->string('provider_intent_id')->nullable();
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('USD');
    $table->enum('status', ['pending', 'succeeded', 'failed', 'refunded'])->default('pending');
    $table->json('provider_response')->nullable(); // raw API response
    $table->timestamp('paid_at')->nullable();
    $table->timestamps();
    
    $table->index(['order_id', 'status']);
    $table->index('provider_payment_id');
});

// ============================================================
// 20. SUBSCRIPTION PLANS
// ============================================================
Schema::create('subscription_plans', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->decimal('price_monthly', 10, 2);
    $table->decimal('price_yearly', 10, 2);
    $table->string('stripe_price_monthly_id')->nullable();
    $table->string('stripe_price_yearly_id')->nullable();
    $table->json('features')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});

// ============================================================
// 21. SUBSCRIPTIONS
// ============================================================
Schema::create('subscriptions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
    $table->string('stripe_subscription_id')->nullable();
    $table->enum('status', ['active', 'cancelled', 'expired', 'trial'])->default('active');
    $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamp('current_period_start')->nullable();
    $table->timestamp('current_period_end')->nullable();
    $table->timestamp('cancelled_at')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'status']);
});

// ============================================================
// 22. LIVE CLASSES
// ============================================================
Schema::create('live_classes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('room_name')->unique();          // LiveKit room name
    $table->string('livekit_token')->nullable();    // pre-generated token
    $table->enum('status', ['scheduled', 'live', 'ended', 'cancelled'])->default('scheduled');
    $table->timestamp('scheduled_at');
    $table->integer('duration_minutes')->default(60);
    $table->timestamp('started_at')->nullable();
    $table->timestamp('ended_at')->nullable();
    $table->string('recording_url')->nullable();
    $table->integer('max_attendees')->nullable();
    $table->timestamps();
    
    $table->index(['course_id', 'status']);
    $table->index('scheduled_at');
});

// ============================================================
// 23. LIVE CLASS ATTENDEES
// ============================================================
Schema::create('live_class_attendees', function (Blueprint $table) {
    $table->id();
    $table->foreignId('live_class_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamp('joined_at')->useCurrent();
    $table->timestamp('left_at')->nullable();
    $table->integer('duration_seconds')->default(0);
    $table->timestamps();
    
    $table->unique(['live_class_id', 'user_id']);
});

// ============================================================
// 24. CERTIFICATES
// ============================================================
Schema::create('certificates', function (Blueprint $table) {
    $table->id();
    $table->string('uuid')->unique();              // public certificate ID
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
    $table->string('pdf_path')->nullable();
    $table->timestamp('issued_at')->useCurrent();
    $table->timestamps();
    
    $table->unique(['user_id', 'course_id']);
});

// ============================================================
// 25. DISCUSSIONS
// ============================================================
Schema::create('discussions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->foreignId('lesson_id')->nullable()->constrained()->nullOnDelete();
    $table->string('title');
    $table->text('content');
    $table->boolean('is_pinned')->default(false);
    $table->boolean('is_answered')->default(false);
    $table->integer('views_count')->default(0);
    $table->integer('replies_count')->default(0);
    $table->timestamps();
    $table->softDeletes();
    
    $table->index(['course_id', 'lesson_id']);
});

// ============================================================
// 26. DISCUSSION REPLIES
// ============================================================
Schema::create('discussion_replies', function (Blueprint $table) {
    $table->id();
    $table->foreignId('discussion_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('parent_id')->nullable()->constrained('discussion_replies')->cascadeOnDelete();
    $table->text('content');
    $table->boolean('is_accepted_answer')->default(false);
    $table->integer('upvotes_count')->default(0);
    $table->timestamps();
    $table->softDeletes();
});

// ============================================================
// 27. WISHLISTS
// ============================================================
Schema::create('wishlists', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    
    $table->unique(['user_id', 'course_id']);
    $table->index('user_id');
});

// ============================================================
// 28. TAGS
// ============================================================
Schema::create('tags', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('slug')->unique();
    $table->timestamps();
});

// ============================================================
// 29. COURSE TAGS (pivot)
// ============================================================
Schema::create('course_tags', function (Blueprint $table) {
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->primary(['course_id', 'tag_id']);
});

// ============================================================
// 30. COUPONS
// ============================================================
Schema::create('coupons', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();
    $table->enum('type', ['percentage', 'fixed'])->default('percentage');
    $table->decimal('value', 10, 2);              // % or fixed amount
    $table->decimal('max_discount', 10, 2)->nullable();
    $table->decimal('min_order_amount', 10, 2)->default(0);
    $table->integer('max_uses')->nullable();
    $table->integer('used_count')->default(0);
    $table->integer('max_uses_per_user')->default(1);
    $table->boolean('is_active')->default(true);
    $table->timestamp('starts_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
    
    $table->index(['code', 'is_active']);
});

// ============================================================
// 31. COURSE COUPONS (which courses a coupon applies to)
// ============================================================
Schema::create('coupon_courses', function (Blueprint $table) {
    $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
    $table->foreignId('course_id')->constrained()->cascadeOnDelete();
    $table->primary(['coupon_id', 'course_id']);
});

// ============================================================
// 32. MEDIA (centralized file management)
// ============================================================
Schema::create('media', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->morphs('mediable');                   // polymorphic: course, lesson, etc.
    $table->string('collection')->default('default'); // thumbnail, attachment, etc.
    $table->string('disk');                        // local, s3
    $table->string('path');
    $table->string('filename');
    $table->string('mime_type');
    $table->bigInteger('size');                    // bytes
    $table->json('metadata')->nullable();          // dimensions, duration, etc.
    $table->string('url')->nullable();             // cached public URL
    $table->timestamps();
    
    $table->index(['mediable_type', 'mediable_id', 'collection']);
});

// ============================================================
// 33. ANALYTICS EVENTS
// ============================================================
Schema::create('analytics_events', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('event');                       // course_viewed, lesson_completed, etc.
    $table->string('entity_type')->nullable();     // course, lesson
    $table->unsignedBigInteger('entity_id')->nullable();
    $table->json('properties')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamp('occurred_at')->useCurrent();
    
    $table->index(['event', 'occurred_at']);
    $table->index(['user_id', 'event']);
    $table->index(['entity_type', 'entity_id']);
});
