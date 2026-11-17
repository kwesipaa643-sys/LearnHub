<?php
/**
 * ============================================================
 * REMAINING BACKEND SERVICES
 * ============================================================
 */

// ── app/Services/PaymentService.php ─────────────────────────
namespace App\Services;

use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderConfirmed;
use Stripe\Customer;
use Stripe\Stripe;

class PaymentService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Get or create a Stripe customer for the user.
     */
    public function getOrCreateStripeCustomer(User $user): string
    {
        if ($user->stripe_customer_id) {
            return $user->stripe_customer_id;
        }

        $customer = Customer::create([
            'email' => $user->email,
            'name' => $user->name,
            'metadata' => ['user_id' => $user->id],
        ]);

        $user->update(['stripe_customer_id' => $customer->id]);

        return $customer->id;
    }

    /**
     * Mark order as complete, create enrollments, fire events.
     */
    public function completeOrder(Order $order): void
    {
        $order->update(['status' => 'completed']);

        // Create enrollments for each course
        foreach ($order->items as $item) {
            $enrollment = Enrollment::firstOrCreate(
                ['user_id' => $order->user_id, 'course_id' => $item->course_id],
                [
                    'order_item_id' => $item->id,
                    'status' => 'active',
                    'amount_paid' => $item->price,
                    'currency' => $item->currency,
                    'enrolled_at' => now(),
                ]
            );

            // Update course enrollment count
            $item->course->increment('enrollments_count');
        }

        // Notify user
        $order->user->notify(new OrderConfirmed($order));

        // Update coupon usage
        if ($order->coupon_id) {
            $order->coupon->increment('used_count');
        }
    }
}

// ── app/Services/CourseService.php ──────────────────────────
class CourseService
{
    public function createCourse(User $instructor, array $data): \App\Models\Course
    {
        return \App\Models\Course::create([
            ...$data,
            'user_id' => $instructor->id,
            'status' => 'draft',
        ]);
    }

    public function updateCourse(\App\Models\Course $course, array $data): \App\Models\Course
    {
        $course->update($data);
        return $course->fresh();
    }

    public function uploadThumbnail(\App\Models\Course $course, \Illuminate\Http\UploadedFile $file): string
    {
        // Delete old thumbnail
        if ($course->thumbnail) {
            \Storage::delete($course->thumbnail);
        }

        $path = $file->store("courses/{$course->id}/thumbnails", 'public');
        $course->update(['thumbnail' => $path]);

        return $path;
    }
}

// ── app/Services/LiveClassService.php ────────────────────────
class LiveClassService
{
    public function createRoom(\App\Models\LiveClass $liveClass): array
    {
        $apiKey = config('services.livekit.api_key');
        $apiSecret = config('services.livekit.api_secret');

        // Generate LiveKit JWT token
        // In production, use livekit/livekit-server-sdk-php
        $roomName = $liveClass->room_name;
        $token = $this->generateToken($apiKey, $apiSecret, $roomName, 'host', true);

        return ['token' => $token, 'room' => $roomName, 'url' => config('services.livekit.url')];
    }

    public function joinRoom(\App\Models\LiveClass $liveClass, \App\Models\User $user): array
    {
        $apiKey = config('services.livekit.api_key');
        $apiSecret = config('services.livekit.api_secret');
        $isHost = $user->id === $liveClass->instructor_id;

        $token = $this->generateToken($apiKey, $apiSecret, $liveClass->room_name, $user->name, $isHost);

        // Record attendance
        \App\Models\LiveClassAttendee::firstOrCreate([
            'live_class_id' => $liveClass->id,
            'user_id' => $user->id,
        ], ['joined_at' => now()]);

        return [
            'token' => $token,
            'room' => $liveClass->room_name,
            'url' => config('services.livekit.url'),
        ];
    }

    private function generateToken(string $apiKey, string $apiSecret, string $room, string $identity, bool $canPublish): string
    {
        // Simplified JWT generation — use livekit-server-sdk-php in production
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'iss' => $apiKey,
            'sub' => $identity,
            'iat' => time(),
            'exp' => time() + 3600,
            'video' => [
                'roomJoin' => true,
                'room' => $room,
                'canPublish' => $canPublish,
                'canSubscribe' => true,
            ],
        ]));

        $sig = base64_encode(hash_hmac('sha256', "$header.$payload", $apiSecret, true));

        return "$header.$payload.$sig";
    }
}

