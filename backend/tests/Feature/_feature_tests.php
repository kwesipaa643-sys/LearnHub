<?php
// tests/Feature/AuthTest.php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'student',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['success', 'data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'role' => 'student']);
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('Password123!')]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => ['user', 'token']]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_unauthenticated_user_cannot_fetch_profile(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertStatus(401);
    }
}

// ── tests/Feature/CourseTest.php ──────────────────────────────
namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_browse_published_courses(): void
    {
        Course::factory()->count(3)->create(['status' => 'published']);
        Course::factory()->create(['status' => 'draft']);

        $response = $this->getJson('/api/v1/courses');

        $response->assertStatus(200)->assertJsonCount(3, 'data');
    }

    public function test_instructor_can_create_a_course(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);
        $category = Category::factory()->create();

        $response = $this->actingAs($instructor, 'sanctum')->postJson('/api/v1/instructor/courses', [
            'title' => 'Test Course Title',
            'category_id' => $category->id,
            'level' => 'beginner',
            'pricing_type' => 'free',
            'language' => 'en',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('courses', ['title' => 'Test Course Title', 'user_id' => $instructor->id]);
    }

    public function test_student_cannot_create_a_course(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $category = Category::factory()->create();

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/v1/instructor/courses', [
            'title' => 'Test Course Title',
            'category_id' => $category->id,
            'level' => 'beginner',
            'pricing_type' => 'free',
            'language' => 'en',
        ]);

        $response->assertStatus(403);
    }

    public function test_student_can_enroll_in_free_course(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create(['status' => 'published', 'pricing_type' => 'free']);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/v1/enroll', [
            'course_id' => $course->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'course_id' => $course->id]);
    }

    public function test_student_cannot_enroll_in_paid_course_without_payment(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create(['status' => 'published', 'pricing_type' => 'paid', 'price' => 49.99]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/v1/enroll', [
            'course_id' => $course->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_only_course_owner_can_update_course(): void
    {
        $owner = User::factory()->create(['role' => 'instructor']);
        $otherInstructor = User::factory()->create(['role' => 'instructor']);
        $course = Course::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherInstructor, 'sanctum')
            ->putJson("/api/v1/instructor/courses/{$course->id}", ['title' => 'Hacked Title']);

        $response->assertStatus(403);
    }
}
