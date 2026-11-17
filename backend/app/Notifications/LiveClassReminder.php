<?php
// app/Notifications/LiveClassReminder.php
namespace App\Notifications;

use App\Models\LiveClass;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LiveClassReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public LiveClass $liveClass) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("⏰ Starting Soon: {$this->liveClass->title}")
            ->greeting("Hi {$notifiable->name}!")
            ->line("Your live class **{$this->liveClass->title}** starts in 30 minutes.")
            ->line("Scheduled for: " . $this->liveClass->scheduled_at->format('F j, Y \a\t g:i A'))
            ->action('Join Live Class', config('app.frontend_url') . "/live/{$this->liveClass->id}")
            ->line('See you there! 🎥');
    }

    public function toArray($notifiable): array
    {
        return [
            'title'      => '⏰ Live Class Starting Soon',
            'message'    => "{$this->liveClass->title} starts in 30 minutes",
            'action_url' => "/live/{$this->liveClass->id}",
            'live_class_id' => $this->liveClass->id,
        ];
    }
}
