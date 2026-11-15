# LearnHub Frontend — Directory Structure

```
frontend/
├── app/                              # Next.js 15 App Router
│   ├── (auth)/                       # Auth group (no main layout)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (main)/                       # Main layout (with nav/footer)
│   │   ├── layout.tsx                # Main layout wrapper
│   │   ├── page.tsx                  # Landing page
│   │   ├── courses/
│   │   │   ├── page.tsx              # Course catalog
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Course detail
│   │   ├── categories/
│   │   │   └── [slug]/page.tsx
│   │   ├── instructors/
│   │   │   └── [id]/page.tsx         # Instructor profile
│   │   ├── wishlist/page.tsx
│   │   ├── cart/page.tsx
│   │   └── certificates/[uuid]/page.tsx
│   │
│   ├── (learn)/                      # Learning interface (immersive)
│   │   ├── layout.tsx                # Minimal header
│   │   └── learn/[slug]/
│   │       └── [lessonId]/page.tsx   # Lesson viewer
│   │
│   ├── (dashboard)/                  # Student dashboard
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx        # My Learning
│   │   ├── my-courses/page.tsx
│   │   ├── certificates/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── (instructor)/                 # Instructor panel
│   │   ├── layout.tsx
│   │   ├── instructor/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   ├── courses/new/page.tsx
│   │   │   ├── courses/[id]/
│   │   │   │   ├── edit/page.tsx     # Basic info
│   │   │   │   ├── curriculum/page.tsx # Drag-drop builder
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   ├── earnings/page.tsx
│   │   │   └── live/page.tsx
│   │
│   ├── (admin)/                      # Admin panel
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── dashboard/page.tsx
│   │       ├── users/page.tsx
│   │       ├── courses/page.tsx
│   │       ├── reviews/page.tsx
│   │       └── revenue/page.tsx
│   │
│   ├── api/                          # Next.js API routes (BFF)
│   │   └── auth/[...nextauth]/route.ts
│   │
│   ├── layout.tsx                    # Root layout
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── DashboardSidebar.tsx
│   │   ├── InstructorSidebar.tsx
│   │   └── AdminSidebar.tsx
│   │
│   ├── course/
│   │   ├── CourseCard.tsx            # Grid card
│   │   ├── CourseHero.tsx            # Detail page hero
│   │   ├── CourseCurriculum.tsx      # Accordion sections/lessons
│   │   ├── CourseFilters.tsx         # Search filters sidebar
│   │   ├── CourseProgress.tsx        # Progress bar
│   │   ├── CourseReviews.tsx         # Reviews section
│   │   ├── EnrollButton.tsx          # Enroll / Buy CTA
│   │   └── WishlistButton.tsx
│   │
│   ├── lesson/
│   │   ├── VideoPlayer.tsx           # HLS player with controls
│   │   ├── ArticleViewer.tsx         # Rich text viewer
│   │   ├── QuizViewer.tsx            # Interactive quiz
│   │   ├── LessonSidebar.tsx         # Course nav in learn mode
│   │   ├── NotesPanel.tsx            # Video notes
│   │   └── LessonProgress.tsx
│   │
│   ├── curriculum/                   # Instructor curriculum builder
│   │   ├── CurriculumBuilder.tsx     # Main DnD container
│   │   ├── SectionItem.tsx
│   │   ├── LessonItem.tsx
│   │   ├── AddSectionForm.tsx
│   │   └── AddLessonModal.tsx
│   │
│   ├── checkout/
│   │   ├── CartDrawer.tsx
│   │   ├── CheckoutForm.tsx          # Stripe Elements
│   │   ├── OrderSummary.tsx
│   │   └── CouponInput.tsx
│   │
│   ├── live/
│   │   ├── LiveClassRoom.tsx         # LiveKit room
│   │   ├── LiveClassCard.tsx
│   │   └── LiveScheduleModal.tsx
│   │
│   ├── quiz/
│   │   ├── QuizBuilder.tsx           # Instructor quiz builder
│   │   ├── QuizQuestion.tsx
│   │   └── QuizResults.tsx
│   │
│   ├── dashboard/
│   │   ├── ContinueLearning.tsx
│   │   ├── ProgressCard.tsx
│   │   └── StatCard.tsx
│   │
│   ├── admin/
│   │   ├── RevenueChart.tsx
│   │   ├── UserTable.tsx
│   │   └── CourseApproval.tsx
│   │
│   └── shared/
│       ├── StarRating.tsx
│       ├── CategoryBadge.tsx
│       ├── UserAvatar.tsx
│       ├── RichTextEditor.tsx
│       ├── FileUpload.tsx
│       ├── SearchBar.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── api/                          # API client layer
│   │   ├── client.ts                 # Axios instance
│   │   ├── auth.ts                   # Auth API calls
│   │   ├── courses.ts
│   │   ├── lessons.ts
│   │   ├── enrollments.ts
│   │   ├── payments.ts
│   │   ├── quizzes.ts
│   │   ├── reviews.ts
│   │   └── admin.ts
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCourse.ts
│   │   ├── useCart.ts
│   │   ├── useProgress.ts
│   │   └── useNotifications.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   │
│   ├── utils.ts                      # Utility functions
│   ├── validations.ts                # Zod schemas
│   └── constants.ts
│
├── types/
│   ├── api.ts                        # API response types
│   ├── course.ts
│   ├── user.ts
│   ├── payment.ts
│   └── quiz.ts
│
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.json                 # PWA manifest
│
├── messages/                         # i18n
│   ├── en.json
│   ├── fr.json
│   └── es.json
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── middleware.ts                     # Route protection
```
