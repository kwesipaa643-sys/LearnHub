<?php
/**
 * ============================================================
 * REMAINING CONTROLLERS — app/Http/Controllers/Api/V1/
 * ============================================================
 */

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// ════════════════════════════════════════════════════════════
// SectionController
// ════════════════════════════════════════════════════════════
class SectionController extends Controller
{
    public function index(int $courseId): JsonResponse
    {
        $course = \App\Models\Course::with(['sections.lessons' => fn($q) => $q->orderBy('sort_order')])->findOrFail($courseId);
        return response()->json(['success' => true, 'data' => $course->sections]);
    }

    public function store(Request $request, int $courseId): JsonResponse
    {
        $course = \App\Models\Course::findOrFail($courseId);
        Gate::authorize('update', $course);

        $request->validate(['title' => 'required|string|max:255', 'sort_order' => 'integer']);

        $section = $course->sections()->create([
            'title'      => $request->title,
            'sort_order' => $request->integer('sort_order', $course->sections()->count()),
        ]);

        return response()->json(['success' => true, 'data' => $section], 201);
    }

    public function update(Request $request, int $courseId, int $id): JsonResponse
    {
        $course = \App\Models\Course::findOrFail($courseId);
        Gate::authorize('update', $course);

        $request->validate(['title' => 'sometimes|string|max:255', 'description' => 'nullable|string']);
        $section = $course->sections()->findOrFail($id);
        $section->update($request->only(['title', 'description', 'sort_order']));

        return response()->json(['success' => true, 'data' => $section]);
    }

