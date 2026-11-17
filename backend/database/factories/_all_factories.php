<?php
// database/factories/UserFactory.php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = \App\Models\User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'role' => 'student',
            'status' => 'active',
            'remember_token' => \Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn() => ['email_verified_at' => null]);
    }

    public function instructor(): static
    {
        return $this->state(fn() => ['role' => 'instructor']);
    }

    public function admin(): static
    {
        return $this->state(fn() => ['role' => 'admin']);
    }

    public function suspended(): static
    {
        return $this->state(fn() => ['status' => 'suspended']);
    }

    public function configure(): static
    {
        return $this->afterCreating(function (\App\Models\User $user) {
            \App\Models\UserProfile::create(['user_id' => $user->id]);
        });
    }
}

// ── database/factories/CategoryFactory.php ───────────────────
namespace Database\Factories;

class CategoryFactory extends Factory
{
    protected $model = \App\Models\Category::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);
        return [
            'name' => ucwords($name),
            'slug' => \Str::slug($name),
            'icon' => fake()->randomElement(['📚', '💻', '🎨', '📊', '🎵']),
            'is_featured' => fake()->boolean(30),
        ];
    }
}

// ── database/factories/CourseFactory.php ──────────────────────
namespace Database\Factories;

class CourseFactory extends Factory
{
    protected $model = \App\Models\Course::class;

    public function definition(): array
    {
        $title = fake()->sentence(5);
        $pricingType = fake()->randomElement(['free', 'paid']);

        return [
            'user_id' => \App\Models\User::factory()->instructor(),
            'category_id' => \App\Models\Category::factory(),
            'title' => $title,
            'slug' => \Str::slug($title) . '-' . fake()->unique()->numberBetween(1, 100000),
            'subtitle' => fake()->sentence(10),
            'description' => '<p>' . fake()->paragraphs(3, true) . '</p>',
            'what_you_learn' => fake()->sentences(4),
            'requirements' => fake()->sentences(2),
            'level' => fake()->randomElement(['beginner', 'intermediate', 'advanced', 'all-levels']),
            'status' => 'published',
            'pricing_type' => $pricingType,
            'price' => $pricingType === 'paid' ? fake()->randomFloat(2, 9.99, 199.99) : 0,
            'currency' => 'USD',
            'language' => 'en',
            'certificate_enabled' => true,
            'duration_hours' => fake()->numberBetween(1, 40),
            'lessons_count' => fake()->numberBetween(10, 100),
            'enrollments_count' => fake()->numberBetween(0, 5000),
            'rating_avg' => fake()->randomFloat(1, 3.5, 5.0),
            'rating_count' => fake()->numberBetween(0, 500),
            'published_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn() => ['status' => 'draft', 'published_at' => null]);
    }

    public function free(): static
    {
        return $this->state(fn() => ['pricing_type' => 'free', 'price' => 0]);
    }
}

// ── database/factories/EnrollmentFactory.php ──────────────────
namespace Database\Factories;

class EnrollmentFactory extends Factory
{
    protected $model = \App\Models\Enrollment::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'course_id' => \App\Models\Course::factory(),
            'status' => 'active',
            'amount_paid' => 0,
            'enrolled_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}

// ── database/factories/ReviewFactory.php ──────────────────────
namespace Database\Factories;

class ReviewFactory extends Factory
{
    protected $model = \App\Models\Review::class;

    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'course_id' => \App\Models\Course::factory(),
            'rating' => fake()->numberBetween(3, 5),
            'title' => fake()->sentence(4),
            'content' => fake()->paragraph(),
            'status' => 'approved',
            'is_verified_purchase' => true,
        ];
    }
}
