<?php
// ── app/Policies/CoursePolicy.php ────────────────────────────
namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function viewAny(?User $user): bool { return true; }
    public function view(?User $user, Course $course): bool { return true; }

    public function create(User $user): bool
    {
        return in_array($user->role, ['instructor', 'admin']);
    }

    public function update(User $user, Course $course): bool
    {
        return $user->isAdmin() || $user->id === $course->user_id;
    }

    public function delete(User $user, Course $course): bool
    {
        return $user->isAdmin() || $user->id === $course->user_id;
    }
}

// ── app/Notifications/CourseApproved.php ─────────────────────
namespace App\Notifications;

use App\Models\Course;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CourseApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Course $course) {}

    public function via($notifiable): array { return ['mail', 'database']; }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("✅ Your Course Has Been Approved — {$this->course->title}")
            ->greeting("Great news, {$notifiable->name}!")
            ->line("Your course **{$this->course->title}** has been reviewed and approved.")
            ->line("It's now live and available to all learners on the platform.")
            ->action('View Your Course', config('app.frontend_url') . "/courses/{$this->course->slug}")
            ->line('Keep up the amazing work! 🎓');
    }

    public function toArray($notifiable): array
    {
        return [
            'title'      => '✅ Course Approved!',
            'message'    => "Your course \"{$this->course->title}\" is now live.",
            'action_url' => "/courses/{$this->course->slug}",
            'course_id'  => $this->course->id,
        ];
    }
}

// ── app/Notifications/CourseRejected.php ─────────────────────
class CourseRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Course $course, public string $reason) {}

    public function via($notifiable): array { return ['mail', 'database']; }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Course Review: Action Required — {$this->course->title}")
            ->greeting("Hi {$notifiable->name},")
            ->line("Your course **{$this->course->title}** requires some changes before it can be published.")
            ->line("**Reason:** {$this->reason}")
            ->action('Edit Your Course', config('app.frontend_url') . "/instructor/courses/{$this->course->id}/edit")
            ->line('Please make the necessary updates and resubmit for review.');
    }

    public function toArray($notifiable): array
    {
        return [
            'title'      => '⚠️ Course Needs Changes',
            'message'    => "Your course \"{$this->course->title}\" needs revisions: {$this->reason}",
            'action_url' => "/instructor/courses/{$this->course->id}/edit",
            'course_id'  => $this->course->id,
        ];
    }
}

// ── app/Jobs/GenerateCertificate.php ─────────────────────────
namespace App\Jobs;

use App\Models\Enrollment;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateCertificate implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(public int $userId, public int $courseId) {}

    public function handle(CertificateService $certService): void
    {
        $user = User::find($this->userId);
        if (!$user) return;

        try {
            $certService->generateCertificate($user, $this->courseId);
        } catch (\Exception $e) {
            Log::error('Certificate generation failed', [
                'user_id'   => $this->userId,
                'course_id' => $this->courseId,
                'error'     => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}

// ── app/Jobs/SendWelcomeEmail.php ────────────────────────────
class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function handle(): void
    {
        // Send welcome email via Mail facade
        \Illuminate\Support\Facades\Mail::to($this->user)->send(new \App\Mail\WelcomeEmail($this->user));
    }
}

// ── app/Events/UserRegistered.php ────────────────────────────
namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserRegistered
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user) {}
}

// ── app/Listeners/SendVerificationEmail.php ──────────────────
namespace App\Listeners;

use App\Events\UserRegistered;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendVerificationEmail implements ShouldQueue
{
    public function handle(UserRegistered $event): void
    {
        $event->user->sendEmailVerificationNotification();
    }
}

// ── routes/console.php ───────────────────────────────────────
use Illuminate\Support\Facades\Schedule;

Schedule::command('scout:import "App\Models\Course"')->hourly();
Schedule::command('queue:prune-failed')->daily();
Schedule::command('sanctum:prune-expired --hours=744')->daily(); // 31 days
