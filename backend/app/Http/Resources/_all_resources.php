<?php
/**
 * ============================================================
 * API RESOURCES — app/Http/Resources/
 * ============================================================
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// ── UserResource.php ─────────────────────────────────────────
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'role'              => $this->role,
            'status'            => $this->status,
            'avatar'            => $this->avatar,
            'avatar_url'        => $this->avatar_url,
            'email_verified_at' => $this->email_verified_at,
            'created_at'        => $this->created_at,
            'profile'           => $this->whenLoaded('profile', fn() => [
                'bio'          => $this->profile->bio,
                'headline'     => $this->profile->headline,
                'website'      => $this->profile->website,
                'twitter'      => $this->profile->twitter,
                'linkedin'     => $this->profile->linkedin,
                'youtube'      => $this->profile->youtube,
                'github'       => $this->profile->github,
                'timezone'     => $this->profile->timezone,
                'language'     => $this->profile->language,
                'phone'        => $this->profile->phone,
                'country'      => $this->profile->country,
                'preferences'  => $this->profile->preferences,
                'revenue_share'=> $this->profile->revenue_share,
                'payout_email' => $this->profile->payout_email,
            ]),
        ];
    }
}

// ── CourseResource.php ───────────────────────────────────────
class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'title'               => $this->title,
            'slug'                => $this->slug,
            'subtitle'            => $this->subtitle,
            'description'         => $this->description,
            'what_you_learn'      => $this->what_you_learn,
            'requirements'        => $this->requirements,
            'for_whom'            => $this->for_whom,
            'thumbnail'           => $this->thumbnail,
            'thumbnail_url'       => $this->thumbnail_url,
            'trailer_video'       => $this->trailer_video,
            'level'               => $this->level,
            'status'              => $this->status,
            'pricing_type'        => $this->pricing_type,
            'price'               => $this->price,
            'sale_price'          => $this->sale_price,
            'sale_ends_at'        => $this->sale_ends_at,
            'currency'            => $this->currency,
            'language'            => $this->language,
            'is_featured'         => $this->is_featured,
            'certificate_enabled' => $this->certificate_enabled,
            'duration_hours'      => $this->duration_hours,
            'lessons_count'       => $this->lessons_count,
            'enrollments_count'   => $this->enrollments_count,
            'rating_avg'          => round($this->rating_avg, 1),
            'rating_count'        => $this->rating_count,
            'effective_price'     => $this->effective_price,
            'is_on_sale'          => $this->is_on_sale,
            'published_at'        => $this->published_at,
            'created_at'          => $this->created_at,
            'updated_at'          => $this->updated_at,
            'category'            => $this->whenLoaded('category', fn() => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'instructor'          => $this->whenLoaded('instructor', fn() => [
                'id'         => $this->instructor->id,
                'name'       => $this->instructor->name,
                'avatar_url' => $this->instructor->avatar_url,
                'headline'   => $this->instructor->profile?->headline,
                'bio'        => $this->instructor->profile?->bio,
            ]),
            'tags'                => $this->whenLoaded('tags', fn() =>
                $this->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])
            ),
        ];
    }
}

// ── CourseSummaryResource.php ────────────────────────────────
class CourseSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'slug'             => $this->slug,
            'subtitle'         => $this->subtitle,
            'thumbnail_url'    => $this->thumbnail_url,
            'level'            => $this->level,
            'pricing_type'     => $this->pricing_type,
            'price'            => $this->price,
            'sale_price'       => $this->sale_price,
            'currency'         => $this->currency,
            'rating_avg'       => round($this->rating_avg, 1),
            'rating_count'     => $this->rating_count,
            'enrollments_count'=> $this->enrollments_count,
            'duration_hours'   => $this->duration_hours,
            'lessons_count'    => $this->lessons_count,
            'language'         => $this->language,
            'is_featured'      => $this->is_featured,
            'effective_price'  => $this->effective_price,
            'is_on_sale'       => $this->is_on_sale,
            'is_wishlisted'    => $this->is_wishlisted ?? false,
            'is_enrolled'      => $this->is_enrolled ?? false,
            'instructor'       => [
                'id'         => $this->instructor->id,
                'name'       => $this->instructor->name,
                'avatar_url' => $this->instructor->avatar_url,
            ],
            'category'         => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ],
        ];
    }
}

// ── CourseDetailResource.php ─────────────────────────────────
class CourseDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return array_merge(
            (new CourseResource($this->resource))->toArray($request),
            [
                'sections'        => $this->whenLoaded('sections', fn() =>
                    $this->sections->map(fn($section) => [
                        'id'         => $section->id,
                        'title'      => $section->title,
                        'sort_order' => $section->sort_order,
                        'lessons'    => $section->lessons->map(fn($lesson) => [
                            'id'               => $lesson->id,
                            'title'            => $lesson->title,
                            'type'             => $lesson->type,
                            'duration_seconds' => $lesson->duration_seconds,
                            'formatted_duration' => $lesson->formatted_duration,
                            'is_preview'       => $lesson->is_preview,
                            'is_published'     => $lesson->is_published,
                            'sort_order'       => $lesson->sort_order,
                            'is_completed'     => $this->progress_map[$lesson->id] ?? false,
                        ]),
                    ])
                ),
                'enrollment'      => $this->enrollment ? [
                    'id'          => $this->enrollment->id,
                    'status'      => $this->enrollment->status,
                    'enrolled_at' => $this->enrollment->enrolled_at,
                    'completed_at'=> $this->enrollment->completed_at,
                ] : null,
                'reviews_summary' => $this->reviews_summary ?? null,
                'is_wishlisted'   => $this->is_wishlisted ?? false,
            ]
        );
    }
}

// ── LessonResource.php ───────────────────────────────────────
class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'section_id'       => $this->section_id,
            'course_id'        => $this->course_id,
            'title'            => $this->title,
            'description'      => $this->description,
            'type'             => $this->type,
            'content'          => $this->whenNotNull($this->content),
            'video_url'        => $this->video_url,
            'video_playback_id'=> $this->video_playback_id,
            'duration_seconds' => $this->duration_seconds,
            'formatted_duration' => $this->formatted_duration,
            'embed_url'        => $this->embed_url,
            'attachments'      => $this->attachments,
            'quiz_id'          => $this->quiz_id,
            'is_preview'       => $this->is_preview,
            'is_published'     => $this->is_published,
            'sort_order'       => $this->sort_order,
        ];
    }
}
