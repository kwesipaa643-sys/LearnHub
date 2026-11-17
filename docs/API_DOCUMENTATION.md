# LearnHub API Documentation
## Base URL: `http://localhost:8000/api/v1`

All responses follow this envelope:
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... },
  "meta": { "pagination": { ... } }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": ["The email field is required."] }
}
```

---

## 🔐 AUTHENTICATION

### POST /auth/register
```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "role": "student"  // student | instructor
}

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "student" },
    "token": "1|abc123..."
  },
  "message": "Registration successful. Please verify your email."
}
```

### POST /auth/login
```json
// Request
{ "email": "jane@example.com", "password": "Password123!" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Jane Doe", "role": "student", "avatar": null },
    "token": "2|xyz789..."
  }
}
```

### POST /auth/logout
```
Headers: Authorization: Bearer {token}
Response 200: { "success": true, "message": "Logged out successfully" }
```

### POST /auth/forgot-password
```json
{ "email": "jane@example.com" }
```

### POST /auth/reset-password
```json
{
  "token": "reset-token-from-email",
  "email": "jane@example.com",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

### GET /auth/verify-email/{id}/{hash}
```
Verifies email from link in email
```

### POST /auth/resend-verification
```json
{ "email": "jane@example.com" }
```

### GET /auth/social/{provider}
```
provider: google | github
Redirects to OAuth provider
```

### GET /auth/social/{provider}/callback
```
OAuth callback, returns token
```

### GET /auth/me
```
Headers: Authorization: Bearer {token}
Response: { "data": { user with profile } }
```

---

## 👤 USERS & PROFILES

### GET /users/{id}/profile
```json
// Response
{
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "role": "instructor",
    "avatar": "https://...",
    "profile": {
      "bio": "10+ years Laravel experience",
      "headline": "Senior Full-Stack Developer",
      "website": "https://janedoe.dev",
      "twitter": "@janedoe"
    },
    "stats": {
      "courses_count": 5,
      "students_count": 1240,
      "rating_avg": 4.8,
      "reviews_count": 320
    }
  }
}
```

### PUT /profile (auth required)
```json
// Request (multipart/form-data for avatar)
{
  "name": "Jane Doe",
  "bio": "Updated bio...",
  "headline": "Laravel & Next.js Expert",
  "website": "https://janedoe.dev",
  "twitter": "@janedoe",
  "timezone": "America/New_York",
  "avatar": [file]
}
```

### PUT /profile/password
```json
{
  "current_password": "OldPass123!",
  "password": "NewPass123!",
  "password_confirmation": "NewPass123!"
}
```

### PUT /profile/notifications
```json
{
  "email_new_course": true,
  "email_lesson_reminder": false,
  "email_certificate": true,
  "push_messages": true
}
```

---

## 📚 COURSES

### GET /courses
```
Query params:
  ?search=laravel
  &category=web-development
  &level=beginner
  &price_type=free|paid
  &min_price=0&max_price=100
  &rating=4
  &sort=newest|popular|rating|price_low|price_high
  &page=1&per_page=12
  &language=en
  &featured=1

// Response
{
  "data": [
    {
      "id": 1,
      "title": "Complete Laravel 11 Course",
      "slug": "complete-laravel-11",
      "subtitle": "Build production apps with Laravel 11",
      "thumbnail": "https://...",
      "instructor": { "id": 2, "name": "John Smith", "avatar": "..." },
      "category": { "id": 3, "name": "Web Development", "slug": "web-dev" },
      "level": "intermediate",
      "pricing_type": "paid",
      "price": 49.99,
      "sale_price": 14.99,
      "currency": "USD",
      "rating_avg": 4.8,
      "rating_count": 245,
      "enrollments_count": 1820,
      "duration_hours": 24,
      "lessons_count": 156,
      "language": "en",
      "is_wishlisted": false,
      "is_enrolled": false
    }
  ],
  "meta": { "total": 150, "page": 1, "per_page": 12, "last_page": 13 }
}
```

### GET /courses/{slug}
```json
// Full course details (public)
{
  "data": {
    "id": 1,
    "title": "...",
    "description": "<rich HTML>",
    "what_you_learn": ["Build REST APIs", "Deploy to production"],
    "requirements": ["Basic PHP knowledge"],
    "for_whom": ["Aspiring developers", "PHP developers"],
    "trailer_video": "https://...",
    "instructor": { "...full profile..." },
    "category": { "..." },
    "tags": ["laravel", "php", "api"],
    "sections": [
      {
        "id": 1,
        "title": "Getting Started",
        "lessons": [
          {
            "id": 1,
            "title": "Introduction",
            "type": "video",
            "duration_seconds": 300,
            "is_preview": true,
            "is_completed": false   // null if not enrolled
          }
        ]
      }
    ],
    "enrollment": null,  // or enrollment object if enrolled
    "reviews_summary": { "avg": 4.8, "total": 245, "distribution": { "5": 180, "4": 40, ... } }
  }
}
```

### POST /courses (instructor only)
```json
// Request
{
  "title": "Complete Laravel 11 Course",
  "category_id": 3,
  "level": "intermediate",
  "pricing_type": "paid",
  "price": 49.99,
  "language": "en"
}
// Response 201: { "data": { "id": 1, "slug": "complete-laravel-11", ... } }
```

### PUT /courses/{id} (owner/admin)
```json
{
  "title": "Updated Title",
  "description": "<p>Rich description...</p>",
  "what_you_learn": ["Item 1", "Item 2"],
  "requirements": ["Basic HTML"],
  "sale_price": 14.99,
  "sale_ends_at": "2024-12-31T23:59:59Z"
}
```

### POST /courses/{id}/thumbnail (multipart)
```
{ "thumbnail": [image file] }
```

### POST /courses/{id}/publish
```
Submits course for review / publishes (admin auto-approves in dev)
```

### DELETE /courses/{id}
```
Soft delete (admin or owner with no enrollments)
```

---

## 📋 SECTIONS & LESSONS

### GET /courses/{courseId}/sections
```json
{
  "data": [
    {
      "id": 1,
      "title": "Getting Started",
      "sort_order": 0,
      "lessons": [ { "id": 1, "title": "...", "type": "video", ... } ]
    }
  ]
}
```

### POST /courses/{courseId}/sections
```json
{ "title": "Section 1: Foundations", "sort_order": 0 }
```

### PUT /courses/{courseId}/sections/{id}
```json
{ "title": "Updated Section Title" }
```

### POST /courses/{courseId}/sections/reorder
```json
{ "sections": [{ "id": 2, "sort_order": 0 }, { "id": 1, "sort_order": 1 }] }
```

### DELETE /courses/{courseId}/sections/{id}

### POST /sections/{sectionId}/lessons
```json
{
  "title": "What is Laravel?",
  "type": "video",
  "description": "In this lesson...",
  "is_preview": false,
  "sort_order": 0
}
```

### PUT /lessons/{id}
```json
{
  "title": "Updated Title",
  "content": "<p>Article content HTML</p>",
  "video_url": "https://stream.mux.com/xxx.m3u8",
  "video_playback_id": "xxx",
  "duration_seconds": 1845,
  "embed_url": "https://youtu.be/xxx",
  "is_preview": true
}
```

### POST /lessons/{id}/upload-video (multipart)
```
Handles video upload → Mux processing
{ "video": [file] }
Response: { "data": { "upload_id": "...", "status": "processing" } }
```

### POST /lessons/{id}/attachments (multipart)
```
{ "file": [file], "label": "Project Starter Files" }
```

### DELETE /lessons/{id}

### POST /lessons/reorder
```json
{ "lessons": [{ "id": 5, "sort_order": 0, "section_id": 2 }, ...] }
```

---

## 🎓 ENROLLMENT & PROGRESS

### POST /enroll
```json
// Free course enrollment
{ "course_id": 1 }
// Response 201: { "data": { "enrollment_id": 10, "course_slug": "..." } }
```

### GET /my-courses
```json
// Response: enrolled courses with progress
{
  "data": [
    {
      "course": { "...course object..." },
      "enrollment": {
        "id": 10,
        "status": "active",
        "enrolled_at": "2024-01-15T10:30:00Z"
      },
      "progress": {
        "completed_lessons": 12,
        "total_lessons": 45,
        "percentage": 26.7,
        "last_lesson": { "id": 15, "title": "Middleware Deep Dive", "section": "..." }
      }
    }
  ]
}
```

### POST /progress
```json
// Mark lesson progress / video watch time
{
  "lesson_id": 15,
  "watch_seconds": 720,
  "watch_percent": 85.5,
  "is_completed": true
}
```

### GET /courses/{slug}/progress
```json
{
  "data": {
    "percentage": 45.2,
    "completed_lesson_ids": [1, 2, 3, 5, 7],
    "last_lesson_id": 7,
    "certificate_eligible": false
  }
}
```

---

## 💳 PAYMENTS & ORDERS

### POST /checkout
```json
{
  "items": [{ "course_id": 1 }],
  "coupon_code": "SAVE50",
  "payment_method": "stripe"
}
// Response:
{
  "data": {
    "order_id": 25,
    "client_secret": "pi_xxx_secret_xxx",  // Stripe PaymentIntent
    "amount": 24.99,
    "currency": "USD"
  }
}
```

### POST /checkout/flutterwave
```json
{
  "items": [{ "course_id": 1 }],
  "coupon_code": null,
  "phone": "+256700000000",
  "payment_type": "mobilemoney_uganda"
}
```

### POST /webhooks/stripe
```
Stripe webhook endpoint (raw body, no auth middleware)
```

### GET /orders
```json
{
  "data": [
    {
      "id": 25,
      "order_number": "ORD-2024-025001",
      "total": 24.99,
      "status": "completed",
      "items": [{ "course_id": 1, "course_title": "...", "price": 24.99 }],
      "created_at": "2024-01-15T..."
    }
  ]
}
```

### GET /orders/{id}/invoice
```
Returns PDF invoice download
```

### POST /coupons/validate
```json
{ "code": "SAVE50", "course_ids": [1, 2] }
// Response: { "data": { "discount_type": "percentage", "value": 50, "discount_amount": 24.99 } }
```

### GET /subscriptions/plans
### POST /subscriptions/subscribe
```json
{ "plan_id": 1, "billing_cycle": "monthly", "payment_method_id": "pm_xxx" }
```
### DELETE /subscriptions/cancel

---

## 📝 QUIZZES

### GET /lessons/{lessonId}/quiz
### POST /quizzes (instructor)
```json
{
  "course_id": 1,
  "title": "PHP Fundamentals Quiz",
  "time_limit_minutes": 15,
  "passing_score": 70,
  "max_attempts": 3,
  "questions": [
    {
      "type": "multiple_choice",
      "question": "What does PHP stand for?",
      "points": 1,
      "options": [
        { "content": "PHP Hypertext Preprocessor", "is_correct": true },
        { "content": "Personal Home Page", "is_correct": false }
      ]
    }
  ]
}
```

### POST /quizzes/{id}/attempt/start
```json
// Response: { "data": { "attempt_id": 5, "expires_at": "..." } }
```

### POST /quizzes/{id}/attempt/submit
```json
{
  "attempt_id": 5,
  "answers": [
    { "question_id": 1, "selected_options": [3] },
    { "question_id": 2, "text_answer": "Laravel" }
  ]
}
// Response: { "data": { "score": 80, "passed": true, "correct": 4, "total": 5 } }
```

### GET /quizzes/{id}/attempts (my attempts)

---

## ⭐ REVIEWS

### GET /courses/{slug}/reviews
```
?sort=newest|helpful|rating&page=1
```

### POST /courses/{slug}/reviews
```json
{
  "rating": 5,
  "title": "Excellent course!",
  "content": "Very well structured..."
}
```

### PUT /reviews/{id}
### DELETE /reviews/{id}

---

## 📌 WISHLIST

### GET /wishlist
### POST /wishlist
```json
{ "course_id": 1 }
```
### DELETE /wishlist/{courseId}

---

## 💬 DISCUSSIONS

### GET /courses/{slug}/discussions
```
?lesson_id=5&page=1&sort=newest|popular
```

### POST /courses/{slug}/discussions
```json
{
  "title": "How to handle file uploads?",
  "content": "I'm stuck on...",
  "lesson_id": 15
}
```

### POST /discussions/{id}/replies
```json
{
  "content": "You can use Laravel's Storage facade...",
  "parent_id": null
}
```

### POST /discussion-replies/{id}/upvote
### POST /discussions/{id}/mark-answered

---

## 📝 NOTES

### GET /lessons/{lessonId}/notes
### POST /lessons/{lessonId}/notes
```json
{ "content": "Remember to review this section", "timestamp_seconds": 342 }
```
### PUT /notes/{id}
### DELETE /notes/{id}

---

## 🎥 LIVE CLASSES

### GET /courses/{slug}/live-classes
### POST /live-classes (instructor)
```json
{
  "course_id": 1,
  "title": "Q&A Session: Advanced Laravel",
  "description": "...",
  "scheduled_at": "2024-02-15T14:00:00Z",
  "duration_minutes": 90,
  "max_attendees": 50
}
```

### POST /live-classes/{id}/join
```json
// Response: { "data": { "token": "livekit-jwt-token", "room": "room-name", "url": "wss://..." } }
```

### POST /live-classes/{id}/start (instructor)
### POST /live-classes/{id}/end (instructor)

---

## 🏆 CERTIFICATES

### GET /certificates (my certificates)
### GET /certificates/{uuid} (public verification)
### POST /certificates/generate
```json
{ "course_id": 1 }  // Only if 100% complete
// Returns: { "data": { "certificate_id": 10, "uuid": "xxx", "pdf_url": "..." } }
```

---

## 🔔 NOTIFICATIONS

### GET /notifications
```
?read=false&type=all&page=1
```
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "CoursePublished",
      "data": { "course_id": 1, "course_title": "..." },
      "read_at": null,
      "created_at": "..."
    }
  ],
  "unread_count": 5
}
```

### POST /notifications/{id}/read
### POST /notifications/read-all
### DELETE /notifications/{id}

---

## 🔧 ADMIN ENDPOINTS

### GET /admin/dashboard
```json
{
  "data": {
    "stats": {
      "total_users": 1520,
      "total_courses": 87,
      "total_enrollments": 12450,
      "total_revenue": 45231.50,
      "monthly_revenue": [{ "month": "Jan", "amount": 3200 }, ...]
    }
  }
}
```

### GET /admin/users?role=instructor&status=active&search=john
### PUT /admin/users/{id}/status
```json
{ "status": "suspended", "reason": "Policy violation" }
```
### PUT /admin/users/{id}/role
```json
{ "role": "instructor" }
```

### GET /admin/courses?status=under_review
### PUT /admin/courses/{id}/approve
### PUT /admin/courses/{id}/reject
```json
{ "reason": "Content quality issues" }
```

### GET /admin/reviews?status=pending
### PUT /admin/reviews/{id}/moderate
```json
{ "status": "approved" }
```

### GET /admin/revenue/report?from=2024-01-01&to=2024-12-31

---

## 📊 INSTRUCTOR DASHBOARD

### GET /instructor/dashboard
```json
{
  "data": {
    "stats": {
      "total_students": 1240,
      "total_revenue": 8520.00,
      "pending_payout": 2100.00,
      "total_courses": 5,
      "avg_rating": 4.8
    },
    "recent_enrollments": [...],
    "monthly_revenue": [...]
  }
}
```

### GET /instructor/courses
### GET /instructor/analytics/courses/{id}
```json
{
  "data": {
    "views": 3200,
    "enrollments": 245,
    "completion_rate": 68.4,
    "revenue": 1225.00,
    "lesson_completion_rates": [{ "lesson_id": 1, "title": "...", "rate": 92.3 }]
  }
}
```

### GET /instructor/earnings
### POST /instructor/payout/request

---

## 🏷️ MISC ENDPOINTS

### GET /categories
### GET /categories/{slug}/courses
### GET /tags
### GET /search?q=laravel&type=courses|instructors
### POST /contact
### GET /analytics/track (pixel tracking)