// ── app/Http/Controllers/Api/V1/CertificateController.php ────
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function __construct(private CertificateService $certService) {}

    public function index(Request $request): JsonResponse
    {
        $certs = Certificate::where('user_id', $request->user()->id)
            ->with(['course:id,title,thumbnail,slug', 'user:id,name'])
            ->orderByDesc('issued_at')
            ->get();

        return response()->json(['success' => true, 'data' => $certs]);
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate(['course_id' => 'required|integer|exists:courses,id']);

        try {
            $cert = $this->certService->generateCertificate($request->user(), $request->course_id);
            return response()->json(['success' => true, 'data' => $cert], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function verify(string $uuid): JsonResponse
    {
        $cert = Certificate::where('uuid', $uuid)
            ->with(['user:id,name', 'course:id,title,slug'])
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $cert]);
    }

    public function download(Request $request, string $uuid): mixed
    {
        $cert = Certificate::where('uuid', $uuid)->firstOrFail();
        abort_if($cert->user_id !== $request->user()->id && !$request->user()->isAdmin(), 403);

        if (!$cert->pdf_path || !\Storage::exists($cert->pdf_path)) {
            // Regenerate
            $this->certService->generateCertificate($request->user(), $cert->course_id);
            $cert->refresh();
        }

        return \Storage::download($cert->pdf_path, "certificate-{$cert->uuid}.pdf");
    }
}

// ── app/Notifications/CertificateIssued.php ─────────────────
namespace App\Notifications;

use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CertificateIssued extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Certificate $certificate) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("🎉 Your Certificate is Ready — {$this->certificate->course->title}")
            ->greeting("Congratulations, {$notifiable->name}!")
            ->line("You've successfully completed **{$this->certificate->course->title}**.")
            ->action('Download Certificate', $this->certificate->pdf_url)
            ->line('Keep learning and growing! 🚀');
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Certificate Ready! 🎓',
            'message' => "Your certificate for {$this->certificate->course->title} is ready.",
            'action_url' => "/certificates",
            'certificate_uuid' => $this->certificate->uuid,
        ];
    }
}

// ── app/Notifications/OrderConfirmed.php ────────────────────
class OrderConfirmed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public \App\Models\Order $order) {}

    public function via($notifiable): array { return ['mail', 'database']; }

    public function toMail($notifiable): MailMessage
    {
        $courses = $this->order->items->pluck('course_title')->implode(', ');

        return (new MailMessage)
            ->subject("Order Confirmed — #{$this->order->order_number}")
            ->greeting("Hi {$notifiable->name}!")
            ->line("Your order **#{$this->order->order_number}** has been confirmed.")
            ->line("You're now enrolled in: **{$courses}**")
            ->action('Start Learning', config('app.frontend_url') . '/dashboard')
            ->line('Thank you for learning with LearnHub!');
    }

    public function toArray($notifiable): array
    {
        return [
            'title' => 'Order Confirmed!',
            'message' => "Your order #{$this->order->order_number} is complete. Start learning!",
            'action_url' => '/dashboard',
            'order_id' => $this->order->id,
        ];
    }
}

// ── app/Http/Controllers/Api/V1/NotificationController.php ───
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->when($request->boolean('read') === false, fn($q) => $q->unread())
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'meta' => ['total' => $notifications->total(), 'page' => $notifications->currentPage()],
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();
        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}

// ── app/Http/Middleware/RoleMiddleware.php ───────────────────
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        return $next($request);
    }
}

// ── app/Http/Controllers/Api/V1/SocialAuthController.php ─────
class SocialAuthController extends Controller
{
    public function redirect(string $provider): mixed
    {
        abort_if(!in_array($provider, ['google', 'github']), 404);
        return \Laravel\Socialite\Facades\Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(string $provider): mixed
    {
        abort_if(!in_array($provider, ['google', 'github']), 404);

        try {
            $socialUser = \Laravel\Socialite\Facades\Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return redirect(config('app.frontend_url') . '/login?error=social_auth_failed');
        }

        // Find or create user
        $existingAccount = \App\Models\SocialAccount::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($existingAccount) {
            $user = $existingAccount->user;
        } else {
            $user = \App\Models\User::firstOrCreate(
                ['email' => $socialUser->getEmail()],
                [
                    'name' => $socialUser->getName(),
                    'email_verified_at' => now(),
                    'role' => 'student',
                ]
            );

            if ($socialUser->getAvatar() && !$user->avatar) {
                $user->update(['avatar' => $socialUser->getAvatar()]);
            }

            \App\Models\SocialAccount::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_id' => $socialUser->getId(),
                'provider_token' => $socialUser->token,
            ]);

            if (!$user->profile) {
                \App\Models\UserProfile::create(['user_id' => $user->id]);
            }
        }