    public function destroy(int $courseId, int $id): JsonResponse
    {
        $course = \App\Models\Course::findOrFail($courseId);
        Gate::authorize('update', $course);
        $course->sections()->findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function reorder(Request $request, int $courseId): JsonResponse
    {
        $course = \App\Models\Course::findOrFail($courseId);
        Gate::authorize('update', $course);
        $request->validate(['sections' => 'required|array', 'sections.*.id' => 'required|integer', 'sections.*.sort_order' => 'required|integer']);

        foreach ($request->sections as $item) {
            $course->sections()->where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// LessonController
// ════════════════════════════════════════════════════════════
class LessonController extends Controller
{
    public function store(Request $request, int $sectionId): JsonResponse
    {
        $section = \App\Models\CourseSection::with('course')->findOrFail($sectionId);
        Gate::authorize('update', $section->course);

        $request->validate([
            'title'      => 'required|string|max:255',
            'type'       => 'required|in:video,article,quiz,assignment,download,embed,live',
            'sort_order' => 'integer',
        ]);

        $lesson = $section->lessons()->create([
            ...$request->only(['title', 'type', 'description', 'content', 'video_url', 'video_playback_id',
                'duration_seconds', 'embed_url', 'attachments', 'quiz_id', 'is_preview']),
            'course_id'    => $section->course_id,
            'is_published' => true,
            'sort_order'   => $request->integer('sort_order', $section->lessons()->count()),
        ]);

        // Update course lesson count
        $section->course->recalculateStats();

        return response()->json(['success' => true, 'data' => $lesson], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $lesson = \App\Models\Lesson::with('course')->findOrFail($id);
        Gate::authorize('update', $lesson->course);

        $lesson->update($request->only([
            'title', 'description', 'type', 'content', 'video_url', 'video_playback_id',
            'duration_seconds', 'embed_url', 'attachments', 'is_preview', 'is_published', 'sort_order',
        ]));

        if ($request->has('duration_seconds')) {
            $lesson->course->recalculateStats();
        }

        return response()->json(['success' => true, 'data' => new \App\Http\Resources\LessonResource($lesson)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $lesson = \App\Models\Lesson::with('course')->findOrFail($id);
        Gate::authorize('update', $lesson->course);
        $course = $lesson->course;
        $lesson->delete();
        $course->recalculateStats();
        return response()->json(['success' => true]);
    }

    public function uploadVideo(Request $request, int $id): JsonResponse
    {
        $lesson = \App\Models\Lesson::with('course')->findOrFail($id);
        Gate::authorize('update', $lesson->course);
        $request->validate(['video' => 'required|file|mimes:mp4,mov,avi,mkv,webm|max:2097152']); // 2GB

        // In production: upload to Mux or Bunny.net and get HLS URL
        // For now, store locally and return a placeholder response
        $path = $request->file('video')->store("courses/{$lesson->course_id}/videos", 'public');
        $lesson->update(['video_url' => \Storage::url($path)]);

        return response()->json(['success' => true, 'data' => ['upload_id' => uniqid(), 'status' => 'processing', 'video_url' => \Storage::url($path)]]);
    }

    public function addAttachment(Request $request, int $id): JsonResponse
    {
        $lesson = \App\Models\Lesson::with('course')->findOrFail($id);
        Gate::authorize('update', $lesson->course);
        $request->validate(['file' => 'required|file|max:51200', 'label' => 'required|string|max:100']); // 50MB

        $file = $request->file('file');
        $path = $file->store("courses/{$lesson->course_id}/attachments", 'public');

        $attachments = $lesson->attachments ?? [];
        $attachments[] = [
            'label'     => $request->label,
            'url'       => \Storage::url($path),
            'size'      => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];

        $lesson->update(['attachments' => $attachments]);

        return response()->json(['success' => true, 'data' => $lesson->attachments]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate(['lessons' => 'required|array', 'lessons.*.id' => 'required|integer',
            'lessons.*.sort_order' => 'required|integer', 'lessons.*.section_id' => 'required|integer']);

        foreach ($request->lessons as $item) {
            \App\Models\Lesson::where('id', $item['id'])->update([
                'sort_order' => $item['sort_order'],
                'section_id' => $item['section_id'],
            ]);
        }

        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// ReviewController
// ════════════════════════════════════════════════════════════
class ReviewController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $course = \App\Models\Course::where('slug', $slug)->firstOrFail();

        $reviews = $course->reviews()
            ->with('user:id,name,avatar')
            ->orderBy($request->input('sort', 'created_at') === 'rating' ? 'rating' : 'created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => $reviews->items(),
            'meta'    => ['total' => $reviews->total(), 'page' => $reviews->currentPage()],
        ]);
    }

    public function store(\App\Http\Requests\Review\StoreReviewRequest $request, string $slug): JsonResponse
    {
        $course = \App\Models\Course::where('slug', $slug)->firstOrFail();
        $user   = $request->user();

        // Must be enrolled
        abort_unless($user->isEnrolledIn($course->id), 403, 'You must be enrolled to leave a review.');

        // One review per user per course
        if ($course->reviews()->where('user_id', $user->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'You have already reviewed this course.'], 422);
        }

        $review = $course->reviews()->create([
            'user_id'              => $user->id,
            'rating'               => $request->rating,
            'title'                => $request->title,
            'content'              => $request->content,
            'status'               => 'approved',
            'is_verified_purchase' => true,
        ]);

        return response()->json(['success' => true, 'data' => $review->load('user:id,name,avatar')], 201);
    }

    public function update(\App\Http\Requests\Review\StoreReviewRequest $request, int $id): JsonResponse
    {
        $review = \App\Models\Review::findOrFail($id);
        abort_if($review->user_id !== $request->user()->id, 403);
        $review->update($request->only(['rating', 'title', 'content']));
        return response()->json(['success' => true, 'data' => $review]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $review = \App\Models\Review::findOrFail($id);
        abort_if($review->user_id !== $request->user()->id && !$request->user()->isAdmin(), 403);
        $review->delete();
        return response()->json(['success' => true]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $reviews = \App\Models\Review::withTrashed()
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
            ->with(['user:id,name', 'course:id,title'])
            ->latest()->paginate(20);

        return response()->json(['success' => true, 'data' => $reviews->items()]);
    }

    public function moderate(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:approved,rejected']);
        \App\Models\Review::findOrFail($id)->update(['status' => $request->status]);
        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// EnrollmentController
// ════════════════════════════════════════════════════════════
class EnrollmentController extends Controller
{
    public function enroll(Request $request): JsonResponse
    {
        $request->validate(['course_id' => 'required|exists:courses,id']);
        $user   = $request->user();
        $course = \App\Models\Course::published()->findOrFail($request->course_id);

        if ($user->isEnrolledIn($course->id)) {
            return response()->json(['success' => false, 'message' => 'Already enrolled.'], 422);
        }

        if ($course->pricing_type !== 'free') {
            return response()->json(['success' => false, 'message' => 'This is a paid course. Please purchase it first.'], 422);
        }

        $enrollment = \App\Models\Enrollment::create([
            'user_id'     => $user->id,
            'course_id'   => $course->id,
            'status'      => 'active',
            'amount_paid' => 0,
            'enrolled_at' => now(),
        ]);

        $course->increment('enrollments_count');

        return response()->json([
            'success' => true,
            'data'    => ['enrollment_id' => $enrollment->id, 'course_slug' => $course->slug],
        ], 201);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $enrollments = \App\Models\Enrollment::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->with(['course.instructor:id,name,avatar', 'course.category:id,name,slug'])
            ->latest('enrolled_at')
            ->get();

        $result = $enrollments->map(function ($enrollment) {
            $course       = $enrollment->course;
            $totalLessons = $course->lessons()->where('is_published', true)->count();
            $completed    = \App\Models\LessonProgress::where('user_id', $enrollment->user_id)
                ->where('course_id', $course->id)->where('is_completed', true)->count();
            $pct          = $totalLessons > 0 ? round(($completed / $totalLessons) * 100, 1) : 0;

            $lastProgress = \App\Models\LessonProgress::where('user_id', $enrollment->user_id)
                ->where('course_id', $course->id)->orderByDesc('last_watched_at')->first();

            return [
                'course'     => new \App\Http\Resources\CourseSummaryResource($course),
                'enrollment' => ['id' => $enrollment->id, 'status' => $enrollment->status, 'enrolled_at' => $enrollment->enrolled_at],
                'progress'   => [
                    'completed_lessons' => $completed,
                    'total_lessons'     => $totalLessons,
                    'percentage'        => $pct,
                    'last_lesson'       => $lastProgress?->lesson ? [
                        'id'    => $lastProgress->lesson->id,
                        'title' => $lastProgress->lesson->title,
                    ] : null,
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $result]);
    }
}

// ════════════════════════════════════════════════════════════
// DiscussionController
// ════════════════════════════════════════════════════════════
class DiscussionController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $course      = \App\Models\Course::where('slug', $slug)->firstOrFail();
        $discussions = \App\Models\Discussion::where('course_id', $course->id)
            ->when($request->integer('lesson_id'), fn($q, $lid) => $q->where('lesson_id', $lid))
            ->with('user:id,name,avatar,role')
            ->withCount('replies')
            ->orderByDesc('is_pinned')->latest()
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $discussions->items()]);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $request->validate(['title' => 'required|string|max:255', 'content' => 'required|string', 'lesson_id' => 'nullable|exists:lessons,id']);
        $course = \App\Models\Course::where('slug', $slug)->firstOrFail();
        abort_unless($request->user()->isEnrolledIn($course->id) || $request->user()->isAdmin(), 403);

        $discussion = \App\Models\Discussion::create([
            'user_id'   => $request->user()->id,
            'course_id' => $course->id,
            'lesson_id' => $request->lesson_id,
            'title'     => $request->title,
            'content'   => $request->content,
        ]);

        return response()->json(['success' => true, 'data' => $discussion->load('user:id,name,avatar')], 201);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $request->validate(['content' => 'required|string', 'parent_id' => 'nullable|exists:discussion_replies,id']);
        $discussion = \App\Models\Discussion::findOrFail($id);

        $reply = \App\Models\DiscussionReply::create([
            'discussion_id' => $discussion->id,
            'user_id'       => $request->user()->id,
            'content'       => $request->content,
            'parent_id'     => $request->parent_id,
        ]);

        $discussion->increment('replies_count');

        return response()->json(['success' => true, 'data' => $reply->load('user:id,name,avatar,role')], 201);
    }

    public function upvote(Request $request, int $id): JsonResponse
    {
        \App\Models\DiscussionReply::findOrFail($id)->increment('upvotes_count');
        return response()->json(['success' => true]);
    }

    public function markAnswered(Request $request, int $id): JsonResponse
    {
        $discussion = \App\Models\Discussion::findOrFail($id);
        abort_if($discussion->user_id !== $request->user()->id && !$request->user()->isAdmin(), 403);
        $discussion->update(['is_answered' => true]);
        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// NoteController
// ════════════════════════════════════════════════════════════
class NoteController extends Controller
{
    public function index(Request $request, int $lessonId): JsonResponse
    {
        $notes = \App\Models\LessonNote::where('user_id', $request->user()->id)
            ->where('lesson_id', $lessonId)->orderBy('timestamp_seconds')->get();
        return response()->json(['success' => true, 'data' => $notes]);
    }

    public function store(Request $request, int $lessonId): JsonResponse
    {
        $request->validate(['content' => 'required|string|max:2000', 'timestamp_seconds' => 'nullable|integer|min:0']);
        $note = \App\Models\LessonNote::create([
            'user_id'            => $request->user()->id,
            'lesson_id'          => $lessonId,
            'content'            => $request->content,
            'timestamp_seconds'  => $request->timestamp_seconds,
        ]);
        return response()->json(['success' => true, 'data' => $note], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $note = \App\Models\LessonNote::where('user_id', $request->user()->id)->findOrFail($id);
        $note->update(['content' => $request->validate(['content' => 'required|string|max:2000'])['content']]);
        return response()->json(['success' => true, 'data' => $note]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        \App\Models\LessonNote::where('user_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// QuizController
// ════════════════════════════════════════════════════════════
class QuizController extends Controller
{
    public function lessonQuiz(int $lessonId): JsonResponse
    {
        $lesson = \App\Models\Lesson::findOrFail($lessonId);
        abort_unless($lesson->quiz_id, 404, 'No quiz attached to this lesson.');
        $quiz = \App\Models\Quiz::with('questions.options')->findOrFail($lesson->quiz_id);
        return response()->json(['success' => true, 'data' => $quiz]);
    }

    public function startAttempt(Request $request, int $id): JsonResponse
    {
        $quiz = \App\Models\Quiz::findOrFail($id);

        // Check max attempts
        if ($quiz->max_attempts) {
            $count = \App\Models\QuizAttempt::where('user_id', $request->user()->id)
                ->where('quiz_id', $id)->whereNotNull('submitted_at')->count();
            if ($count >= $quiz->max_attempts) {
                return response()->json(['success' => false, 'message' => 'Maximum attempts reached.'], 422);
            }
        }

        $attempt   = \App\Models\QuizAttempt::create([
            'user_id'    => $request->user()->id,
            'quiz_id'    => $id,
            'started_at' => now(),
        ]);

        $expiresAt = $quiz->time_limit_minutes
            ? now()->addMinutes($quiz->time_limit_minutes)->toIsoString()
            : null;

        return response()->json(['success' => true, 'data' => ['attempt_id' => $attempt->id, 'expires_at' => $expiresAt]]);
    }

    public function submitAttempt(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'attempt_id' => 'required|integer',
            'answers'    => 'required|array',
            'answers.*.question_id'      => 'required|integer',
            'answers.*.selected_options' => 'sometimes|array',
            'answers.*.text_answer'      => 'sometimes|nullable|string',
        ]);

        $quiz    = \App\Models\Quiz::with('questions.options')->findOrFail($id);
        $attempt = \App\Models\QuizAttempt::where('user_id', $request->user()->id)
            ->where('quiz_id', $id)->findOrFail($request->attempt_id);

        $totalPoints = 0;
        $earnedPoints = 0;
        $answerRecords = [];

        foreach ($quiz->questions as $question) {
            $answerInput = collect($request->answers)->firstWhere('question_id', $question->id);
            $totalPoints += $question->points;
            $isCorrect   = false;

            if ($question->type === 'fill_blank') {
                $correctOption = $question->options->firstWhere('is_correct', true);
                $isCorrect     = $correctOption && strtolower(trim($answerInput['text_answer'] ?? '')) === strtolower(trim($correctOption->content));
            } else {
                $selectedIds  = $answerInput['selected_options'] ?? [];
                $correctIds   = $question->options->where('is_correct', true)->pluck('id')->toArray();
                $isCorrect    = !array_diff($correctIds, $selectedIds) && !array_diff($selectedIds, $correctIds);
            }

            $pts = $isCorrect ? $question->points : 0;
            $earnedPoints += $pts;

            $answerRecords[] = [
                'attempt_id'       => $attempt->id,
                'question_id'      => $question->id,
                'selected_options' => json_encode($answerInput['selected_options'] ?? []),
                'text_answer'      => $answerInput['text_answer'] ?? null,
                'is_correct'       => $isCorrect,
                'points_earned'    => $pts,
            ];
        }

        \App\Models\QuizAttemptAnswer::insert($answerRecords);

        $percentage = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100, 1) : 0;
        $passed     = $percentage >= $quiz->passing_score;

        $attempt->update([
            'score'             => $earnedPoints,
            'max_score'         => $totalPoints,
            'percentage'        => $percentage,
            'passed'            => $passed,
            'submitted_at'      => now(),
            'time_taken_seconds'=> now()->diffInSeconds($attempt->started_at),
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'score'      => $earnedPoints,
                'max_score'  => $totalPoints,
                'percentage' => $percentage,
                'passed'     => $passed,
                'questions'  => $quiz->show_answers_after ? $quiz->questions : null,
                'answers'    => $quiz->show_answers_after ? $attempt->answers : null,
            ],
        ]);
    }

    public function myAttempts(Request $request, int $id): JsonResponse
    {
        $attempts = \App\Models\QuizAttempt::where('user_id', $request->user()->id)
            ->where('quiz_id', $id)->orderByDesc('created_at')->get();
        return response()->json(['success' => true, 'data' => $attempts]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'course_id'            => 'required|exists:courses,id',
            'title'                => 'required|string|max:255',
            'time_limit_minutes'   => 'nullable|integer|min:1',
            'passing_score'        => 'integer|min:1|max:100',
            'max_attempts'         => 'nullable|integer|min:1',
            'questions'            => 'required|array|min:1',
            'questions.*.question' => 'required|string',
            'questions.*.type'     => 'required|in:multiple_choice,true_false,fill_blank,multi_select',
            'questions.*.options'  => 'required|array|min:2',
        ]);

        $quiz = \App\Models\Quiz::create($request->only([
            'course_id', 'title', 'description', 'time_limit_minutes',
            'passing_score', 'max_attempts', 'randomize_questions', 'show_answers_after',
        ]));

        foreach ($request->questions as $idx => $qData) {
            $question = $quiz->questions()->create([
                'type'       => $qData['type'],
                'question'   => $qData['question'],
                'explanation'=> $qData['explanation'] ?? null,
                'points'     => $qData['points'] ?? 1,
                'sort_order' => $idx,
            ]);
            foreach ($qData['options'] as $oIdx => $opt) {
                $question->options()->create([
                    'content'    => $opt['content'],
                    'is_correct' => $opt['is_correct'],
                    'sort_order' => $oIdx,
                ]);
            }
        }

        return response()->json(['success' => true, 'data' => $quiz->load('questions.options')], 201);
    }
}

// ════════════════════════════════════════════════════════════
// ProfileController
// ════════════════════════════════════════════════════════════
class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => new \App\Http\Resources\UserResource($request->user()->load('profile'))]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'headline' => 'sometimes|nullable|string|max:120',
            'bio'      => 'sometimes|nullable|string|max:2000',
            'website'  => 'sometimes|nullable|url|max:255',
            'twitter'  => 'sometimes|nullable|string|max:100',
            'linkedin' => 'sometimes|nullable|string|max:100',
            'github'   => 'sometimes|nullable|string|max:100',
            'timezone' => 'sometimes|timezone',
            'language' => 'sometimes|string|max:10',
        ]);

        $user = $request->user();
        if ($request->has('name')) $user->update(['name' => $request->name]);

        $profileFields = ['headline', 'bio', 'website', 'twitter', 'linkedin', 'github', 'timezone', 'language'];
        $profileData   = $request->only($profileFields);

        if (!empty($profileData)) {
            $user->profile()->updateOrCreate(['user_id' => $user->id], $profileData);
        }

        return response()->json(['success' => true, 'data' => new \App\Http\Resources\UserResource($user->fresh(['profile']))]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048']);
        $user = $request->user();

        if ($user->avatar) \Storage::delete($user->avatar);

        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');
        $user->update(['avatar' => $path]);

        return response()->json(['success' => true, 'data' => ['avatar_url' => \Storage::url($path)]]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();
        if (!\Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'errors' => ['current_password' => ['Current password is incorrect.']]], 422);
        }

        $user->update(['password' => \Hash::make($request->password)]);
        $user->tokens()->delete(); // Revoke all tokens - force re-login

        return response()->json(['success' => true, 'message' => 'Password changed. Please log in again.']);
    }

    public function updateNotifications(Request $request): JsonResponse
    {
        $request->validate(['*' => 'boolean']);
        $user = $request->user();
        $prefs = array_merge($user->profile->preferences ?? [], $request->all());
        $user->profile()->update(['preferences' => $prefs]);
        return response()->json(['success' => true]);
    }

    public function publicProfile(int $id): JsonResponse
    {
        $user = \App\Models\User::with('profile')->findOrFail($id);

        $stats = [];
        if ($user->isInstructor()) {
            $stats = [
                'courses_count'  => $user->courses()->published()->count(),
                'students_count' => \App\Models\Enrollment::whereHas('course', fn($q) => $q->where('user_id', $id))->count(),
                'rating_avg'     => round(\App\Models\Review::whereHas('course', fn($q) => $q->where('user_id', $id))->avg('rating') ?? 0, 1),
                'reviews_count'  => \App\Models\Review::whereHas('course', fn($q) => $q->where('user_id', $id))->count(),
            ];
        }

        return response()->json(['success' => true, 'data' => array_merge((new \App\Http\Resources\UserResource($user))->toArray(request()), ['stats' => $stats])]);
    }
}

// ════════════════════════════════════════════════════════════
// SearchController
// ════════════════════════════════════════════════════════════
class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2|max:100']);
        $q    = $request->string('q');
        $type = $request->input('type', 'courses');

        $courses     = [];
        $instructors = [];

        if (in_array($type, ['courses', 'all'])) {
            $courses = \App\Models\Course::search($q)
                ->where('status', 'published')
                ->take(12)
                ->get()
                ->load('instructor:id,name,avatar', 'category:id,name,slug');

            $courses = \App\Http\Resources\CourseSummaryResource::collection($courses);
        }

        if (in_array($type, ['instructors', 'all'])) {
            $instructors = \App\Models\User::where('role', 'instructor')
                ->where('name', 'like', "%{$q}%")
                ->with('profile:user_id,headline')
                ->take(6)->get();
        }

        return response()->json(['success' => true, 'data' => compact('courses', 'instructors')]);
    }
}

// ════════════════════════════════════════════════════════════
// CategoryController
// ════════════════════════════════════════════════════════════
class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $cats = \App\Models\Category::whereNull('parent_id')
            ->withCount('courses')
            ->with('children:id,name,slug,parent_id,icon')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $cats]);
    }

    public function courses(Request $request, string $slug): JsonResponse
    {
        $cat     = \App\Models\Category::where('slug', $slug)->firstOrFail();
        $courses = \App\Models\Course::published()
            ->where('category_id', $cat->id)
            ->with('instructor:id,name,avatar', 'category:id,name,slug')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data'    => \App\Http\Resources\CourseSummaryResource::collection($courses),
            'meta'    => ['total' => $courses->total()],
        ]);
    }

    public function tags(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => \App\Models\Tag::orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required|string|max:100', 'slug' => 'required|unique:categories', 'icon' => 'nullable|string', 'parent_id' => 'nullable|exists:categories,id']);
        $cat = \App\Models\Category::create($request->only(['name', 'slug', 'icon', 'color', 'description', 'parent_id', 'sort_order', 'is_featured']));
        return response()->json(['success' => true, 'data' => $cat], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cat = \App\Models\Category::findOrFail($id);
        $cat->update($request->only(['name', 'icon', 'color', 'description', 'sort_order', 'is_featured']));
        return response()->json(['success' => true, 'data' => $cat]);
    }

    public function destroy(int $id): JsonResponse
    {
        \App\Models\Category::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// WishlistController
// ════════════════════════════════════════════════════════════
class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $courses = $request->user()->wishlisted()
            ->with('instructor:id,name,avatar', 'category:id,name,slug')
            ->get();

        return response()->json(['success' => true, 'data' => \App\Http\Resources\CourseSummaryResource::collection($courses)]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['course_id' => 'required|exists:courses,id']);
        \App\Models\Wishlist::firstOrCreate(['user_id' => $request->user()->id, 'course_id' => $request->course_id]);
        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, int $courseId): JsonResponse
    {
        \App\Models\Wishlist::where('user_id', $request->user()->id)->where('course_id', $courseId)->delete();
        return response()->json(['success' => true]);
    }
}

