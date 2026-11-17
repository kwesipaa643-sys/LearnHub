<?php

use App\Http\Controllers\Api\V1\{
    AuthController,
    SocialAuthController,
    ProfileController,
    CourseController,
    SectionController,
    LessonController,
    EnrollmentController,
    ProgressController,
    QuizController,
    ReviewController,
    WishlistController,
    DiscussionController,
    NoteController,
    PaymentController,
    SubscriptionController,
    CertificateController,
    LiveClassController,
    NotificationController,
    Admin\AdminDashboardController,
    Admin\AdminUserController,
    Admin\AdminCourseController,
    Instructor\InstructorDashboardController,
    Instructor\InstructorAnalyticsController,
    CategoryController,
    SearchController,
};
use Illuminate\Support\Facades\Route;

// ============================================================
// API Version 1
// ============================================================
Route::prefix('v1')->group(function () {

    // ========================================================
    // PUBLIC ROUTES (no auth required)
    // ========================================================

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::post('resend-verification', [AuthController::class, 'resendVerification']);
        Route::get('verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->name('verification.verify');

        // Social OAuth
        Route::get('social/{provider}', [SocialAuthController::class, 'redirect']);
        Route::get('social/{provider}/callback', [SocialAuthController::class, 'callback']);
    });

    // Public course browsing
    Route::get('courses', [CourseController::class, 'index']);
    Route::get('courses/{slug}', [CourseController::class, 'show']);
    Route::get('courses/{slug}/reviews', [ReviewController::class, 'index']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{slug}/courses', [CategoryController::class, 'courses']);
    Route::get('tags', [CategoryController::class, 'tags']);
    Route::get('search', [SearchController::class, 'search']);

    // Certificate verification (public)
    Route::get('certificates/{uuid}/verify', [CertificateController::class, 'verify']);

    // Stripe webhooks (no auth middleware, but signature verified)
    Route::post('webhooks/stripe', [PaymentController::class, 'stripeWebhook'])
        ->withoutMiddleware(['auth:sanctum']);

    // ========================================================
    // AUTHENTICATED ROUTES
    // ========================================================
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // Profile
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::put('profile/password', [ProfileController::class, 'changePassword']);
        Route::put('profile/notifications', [ProfileController::class, 'updateNotifications']);

        // Public instructor profile
        Route::get('users/{id}/profile', [ProfileController::class, 'publicProfile']);

        // Enrollment
        Route::post('enroll', [EnrollmentController::class, 'enroll']);
        Route::get('my-courses', [EnrollmentController::class, 'myCourses']);
        Route::get('courses/{slug}/progress', [ProgressController::class, 'courseProgress']);

        // Progress tracking
        Route::post('progress', [ProgressController::class, 'update']);

        // Notes
        Route::get('lessons/{lessonId}/notes', [NoteController::class, 'index']);
        Route::post('lessons/{lessonId}/notes', [NoteController::class, 'store']);
        Route::put('notes/{id}', [NoteController::class, 'update']);
        Route::delete('notes/{id}', [NoteController::class, 'destroy']);

        // Quiz
        Route::get('lessons/{lessonId}/quiz', [QuizController::class, 'lessonQuiz']);
        Route::post('quizzes/{id}/attempt/start', [QuizController::class, 'startAttempt']);
        Route::post('quizzes/{id}/attempt/submit', [QuizController::class, 'submitAttempt']);
        Route::get('quizzes/{id}/attempts', [QuizController::class, 'myAttempts']);

        // Reviews
        Route::post('courses/{slug}/reviews', [ReviewController::class, 'store']);
        Route::put('reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('reviews/{id}', [ReviewController::class, 'destroy']);

        // Wishlist
        Route::get('wishlist', [WishlistController::class, 'index']);
        Route::post('wishlist', [WishlistController::class, 'store']);
        Route::delete('wishlist/{courseId}', [WishlistController::class, 'destroy']);

        // Discussions
        Route::get('courses/{slug}/discussions', [DiscussionController::class, 'index']);
        Route::post('courses/{slug}/discussions', [DiscussionController::class, 'store']);
        Route::post('discussions/{id}/replies', [DiscussionController::class, 'reply']);
        Route::post('discussion-replies/{id}/upvote', [DiscussionController::class, 'upvote']);
        Route::post('discussions/{id}/mark-answered', [DiscussionController::class, 'markAnswered']);

        // Payments
        Route::post('checkout', [PaymentController::class, 'checkout']);
        Route::post('checkout/validate-coupon', [PaymentController::class, 'validateCoupon']);
        Route::get('orders', [PaymentController::class, 'orders']);
        Route::get('orders/{id}/invoice', [PaymentController::class, 'invoice']);

        // Subscriptions
        Route::get('subscriptions/plans', [SubscriptionController::class, 'plans']);
        Route::post('subscriptions/subscribe', [SubscriptionController::class, 'subscribe']);
        Route::delete('subscriptions/cancel', [SubscriptionController::class, 'cancel']);
        Route::get('subscriptions/current', [SubscriptionController::class, 'current']);

        // Certificates
        Route::get('certificates', [CertificateController::class, 'index']);
        Route::post('certificates/generate', [CertificateController::class, 'generate']);
        Route::get('certificates/{uuid}/download', [CertificateController::class, 'download']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

        // Live Classes
        Route::get('courses/{slug}/live-classes', [LiveClassController::class, 'index']);
        Route::post('live-classes/{id}/join', [LiveClassController::class, 'join']);

        // ====================================================
        // INSTRUCTOR ROUTES
        // ====================================================
        Route::middleware('role:instructor,admin')->prefix('instructor')->group(function () {
            Route::get('dashboard', [InstructorDashboardController::class, 'index']);
            Route::get('courses', [CourseController::class, 'myCourses']);
            Route::get('analytics/courses/{id}', [InstructorAnalyticsController::class, 'courseAnalytics']);
            Route::get('earnings', [InstructorDashboardController::class, 'earnings']);
            Route::post('payout/request', [InstructorDashboardController::class, 'requestPayout']);

            // Course CRUD
            Route::post('courses', [CourseController::class, 'store']);
            Route::put('courses/{id}', [CourseController::class, 'update']);
            Route::delete('courses/{id}', [CourseController::class, 'destroy']);
            Route::post('courses/{id}/publish', [CourseController::class, 'publish']);
            Route::post('courses/{id}/thumbnail', [CourseController::class, 'uploadThumbnail']);

            // Sections
            Route::get('courses/{courseId}/sections', [SectionController::class, 'index']);
            Route::post('courses/{courseId}/sections', [SectionController::class, 'store']);
            Route::put('courses/{courseId}/sections/{id}', [SectionController::class, 'update']);
            Route::delete('courses/{courseId}/sections/{id}', [SectionController::class, 'destroy']);
            Route::post('courses/{courseId}/sections/reorder', [SectionController::class, 'reorder']);

            // Lessons
            Route::post('sections/{sectionId}/lessons', [LessonController::class, 'store']);
            Route::put('lessons/{id}', [LessonController::class, 'update']);
            Route::delete('lessons/{id}', [LessonController::class, 'destroy']);
            Route::post('lessons/{id}/upload-video', [LessonController::class, 'uploadVideo']);
            Route::post('lessons/{id}/attachments', [LessonController::class, 'addAttachment']);
            Route::post('lessons/reorder', [LessonController::class, 'reorder']);

            // Quizzes
            Route::post('quizzes', [QuizController::class, 'store']);
            Route::put('quizzes/{id}', [QuizController::class, 'update']);
            Route::delete('quizzes/{id}', [QuizController::class, 'destroy']);

            // Live Classes
            Route::post('live-classes', [LiveClassController::class, 'store']);
            Route::post('live-classes/{id}/start', [LiveClassController::class, 'start']);
            Route::post('live-classes/{id}/end', [LiveClassController::class, 'end']);
        });

        // ====================================================
        // ADMIN ROUTES
        // ====================================================
        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('dashboard', [AdminDashboardController::class, 'index']);

            // Users
            Route::get('users', [AdminUserController::class, 'index']);
            Route::get('users/{id}', [AdminUserController::class, 'show']);
            Route::put('users/{id}/status', [AdminUserController::class, 'updateStatus']);
            Route::put('users/{id}/role', [AdminUserController::class, 'updateRole']);

            // Courses
            Route::get('courses', [AdminCourseController::class, 'index']);
            Route::put('courses/{id}/approve', [AdminCourseController::class, 'approve']);
            Route::put('courses/{id}/reject', [AdminCourseController::class, 'reject']);

            // Reviews moderation
            Route::get('reviews', [ReviewController::class, 'adminIndex']);
            Route::put('reviews/{id}/moderate', [ReviewController::class, 'moderate']);

            // Revenue
            Route::get('revenue/report', [AdminDashboardController::class, 'revenueReport']);

            // Categories management
            Route::post('categories', [CategoryController::class, 'store']);
            Route::put('categories/{id}', [CategoryController::class, 'update']);
            Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
        });
    });
});
