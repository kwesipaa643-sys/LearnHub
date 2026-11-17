<?php
// database/seeders/DatabaseSeeder.php
namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Review;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── CATEGORIES ───────────────────────────────────────
        $categories = [
            ['name' => 'Web Development', 'slug' => 'web-development', 'icon' => '🌐', 'color' => '#6366f1'],
            ['name' => 'Mobile Development', 'slug' => 'mobile-development', 'icon' => '📱', 'color' => '#8b5cf6'],
            ['name' => 'Data Science', 'slug' => 'data-science', 'icon' => '📊', 'color' => '#3b82f6'],
            ['name' => 'Machine Learning', 'slug' => 'machine-learning', 'icon' => '🤖', 'color' => '#06b6d4'],
            ['name' => 'Design', 'slug' => 'design', 'icon' => '🎨', 'color' => '#ec4899'],
            ['name' => 'Business', 'slug' => 'business', 'icon' => '💼', 'color' => '#f59e0b'],
            ['name' => 'Photography', 'slug' => 'photography', 'icon' => '📸', 'color' => '#84cc16'],
            ['name' => 'Music', 'slug' => 'music', 'icon' => '🎵', 'color' => '#f43f5e'],
            ['name' => 'DevOps', 'slug' => 'devops', 'icon' => '⚙️', 'color' => '#64748b'],
            ['name' => 'Cybersecurity', 'slug' => 'cybersecurity', 'icon' => '🔐', 'color' => '#ef4444'],
        ];

        foreach ($categories as $cat) {
            Category::create(array_merge($cat, ['is_featured' => true]));
        }

        // ── ADMIN ────────────────────────────────────────────
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@learnhub.dev',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        UserProfile::create(['user_id' => $admin->id, 'headline' => 'Platform Administrator']);

        // ── INSTRUCTORS ──────────────────────────────────────
        $instructors = [];
        $instructorData = [
            ['name' => 'Sarah Johnson', 'email' => 'instructor@learnhub.dev', 'headline' => 'Senior Laravel & Vue.js Developer', 'bio' => 'Full-stack developer with 12+ years building scalable web applications. Passionate about clean code and teaching.'],
            ['name' => 'David Chen', 'email' => 'david@learnhub.dev', 'headline' => 'React & Next.js Expert', 'bio' => 'Frontend architect at top-tier companies. I break down complex concepts into simple, practical lessons.'],
            ['name' => 'Aisha Okonkwo', 'email' => 'aisha@learnhub.dev', 'headline' => 'Data Scientist & ML Engineer', 'bio' => 'PhD in Computer Science. Turning data into insights with Python, TensorFlow, and modern ML tools.'],
        ];

        foreach ($instructorData as $data) {
            $instructor = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'instructor',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
            UserProfile::create([
                'user_id' => $instructor->id,
                'headline' => $data['headline'],
                'bio' => $data['bio'],
                'revenue_share' => 70.00,
            ]);
            $instructors[] = $instructor;
        }

        // ── STUDENTS ─────────────────────────────────────────
        $student = User::create([
            'name' => 'Jane Student',
            'email' => 'student@learnhub.dev',
            'password' => Hash::make('password'),
            'role' => 'student',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        UserProfile::create(['user_id' => $student->id]);

        // Extra students for realistic data
        for ($i = 1; $i <= 20; $i++) {
            $u = User::create([
                'name' => "Student {$i}",
                'email' => "student{$i}@example.com",
                'password' => Hash::make('password'),
                'role' => 'student',
                'status' => 'active',
                'email_verified_at' => now(),
            ]);
            UserProfile::create(['user_id' => $u->id]);
        }

        // ── TAGS ─────────────────────────────────────────────
        $tags = ['laravel', 'php', 'javascript', 'typescript', 'react', 'nextjs', 'python', 'api', 'database', 'css'];
        foreach ($tags as $tagName) {
            Tag::create(['name' => $tagName, 'slug' => $tagName]);
        }

        // ── COURSES ──────────────────────────────────────────
        $webCat = Category::where('slug', 'web-development')->first();
        $dataCat = Category::where('slug', 'data-science')->first();

        $coursesData = [
            [
                'instructor' => $instructors[0],
                'category' => $webCat,
                'title' => 'Complete Laravel 11 Course: Build Production Apps',
                'slug' => 'complete-laravel-11',
                'subtitle' => 'Master Laravel 11, REST APIs, authentication, queues, and deployment',
                'level' => 'intermediate',
                'pricing_type' => 'paid',
                'price' => 49.99,
                'sale_price' => 14.99,
                'what_you_learn' => ['Build REST APIs with Laravel 11', 'Implement authentication with Sanctum', 'Work with Eloquent ORM', 'Deploy to production with Docker'],
                'requirements' => ['Basic PHP knowledge', 'Understanding of HTML/CSS', 'Composer installed'],
                'sections' => [
                    ['title' => 'Getting Started', 'lessons' => [
                        ['title' => 'Introduction to Laravel 11', 'type' => 'video', 'duration_seconds' => 420, 'is_preview' => true],
                        ['title' => 'Installing Laravel & Setup', 'type' => 'video', 'duration_seconds' => 840],
                        ['title' => 'Project Structure Overview', 'type' => 'article'],
                    ]],
                    ['title' => 'Routing & Controllers', 'lessons' => [
                        ['title' => 'Routes Deep Dive', 'type' => 'video', 'duration_seconds' => 1200],
                        ['title' => 'Resource Controllers', 'type' => 'video', 'duration_seconds' => 960],
                        ['title' => 'Routing Quiz', 'type' => 'quiz'],
                    ]],
                    ['title' => 'Eloquent ORM', 'lessons' => [
                        ['title' => 'Models & Migrations', 'type' => 'video', 'duration_seconds' => 1560],
                        ['title' => 'Relationships', 'type' => 'video', 'duration_seconds' => 2100],
                        ['title' => 'Starter Files', 'type' => 'download'],
                    ]],
                ],
            ],
            [
                'instructor' => $instructors[1],
                'category' => $webCat,
                'title' => 'Next.js 15 Masterclass: Full-Stack Applications',
                'slug' => 'nextjs-15-masterclass',
                'subtitle' => 'Build modern full-stack apps with Next.js 15, TypeScript, and Prisma',
                'level' => 'intermediate',
                'pricing_type' => 'paid',
                'price' => 59.99,
                'what_you_learn' => ['App Router & Server Components', 'TypeScript with Next.js', 'Full-stack with API routes', 'Deployment on Vercel'],
                'requirements' => ['JavaScript fundamentals', 'Basic React knowledge'],
                'sections' => [
                    ['title' => 'Next.js Foundations', 'lessons' => [
                        ['title' => 'What is Next.js 15?', 'type' => 'video', 'duration_seconds' => 380, 'is_preview' => true],
                        ['title' => 'App Router Explained', 'type' => 'video', 'duration_seconds' => 1100],
                    ]],
                    ['title' => 'Server Components', 'lessons' => [
                        ['title' => 'Client vs Server Components', 'type' => 'video', 'duration_seconds' => 1440],
                        ['title' => 'Data Fetching Patterns', 'type' => 'video', 'duration_seconds' => 1800],
                    ]],
                ],
            ],
            [
                'instructor' => $instructors[2],
                'category' => $dataCat,
                'title' => 'Python for Data Science: From Zero to Hero',
                'slug' => 'python-data-science',
                'subtitle' => 'Master pandas, NumPy, matplotlib and machine learning with Python',
                'level' => 'beginner',
                'pricing_type' => 'free',
                'price' => 0,
                'what_you_learn' => ['Python fundamentals for data science', 'Data manipulation with pandas', 'Visualization with matplotlib', 'Intro to scikit-learn'],
                'requirements' => ['No prior programming experience needed', 'A laptop with internet access'],
                'sections' => [
                    ['title' => 'Python Basics', 'lessons' => [
                        ['title' => 'Why Python for Data Science?', 'type' => 'video', 'duration_seconds' => 600, 'is_preview' => true],
                        ['title' => 'Variables & Data Types', 'type' => 'video', 'duration_seconds' => 1200],
                        ['title' => 'Python Cheatsheet', 'type' => 'download'],
                    ]],
                    ['title' => 'pandas Deep Dive', 'lessons' => [
                        ['title' => 'DataFrames & Series', 'type' => 'video', 'duration_seconds' => 1800],
                        ['title' => 'Data Cleaning', 'type' => 'video', 'duration_seconds' => 2400],
                    ]],
                ],
            ],
        ];

        foreach ($coursesData as $courseData) {
            $sections = $courseData['sections'];
            unset($courseData['sections']);

            $course = Course::create([
                'user_id' => $courseData['instructor']->id,
                'category_id' => $courseData['category']->id,
                'title' => $courseData['title'],
                'slug' => $courseData['slug'],
                'subtitle' => $courseData['subtitle'],
                'level' => $courseData['level'],
                'pricing_type' => $courseData['pricing_type'],
                'price' => $courseData['price'],
                'sale_price' => $courseData['sale_price'] ?? null,
                'what_you_learn' => $courseData['what_you_learn'],
                'requirements' => $courseData['requirements'],
                'status' => 'published',
                'published_at' => now(),
                'certificate_enabled' => true,
                'is_featured' => true,
                'currency' => 'USD',
                'language' => 'en',
            ]);

            // Create sections & lessons
            foreach ($sections as $sIdx => $sectionData) {
                $section = CourseSection::create([
                    'course_id' => $course->id,
                    'title' => $sectionData['title'],
                    'sort_order' => $sIdx,
                ]);

                foreach ($sectionData['lessons'] as $lIdx => $lessonData) {
                    Lesson::create([
                        'section_id' => $section->id,
                        'course_id' => $course->id,
                        'title' => $lessonData['title'],
                        'type' => $lessonData['type'],
                        'duration_seconds' => $lessonData['duration_seconds'] ?? 0,
                        'is_preview' => $lessonData['is_preview'] ?? false,
                        'is_published' => true,
                        'sort_order' => $lIdx,
                    ]);
                }
            }

            // Enroll some students and add reviews
            $allStudents = User::where('role', 'student')->get();
            foreach ($allStudents->take(15) as $st) {
                Enrollment::create([
                    'user_id' => $st->id,
                    'course_id' => $course->id,
                    'status' => 'active',
                    'amount_paid' => $course->price,
                    'enrolled_at' => now()->subDays(rand(1, 60)),
                ]);

                if (rand(0, 1)) {
                    Review::create([
                        'user_id' => $st->id,
                        'course_id' => $course->id,
                        'rating' => rand(4, 5),
                        'title' => collect(['Excellent!', 'Very helpful', 'Great content', 'Highly recommend', 'Loved it!'])->random(),
                        'content' => collect([
                            'This course exceeded my expectations. The instructor explains everything clearly.',
                            'Best course on this topic. Practical examples and real-world projects.',
                            'Great pacing and excellent support in the Q&A section.',
                        ])->random(),
                        'status' => 'approved',
                        'is_verified_purchase' => true,
                    ]);
                }
            }

            // Recalculate stats
            $course->recalculateStats();
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('   Admin:      admin@learnhub.dev / password');
        $this->command->info('   Instructor: instructor@learnhub.dev / password');
        $this->command->info('   Student:    student@learnhub.dev / password');
    }
}