// ════════════════════════════════════════════════════════════
// Admin Controllers
// ════════════════════════════════════════════════════════════
namespace App\Http\Controllers\Api\V1\Admin;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = [
            'total_users'            => \App\Models\User::count(),
            'total_courses'          => \App\Models\Course::published()->count(),
            'total_enrollments'      => \App\Models\Enrollment::count(),
            'total_revenue'          => \App\Models\Payment::where('status', 'succeeded')->sum('amount'),
            'new_users_this_month'   => \App\Models\User::whereMonth('created_at', now()->month)->count(),
            'new_courses_this_month' => \App\Models\Course::whereMonth('created_at', now()->month)->count(),
            'monthly_revenue'        => \App\Models\Payment::where('status', 'succeeded')
                ->selectRaw("DATE_FORMAT(paid_at, '%b') as month, SUM(amount) as amount")
                ->whereYear('paid_at', now()->year)
                ->groupByRaw("MONTH(paid_at), DATE_FORMAT(paid_at, '%b')")
                ->orderByRaw('MONTH(paid_at)')
                ->get(),
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    public function revenueReport(Request $request): JsonResponse
    {
        $from = $request->input('from', now()->startOfMonth());
        $to   = $request->input('to', now()->endOfMonth());

        $revenue = \App\Models\Payment::where('status', 'succeeded')
            ->whereBetween('paid_at', [$from, $to])
            ->selectRaw("DATE(paid_at) as date, SUM(amount) as amount, COUNT(*) as transactions")
            ->groupBy('date')->orderBy('date')->get();

        return response()->json(['success' => true, 'data' => $revenue]);
    }
}

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = \App\Models\User::with('profile:user_id,headline')
            ->when($request->input('search'), fn($q, $s) => $q->where('name', 'like', "%$s%")->orWhere('email', 'like', "%$s%"))
            ->when($request->input('role'), fn($q, $r) => $q->where('role', $r))
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
            ->latest()->paginate(20);

        return response()->json(['success' => true, 'data' => $users->items(), 'meta' => ['total' => $users->total()]]);
    }

    public function show(int $id): JsonResponse
    {
        $user = \App\Models\User::with(['profile', 'enrollments', 'courses'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => new \App\Http\Resources\UserResource($user)]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,suspended,pending']);
        \App\Models\User::findOrFail($id)->update(['status' => $request->status]);
        return response()->json(['success' => true]);
    }

    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate(['role' => 'required|in:student,instructor,admin']);
        \App\Models\User::findOrFail($id)->update(['role' => $request->role]);
        return response()->json(['success' => true]);
    }
}

class AdminCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $courses = \App\Models\Course::withTrashed()
            ->when($request->input('status'), fn($q, $s) => $q->where('status', $s))
            ->with('instructor:id,name', 'category:id,name')
            ->latest()->paginate(20);

        return response()->json(['success' => true, 'data' => \App\Http\Resources\CourseResource::collection($courses)]);
    }

    public function approve(int $id): JsonResponse
    {
        $course = \App\Models\Course::findOrFail($id);
        $course->update(['status' => 'published', 'published_at' => now()]);
        $course->instructor->notify(new \App\Notifications\CourseApproved($course));
        return response()->json(['success' => true, 'message' => 'Course approved and published.']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $course = \App\Models\Course::findOrFail($id);
        $course->update(['status' => 'draft']);
        $course->instructor->notify(new \App\Notifications\CourseRejected($course, $request->reason));
        return response()->json(['success' => true, 'message' => 'Course rejected.']);
    }
}

// ════════════════════════════════════════════════════════════
// Instructor Controllers
// ════════════════════════════════════════════════════════════
namespace App\Http\Controllers\Api\V1\Instructor;

class InstructorDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $courseIds = $user->courses()->pluck('id');

        $stats = [
            'total_students'  => \App\Models\Enrollment::whereIn('course_id', $courseIds)->count(),
            'total_revenue'   => \App\Models\Payment::whereHas('order.items', fn($q) => $q->whereIn('course_id', $courseIds))
                ->where('status', 'succeeded')->sum('amount') * ($user->profile->revenue_share / 100),
            'pending_payout'  => 0, // Would track withdrawals
            'total_courses'   => $user->courses()->count(),
            'avg_rating'      => round(\App\Models\Review::whereIn('course_id', $courseIds)->avg('rating') ?? 0, 1),
            'monthly_revenue' => \App\Models\Payment::whereHas('order.items', fn($q) => $q->whereIn('course_id', $courseIds))
                ->where('status', 'succeeded')
                ->selectRaw("DATE_FORMAT(paid_at, '%b') as month, SUM(amount) as amount")
                ->whereYear('paid_at', now()->year)
                ->groupByRaw("MONTH(paid_at), DATE_FORMAT(paid_at, '%b')")
                ->orderByRaw('MONTH(paid_at)')
                ->get(),
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    public function earnings(Request $request): JsonResponse
    {
        $user      = $request->user();
        $courseIds = $user->courses()->pluck('id');
        $share     = $user->profile->revenue_share / 100;

        $earnings = \App\Models\Payment::whereHas('order.items', fn($q) => $q->whereIn('course_id', $courseIds))
            ->where('status', 'succeeded')
            ->selectRaw("DATE_FORMAT(paid_at, '%Y-%m') as period, SUM(amount) as gross, SUM(amount) * {$share} as net, COUNT(*) as sales")
            ->groupBy('period')->orderByDesc('period')->paginate(12);

        return response()->json(['success' => true, 'data' => $earnings->items()]);
    }

    public function requestPayout(Request $request): JsonResponse
    {
        // Simplified - in production integrate with Stripe Payouts or bank transfers
        return response()->json(['success' => true, 'message' => 'Payout request submitted. Processing within 5-7 business days.']);
    }
}