        $token = $user->createToken('social_auth')->plainTextToken;

        return redirect(
            config('app.frontend_url') . "/auth/callback?token={$token}&role={$user->role}"
        );
    }
}

// ── app/Http/Controllers/Api/V1/LiveClassController.php ──────
class LiveClassController extends Controller
{
    public function __construct(private LiveClassService $liveService) {}

    public function index(string $slug): JsonResponse
    {
        $course = \App\Models\Course::where('slug', $slug)->firstOrFail();
        $classes = $course->liveClasses()
            ->with('instructor:id,name,avatar')
            ->orderByDesc('scheduled_at')
            ->get();
        return response()->json(['success' => true, 'data' => $classes]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'scheduled_at' => 'required|date|after:now',
            'duration_minutes' => 'integer|min:15|max:480',
        ]);

        $liveClass = \App\Models\LiveClass::create([
            ...$request->only(['course_id', 'title', 'description', 'scheduled_at', 'duration_minutes', 'max_attendees']),
            'instructor_id' => $request->user()->id,
            'room_name' => 'learnhub-' . \Str::random(12),
            'status' => 'scheduled',
        ]);

        return response()->json(['success' => true, 'data' => $liveClass], 201);
    }

    public function join(Request $request, int $id): JsonResponse
    {
        $liveClass = \App\Models\LiveClass::findOrFail($id);

        // Verify enrollment
        abort_unless(
            $request->user()->isEnrolledIn($liveClass->course_id) || $request->user()->id === $liveClass->instructor_id,
            403,
            'You must be enrolled to join this live class.'
        );

        $joinData = $this->liveService->joinRoom($liveClass, $request->user());

        return response()->json(['success' => true, 'data' => $joinData]);
    }

    public function start(Request $request, int $id): JsonResponse
    {
        $liveClass = \App\Models\LiveClass::findOrFail($id);
        abort_unless($request->user()->id === $liveClass->instructor_id, 403);

        $roomData = $this->liveService->createRoom($liveClass);
        $liveClass->update(['status' => 'live', 'started_at' => now()]);

        return response()->json(['success' => true, 'data' => $roomData]);
    }

    public function end(Request $request, int $id): JsonResponse
    {
        $liveClass = \App\Models\LiveClass::findOrFail($id);
        abort_unless($request->user()->id === $liveClass->instructor_id, 403);

        $liveClass->update(['status' => 'ended', 'ended_at' => now()]);

        // Update attendee durations
        $liveClass->attendees()->whereNull('left_at')->update([
            'left_at' => now(),
            'duration_seconds' => \DB::raw("TIMESTAMPDIFF(SECOND, joined_at, NOW())"),
        ]);

        return response()->json(['success' => true, 'message' => 'Live class ended.']);
    }
}

// ── app/Http/Controllers/Api/V1/ProgressController.php ──────
class ProgressController extends Controller
{
    public function courseProgress(Request $request, string $slug): JsonResponse
    {
        $course = \App\Models\Course::where('slug', $slug)->firstOrFail();
        $user = $request->user();

        $totalLessons = $course->lessons()->where('is_published', true)->count();
        $completedIds = \App\Models\LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        $percentage = $totalLessons > 0
            ? round(($completedIds->count() / $totalLessons) * 100, 1)
            : 0;

        // Last watched lesson
        $lastProgress = \App\Models\LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->orderByDesc('last_watched_at')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'percentage' => $percentage,
                'completed_lessons' => $completedIds->count(),
                'total_lessons' => $totalLessons,
                'completed_lesson_ids' => $completedIds->values(),
                'last_lesson_id' => $lastProgress?->lesson_id,
                'certificate_eligible' => $percentage >= 100 && $course->certificate_enabled,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'watch_seconds' => 'integer|min:0',
            'watch_percent' => 'numeric|min:0|max:100',
            'is_completed' => 'boolean',
        ]);

        $lesson = \App\Models\Lesson::findOrFail($request->lesson_id);
        $user = $request->user();

        // Must be enrolled
        abort_unless($user->isEnrolledIn($lesson->course_id), 403, 'Not enrolled in this course.');

        $progress = \App\Models\LessonProgress::updateOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'course_id' => $lesson->course_id,
                'watch_seconds' => $request->input('watch_seconds', 0),
                'watch_percent' => $request->input('watch_percent', 0),
                'last_watched_at' => now(),
                'is_completed' => $request->boolean('is_completed'),
                'completed_at' => $request->boolean('is_completed') ? now() : null,
            ]
        );

        return response()->json(['success' => true, 'data' => $progress]);
    }
}
