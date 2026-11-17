<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\StoreCourseRequest;
use App\Http\Requests\Course\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Http\Resources\CourseDetailResource;
use App\Http\Resources\CourseSummaryResource;
use App\Models\Course;
use App\Models\Enrollment;
use App\Services\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CourseController extends Controller
{
    public function __construct(private readonly CourseService $courseService)
    {
    }

    /**
     * List/search published courses
     */
    public function index(Request $request): JsonResponse
    {
        $query = Course::published()
            ->with(['instructor:id,name,avatar', 'category:id,name,slug'])
            ->withCount(['reviews', 'lessons'])
            ->select([
                'id', 'user_id', 'category_id', 'title', 'slug', 'subtitle',
                'thumbnail', 'level', 'pricing_type', 'price', 'sale_price',
                'sale_ends_at', 'currency', 'rating_avg', 'rating_count',
                'enrollments_count', 'duration_hours', 'lessons_count', 'language',
                'is_featured',
            ]);

        // Search
        if ($search = $request->string('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('subtitle', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($category = $request->string('category')) {
            $query->byCategory($category);
        }

        if ($level = $request->string('level')) {
            $query->forLevel($level);
        }

        if ($priceType = $request->string('price_type')) {
            $query->byPriceType($priceType);
        }

        if ($minPrice = $request->float('min_price')) {
            $query->where('price', '>=', $minPrice);
        }

        if ($maxPrice = $request->float('max_price')) {
            $query->where('price', '<=', $maxPrice);
        }

        if ($rating = $request->float('rating')) {
            $query->withMinRating($rating);
        }

        if ($language = $request->string('language')) {
            $query->where('language', $language);
        }

        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Sorting
        match ($request->string('sort', 'popular')->value()) {
            'newest'     => $query->orderByDesc('published_at'),
            'rating'     => $query->orderByDesc('rating_avg'),
            'price_low'  => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'popular'    => $query->orderByDesc('enrollments_count'),
            default      => $query->orderByDesc('enrollments_count'),
        };

        $courses = $query->paginate($request->integer('per_page', 12));

        // Attach wishlist/enrollment status if authenticated
        $user = $request->user();
        if ($user) {
            $courseIds = $courses->pluck('id');
            $wishlisted = $user->wishlist()->whereIn('course_id', $courseIds)->pluck('course_id')->flip();
            $enrolled = $user->enrollments()->whereIn('course_id', $courseIds)
                ->where('status', 'active')->pluck('course_id')->flip();

            $courses->each(function ($course) use ($wishlisted, $enrolled) {
                $course->is_wishlisted = $wishlisted->has($course->id);
                $course->is_enrolled = $enrolled->has($course->id);
            });
        }

        return response()->json([
            'success' => true,
            'data' => CourseSummaryResource::collection($courses),
            'meta' => [
                'total' => $courses->total(),
                'page' => $courses->currentPage(),
                'per_page' => $courses->perPage(),
                'last_page' => $courses->lastPage(),
            ],
        ]);
    }

    /**
     * Get full course detail (public + curriculum)
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $course = Course::where('slug', $slug)
            ->published()
            ->with([
                'instructor:id,name,avatar',
                'instructor.profile:user_id,bio,headline,twitter,linkedin',
                'category:id,name,slug',
                'tags:id,name,slug',
                'sections.lessons:id,section_id,title,type,duration_seconds,is_preview,is_published,sort_order',
            ])
            ->firstOrFail();

        $user = $request->user();
        $enrollment = null;
        $progress = [];

        if ($user) {
            $enrollment = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            if ($enrollment) {
                $progress = \App\Models\LessonProgress::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->pluck('is_completed', 'lesson_id')
                    ->toArray();
            }

            $course->is_wishlisted = $user->hasWishlisted($course->id);
        }

        $course->enrollment = $enrollment;
        $course->progress_map = $progress;
        $course->reviews_summary = [
            'avg' => $course->rating_avg,
            'total' => $course->rating_count,
            'distribution' => $course->getRatingDistribution(),
        ];

        // Track analytics
        \App\Models\AnalyticsEvent::create([
            'user_id' => $user?->id,
            'event' => 'course_viewed',
            'entity_type' => 'course',
            'entity_id' => $course->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => new CourseDetailResource($course),
        ]);
    }

    /**
     * Create new course (instructor only)
     */
    public function store(StoreCourseRequest $request): JsonResponse
    {
        Gate::authorize('create', Course::class);

        $course = $this->courseService->createCourse(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully.',
            'data' => new CourseResource($course),
        ], 201);
    }

    /**
     * Update course (owner or admin)
     */
    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        Gate::authorize('update', $course);

        $course = $this->courseService->updateCourse($course, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully.',
            'data' => new CourseResource($course),
        ]);
    }

    /**
     * Upload course thumbnail
     */
    public function uploadThumbnail(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('update', $course);

        $request->validate([
            'thumbnail' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $path = $this->courseService->uploadThumbnail($course, $request->file('thumbnail'));

        return response()->json([
            'success' => true,
            'data' => ['thumbnail_url' => \Storage::url($path)],
        ]);
    }

    /**
     * Publish course (submit for review)
     */
    public function publish(Course $course): JsonResponse
    {
        Gate::authorize('update', $course);

        if ($course->sections()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Course must have at least one section with lessons.',
            ], 422);
        }

        // In dev/staging, auto-approve. In prod, set to 'under_review'
        $status = app()->isProduction() ? 'under_review' : 'published';

        $course->update([
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $status === 'published'
                ? 'Course published successfully.'
                : 'Course submitted for review.',
        ]);
    }

    /**
     * Delete course (soft delete)
     */
    public function destroy(Course $course): JsonResponse
    {
        Gate::authorize('delete', $course);

        if ($course->enrollments()->where('status', 'active')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a course with active enrollments.',
            ], 422);
        }

        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully.',
        ]);
    }

    /**
     * Instructor's own courses
     */
    public function myCourses(Request $request): JsonResponse
    {
        $courses = Course::where('user_id', $request->user()->id)
            ->withCount(['enrollments', 'reviews'])
            ->with('category:id,name')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => CourseResource::collection($courses),
        ]);
    }
}
