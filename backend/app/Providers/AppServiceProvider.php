<?php
// ── app/Providers/AppServiceProvider.php ──────────────────────
namespace App\Providers;

use App\Models\Course;
use App\Policies\CoursePolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Force HTTPS URLs in production
        if ($this->app->isProduction()) {
            URL::forceScheme('https');
        }

        // Register policies
        Gate::policy(Course::class, CoursePolicy::class);

        // Custom rate limiters
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Prevent lazy loading in non-production (catches N+1 queries)
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(!$this->app->isProduction());
    }
}

// ── routes/console.php ────────────────────────────────────────
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduled tasks
Schedule::command('scout:import "App\Models\Course"')->hourly();
Schedule::command('queue:prune-failed --hours=72')->daily();
Schedule::command('sanctum:prune-expired --hours=744')->daily();
Schedule::command('model:prune')->daily();

// Custom: expire stale subscriptions
Schedule::call(function () {
    \App\Models\Subscription::where('status', 'active')
        ->where('current_period_end', '<', now())
        ->update(['status' => 'expired']);
})->daily()->name('expire-subscriptions');

// Custom: remind students of upcoming live classes
Schedule::call(function () {
    $upcoming = \App\Models\LiveClass::where('status', 'scheduled')
        ->whereBetween('scheduled_at', [now()->addMinutes(25), now()->addMinutes(35)])
        ->get();

    foreach ($upcoming as $liveClass) {
        $enrolledUsers = \App\Models\Enrollment::where('course_id', $liveClass->course_id)
            ->where('status', 'active')->with('user')->get()->pluck('user');

        foreach ($enrolledUsers as $user) {
            $user->notify(new \App\Notifications\LiveClassReminder($liveClass));
        }
    }
})->everyFiveMinutes()->name('live-class-reminders');
