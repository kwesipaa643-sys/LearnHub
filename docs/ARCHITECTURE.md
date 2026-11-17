# LearnHub — Online Learning Platform
## Complete Architecture & Setup Guide

---

## Project Structure

```
learnhub/
├── backend/          # Laravel 11 API
├── frontend/         # Next.js 15 App
├── docs/             # Architecture, API docs
└── docker-compose.yml
```

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Backend API   | PHP 8.3+, Laravel 11, Laravel Sanctum           |
| Frontend      | Next.js 15 (App Router), TypeScript, Tailwind   |
| UI Components | shadcn/ui                                       |
| Database      | MySQL 8.0 / MariaDB 10.11                       |
| Cache/Queue   | Redis 7                                         |
| Payments      | Stripe (+ Mobile Money via Flutterwave)         |
| Storage       | AWS S3 / Cloudflare R2 (local in dev)           |
| Video         | HLS streaming via Mux or Bunny.net              |
| Live Classes  | LiveKit (WebRTC)                                |
| Email         | Mailtrap (dev) / Postmark (prod)                |
| PDF           | Laravel DomPDF                                  |
| Search        | Laravel Scout + Meilisearch                     |

---

## Database Schema (Entity Relationship Overview)

```
users ─────────────────────────────────────────┐
  ├── user_roles (student/instructor/admin)     │
  ├── social_accounts                           │
  ├── user_profiles                             │
  └── notifications                             │
                                                │
courses ───────────────────────────────────────┤
  ├── categories (hierarchical)                 │
  ├── course_sections                           │   
  │     └── lessons                             │
  │           ├── lesson_progress               │
  │           ├── lesson_notes                  │
  │           └── quiz_attempts                 │
  ├── enrollments ──── users                    │
  ├── reviews                                   │
  ├── course_tags                               │
  └── course_coupons                            │
                                                │
quizzes                                         │
  ├── quiz_questions                            │
  └── quiz_options                              │
                                                │
orders ─────────────────────────────────────────┤
  ├── order_items                               │
  └── payments (Stripe / Mobile Money)          │
                                                │
subscriptions                                   │
  └── subscription_plans                        │
                                                │
live_classes                                    │
  └── live_class_attendees                      │
                                                │
certificates ──── users + courses               │
discussions ──── courses                        │
  └── discussion_replies                        │
```

---

## Quick Start

### Prerequisites
- PHP 8.3+, Composer 2.x
- Node.js 20+, pnpm
- Docker & Docker Compose
- Git

### 1. Clone & Setup
```bash
git clone https://github.com/yourorg/learnhub.git
cd learnhub
cp .env.example .env
```

### 2. Start Services (Docker)
```bash
docker compose up -d
# Starts: MySQL, Redis, Meilisearch, Mailpit
```

### 3. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan queue:work --daemon &
php artisan serve --port=8000
```

### 4. Frontend Setup
```bash
cd frontend
pnpm install
cp .env.local.example .env.local
pnpm dev
# Runs on http://localhost:3000
```

### 5. Default Credentials (Seeded)
```
Admin:      admin@learnhub.dev / password
Instructor: instructor@learnhub.dev / password
Student:    student@learnhub.dev / password
```

---

## Environment Variables

### Backend (.env)
```env
APP_NAME=LearnHub
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=learnhub
DB_USERNAME=root
DB_PASSWORD=secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
CACHE_STORE=redis

MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=1025

FILESYSTEM_DISK=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=learnhub

STRIPE_KEY=pk_test_xxx
STRIPE_SECRET=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=

LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost

SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
NEXT_PUBLIC_APP_NAME=LearnHub

# Server-side only
STRIPE_SECRET_KEY=sk_test_xxx
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```
