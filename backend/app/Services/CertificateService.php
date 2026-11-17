<?php
// app/Services/CertificateService.php
namespace App\Services;

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use App\Notifications\CertificateIssued;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Check eligibility and generate certificate for a user+course.
     */
    public function generateCertificate(User $user, int $courseId): Certificate
    {
        $course = Course::findOrFail($courseId);
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->firstOrFail();

        // Check if already generated
        $existing = Certificate::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();

        if ($existing) return $existing;

        // Verify 100% completion
        $totalLessons = $course->lessons()->where('is_published', true)->count();
        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('is_completed', true)
            ->count();

        if ($totalLessons === 0 || $completedLessons < $totalLessons) {
            throw new \RuntimeException('Course not yet completed. Complete all lessons first.');
        }

        // Create certificate record
        $certificate = Certificate::create([
            'uuid' => Str::uuid(),
            'user_id' => $user->id,
            'course_id' => $courseId,
            'enrollment_id' => $enrollment->id,
            'issued_at' => now(),
        ]);

        // Generate PDF
        $pdfPath = $this->generatePdf($certificate, $user, $course);
        $certificate->update(['pdf_path' => $pdfPath]);

        // Mark enrollment as completed
        $enrollment->update(['completed_at' => now(), 'status' => 'completed']);

        // Send notification
        $user->notify(new CertificateIssued($certificate));

        return $certificate->fresh(['user', 'course']);
    }

    /**
     * Generate the PDF file and return the storage path.
     */
    private function generatePdf(Certificate $certificate, User $user, Course $course): string
    {
        $data = [
            'certificate' => $certificate,
            'user' => $user,
            'course' => $course,
            'instructor' => $course->instructor,
            'issued_date' => $certificate->issued_at->format('F j, Y'),
            'verify_url' => $certificate->verify_url,
        ];

        $pdf = Pdf::loadView('certificates.template', $data)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
                'dpi' => 150,
            ]);

        $path = "certificates/{$certificate->uuid}.pdf";
        Storage::put($path, $pdf->output());

        return $path;
    }
}