class InstructorAnalyticsController extends Controller
{
    public function courseAnalytics(Request $request, int $id): JsonResponse
    {
        $course = \App\Models\Course::where('user_id', $request->user()->id)->findOrFail($id);

        $totalStudents = $course->enrollments()->count();
        $totalLessons  = $course->lessons()->where('is_published', true)->count();

        $lessonRates = $course->lessons()->where('is_published', true)->get()->map(function ($lesson) use ($totalStudents) {
            $completed = \App\Models\LessonProgress::where('lesson_id', $lesson->id)->where('is_completed', true)->count();
            return [
                'lesson_id' => $lesson->id,
                'title'     => $lesson->title,
                'rate'      => $totalStudents > 0 ? round(($completed / $totalStudents) * 100, 1) : 0,
                'completed' => $completed,
            ];
        });

        $completedAll = \App\Models\Enrollment::where('course_id', $id)->where('status', 'completed')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'views'                  => \App\Models\AnalyticsEvent::where('entity_type', 'course')->where('entity_id', $id)->where('event', 'course_viewed')->count(),
                'enrollments'            => $totalStudents,
                'completion_rate'        => $totalStudents > 0 ? round(($completedAll / $totalStudents) * 100, 1) : 0,
                'revenue'                => \App\Models\Payment::whereHas('order.items', fn($q) => $q->where('course_id', $id))->where('status', 'succeeded')->sum('amount'),
                'lesson_completion_rates'=> $lessonRates,
            ],
        ]);
    }
}
