// lib/api/index.ts — All API calls in one place
import { get, post, put, del, postFormData } from './client';
import type {
  ApiResponse, User, AuthResponse, CourseSummary, CourseDetail,
  CourseSection, Lesson, EnrolledCourse, CourseProgress, LessonNote,
  Review, Quiz, QuizAttempt, QuizAttemptResult, Order, CheckoutResponse,
  CouponValidation, Certificate, LiveClass, LiveClassJoinResponse,
  Discussion, DiscussionReply, Notification, Category, Tag,
  InstructorDashboardStats, AdminDashboardStats, SubscriptionPlan,
  PaginationMeta,
} from '@/types/api';

// ── AUTH ────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string; role?: string }) =>
    post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () => post<ApiResponse<null>>('/auth/logout'),

  me: () => get<ApiResponse<User>>('/auth/me'),

  forgotPassword: (email: string) =>
    post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    post<ApiResponse<null>>('/auth/reset-password', data),

  resendVerification: (email: string) =>
    post<ApiResponse<null>>('/auth/resend-verification', { email }),

  socialRedirect: (provider: 'google' | 'github') =>
    `${process.env.NEXT_PUBLIC_API_URL}/auth/social/${provider}`,
};

// ── PROFILE ─────────────────────────────────────────────────
export const profileApi = {
  get: () => get<ApiResponse<User>>('/profile'),

  update: (data: Partial<User & { bio: string; headline: string; website: string; twitter: string; linkedin: string; github: string }>) =>
    put<ApiResponse<User>>('/profile', data),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return postFormData<ApiResponse<{ avatar_url: string }>>('/profile/avatar', fd);
  },

  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    put<ApiResponse<null>>('/profile/password', data),

  updateNotifications: (prefs: Record<string, boolean>) =>
    put<ApiResponse<null>>('/profile/notifications', prefs),

  publicProfile: (userId: number) =>
    get<ApiResponse<User>>(`/users/${userId}/profile`),
};

// ── COURSES ──────────────────────────────────────────────────
export const coursesApi = {
  list: (params?: Record<string, unknown>) =>
    get<ApiResponse<CourseSummary[]>>('/courses', params),

  get: (slug: string) =>
    get<ApiResponse<CourseDetail>>(`/courses/${slug}`),

  create: (data: Partial<CourseDetail>) =>
    post<ApiResponse<CourseDetail>>('/instructor/courses', data),

  update: (id: number, data: Partial<CourseDetail>) =>
    put<ApiResponse<CourseDetail>>(`/instructor/courses/${id}`, data),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/instructor/courses/${id}`),

  publish: (id: number) =>
    post<ApiResponse<null>>(`/instructor/courses/${id}/publish`),

  uploadThumbnail: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('thumbnail', file);
    return postFormData<ApiResponse<{ thumbnail_url: string }>>(`/instructor/courses/${id}/thumbnail`, fd);
  },

  myCourses: () =>
    get<ApiResponse<CourseDetail[]>>('/instructor/courses'),

  featured: () =>
    get<ApiResponse<CourseSummary[]>>('/courses', { featured: 1, per_page: 8 }),
};

// ── SECTIONS ─────────────────────────────────────────────────
export const sectionsApi = {
  list: (courseId: number) =>
    get<ApiResponse<CourseSection[]>>(`/instructor/courses/${courseId}/sections`),

  create: (courseId: number, data: { title: string; sort_order?: number }) =>
    post<ApiResponse<CourseSection>>(`/instructor/courses/${courseId}/sections`, data),

  update: (courseId: number, id: number, data: Partial<CourseSection>) =>
    put<ApiResponse<CourseSection>>(`/instructor/courses/${courseId}/sections/${id}`, data),

  delete: (courseId: number, id: number) =>
    del<ApiResponse<null>>(`/instructor/courses/${courseId}/sections/${id}`),

  reorder: (courseId: number, sections: { id: number; sort_order: number }[]) =>
    post<ApiResponse<null>>(`/instructor/courses/${courseId}/sections/reorder`, { sections }),
};

// ── LESSONS ──────────────────────────────────────────────────
export const lessonsApi = {
  create: (sectionId: number, data: Partial<Lesson>) =>
    post<ApiResponse<Lesson>>(`/instructor/sections/${sectionId}/lessons`, data),

  update: (id: number, data: Partial<Lesson>) =>
    put<ApiResponse<Lesson>>(`/instructor/lessons/${id}`, data),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/instructor/lessons/${id}`),

  uploadVideo: (id: number, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('video', file);
    return postFormData<ApiResponse<{ upload_id: string; status: string }>>(`/instructor/lessons/${id}/upload-video`, fd);
  },

  addAttachment: (id: number, file: File, label: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('label', label);
    return postFormData<ApiResponse<LessonNote>>(`/instructor/lessons/${id}/attachments`, fd);
  },

  reorder: (lessons: { id: number; sort_order: number; section_id: number }[]) =>
    post<ApiResponse<null>>('/instructor/lessons/reorder', { lessons }),
};

// ── ENROLLMENT ───────────────────────────────────────────────
export const enrollmentApi = {
  enroll: (courseId: number) =>
    post<ApiResponse<{ enrollment_id: number; course_slug: string }>>('/enroll', { course_id: courseId }),

  myCourses: (params?: { status?: string }) =>
    get<ApiResponse<EnrolledCourse[]>>('/my-courses', params),

  progress: (slug: string) =>
    get<ApiResponse<CourseProgress>>(`/courses/${slug}/progress`),

  updateProgress: (data: { lesson_id: number; watch_seconds?: number; watch_percent?: number; is_completed?: boolean }) =>
    post<ApiResponse<null>>('/progress', data),
};

// ── NOTES ────────────────────────────────────────────────────
export const notesApi = {
  list: (lessonId: number) =>
    get<ApiResponse<LessonNote[]>>(`/lessons/${lessonId}/notes`),

  create: (lessonId: number, data: { content: string; timestamp_seconds?: number }) =>
    post<ApiResponse<LessonNote>>(`/lessons/${lessonId}/notes`, data),

  update: (id: number, data: { content: string }) =>
    put<ApiResponse<LessonNote>>(`/notes/${id}`, data),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/notes/${id}`),
};

// ── QUIZZES ──────────────────────────────────────────────────
export const quizzesApi = {
  getForLesson: (lessonId: number) =>
    get<ApiResponse<Quiz>>(`/lessons/${lessonId}/quiz`),

  startAttempt: (quizId: number) =>
    post<ApiResponse<{ attempt_id: number; expires_at: string | null }>>(`/quizzes/${quizId}/attempt/start`),

  submitAttempt: (quizId: number, data: { attempt_id: number; answers: { question_id: number; selected_options?: number[]; text_answer?: string }[] }) =>
    post<ApiResponse<QuizAttemptResult>>(`/quizzes/${quizId}/attempt/submit`, data),

  myAttempts: (quizId: number) =>
    get<ApiResponse<QuizAttempt[]>>(`/quizzes/${quizId}/attempts`),

  // Instructor
  create: (data: Partial<Quiz>) =>
    post<ApiResponse<Quiz>>('/instructor/quizzes', data),

  update: (id: number, data: Partial<Quiz>) =>
    put<ApiResponse<Quiz>>(`/instructor/quizzes/${id}`, data),
};

// ── REVIEWS ──────────────────────────────────────────────────
export const reviewsApi = {
  list: (slug: string, params?: { sort?: string; page?: number }) =>
    get<ApiResponse<Review[]>>(`/courses/${slug}/reviews`, params),

  create: (slug: string, data: { rating: number; title?: string; content?: string }) =>
    post<ApiResponse<Review>>(`/courses/${slug}/reviews`, data),

  update: (id: number, data: Partial<Review>) =>
    put<ApiResponse<Review>>(`/reviews/${id}`, data),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/reviews/${id}`),
};

// ── WISHLIST ─────────────────────────────────────────────────
export const wishlistApi = {
  list: () => get<ApiResponse<CourseSummary[]>>('/wishlist'),
  add: (courseId: number) => post<ApiResponse<null>>('/wishlist', { course_id: courseId }),
  remove: (courseId: number) => del<ApiResponse<null>>(`/wishlist/${courseId}`),
};

// ── PAYMENTS ─────────────────────────────────────────────────
export const paymentsApi = {
  checkout: (data: { items: { course_id: number }[]; coupon_code?: string }) =>
    post<ApiResponse<CheckoutResponse>>('/checkout', data),

  validateCoupon: (code: string, courseIds: number[]) =>
    post<ApiResponse<CouponValidation>>('/checkout/validate-coupon', { code, course_ids: courseIds }),

  orders: (page?: number) =>
    get<ApiResponse<Order[]>>('/orders', { page }),

  invoice: (orderId: number) =>
    `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/invoice`,

  plans: () =>
    get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans'),

  subscribe: (data: { plan_id: number; billing_cycle: string; payment_method_id: string }) =>
    post<ApiResponse<null>>('/subscriptions/subscribe', data),
};

// ── CERTIFICATES ─────────────────────────────────────────────
export const certificatesApi = {
  list: () => get<ApiResponse<Certificate[]>>('/certificates'),
  generate: (courseId: number) => post<ApiResponse<Certificate>>('/certificates/generate', { course_id: courseId }),
  verify: (uuid: string) => get<ApiResponse<Certificate>>(`/certificates/${uuid}/verify`),
  downloadUrl: (uuid: string) => `${process.env.NEXT_PUBLIC_API_URL}/certificates/${uuid}/download`,
};

// ── LIVE CLASSES ─────────────────────────────────────────────
export const liveClassesApi = {
  list: (slug: string) =>
    get<ApiResponse<LiveClass[]>>(`/courses/${slug}/live-classes`),

  join: (id: number) =>
    post<ApiResponse<LiveClassJoinResponse>>(`/live-classes/${id}/join`),

  create: (data: Partial<LiveClass>) =>
    post<ApiResponse<LiveClass>>('/instructor/live-classes', data),

  start: (id: number) =>
    post<ApiResponse<{ token: string; room: string }>>(`/instructor/live-classes/${id}/start`),

  end: (id: number) =>
    post<ApiResponse<null>>(`/instructor/live-classes/${id}/end`),
};

// ── DISCUSSIONS ──────────────────────────────────────────────
export const discussionsApi = {
  list: (slug: string, params?: { lesson_id?: number; page?: number }) =>
    get<ApiResponse<Discussion[]>>(`/courses/${slug}/discussions`, params),

  create: (slug: string, data: { title: string; content: string; lesson_id?: number }) =>
    post<ApiResponse<Discussion>>(`/courses/${slug}/discussions`, data),

  reply: (id: number, data: { content: string; parent_id?: number }) =>
    post<ApiResponse<DiscussionReply>>(`/discussions/${id}/replies`, data),

  upvote: (replyId: number) =>
    post<ApiResponse<null>>(`/discussion-replies/${replyId}/upvote`),
};

// ── NOTIFICATIONS ────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { read?: boolean; page?: number }) =>
    get<ApiResponse<Notification[]> & { unread_count: number }>('/notifications', params),

  markRead: (id: string) =>
    post<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    post<ApiResponse<null>>('/notifications/read-all'),

  delete: (id: string) =>
    del<ApiResponse<null>>(`/notifications/${id}`),
};

// ── CATEGORIES ───────────────────────────────────────────────
export const categoriesApi = {
  list: () => get<ApiResponse<Category[]>>('/categories'),
  courses: (slug: string, params?: Record<string, unknown>) =>
    get<ApiResponse<CourseSummary[]>>(`/categories/${slug}/courses`, params),
};

// ── SEARCH ───────────────────────────────────────────────────
export const searchApi = {
  search: (q: string, type?: 'courses' | 'instructors') =>
    get<ApiResponse<{ courses: CourseSummary[]; instructors: User[] }>>('/search', { q, type }),
};

// ── INSTRUCTOR ───────────────────────────────────────────────
export const instructorApi = {
  dashboard: () =>
    get<ApiResponse<InstructorDashboardStats>>('/instructor/dashboard'),

  courseAnalytics: (id: number) =>
    get<ApiResponse<unknown>>(`/instructor/analytics/courses/${id}`),

  earnings: () =>
    get<ApiResponse<unknown>>('/instructor/earnings'),
};

// ── ADMIN ────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () =>
    get<ApiResponse<AdminDashboardStats>>('/admin/dashboard'),

  users: (params?: Record<string, unknown>) =>
    get<ApiResponse<User[]>>('/admin/users', params),

  updateUserStatus: (id: number, status: string, reason?: string) =>
    put<ApiResponse<null>>(`/admin/users/${id}/status`, { status, reason }),

  updateUserRole: (id: number, role: string) =>
    put<ApiResponse<null>>(`/admin/users/${id}/role`, { role }),

  courses: (params?: Record<string, unknown>) =>
    get<ApiResponse<CourseDetail[]>>('/admin/courses', params),

  approveCourse: (id: number) =>
    put<ApiResponse<null>>(`/admin/courses/${id}/approve`, {}),

  rejectCourse: (id: number, reason: string) =>
    put<ApiResponse<null>>(`/admin/courses/${id}/reject`, { reason }),

  reviews: (params?: Record<string, unknown>) =>
    get<ApiResponse<Review[]>>('/admin/reviews', params),

  moderateReview: (id: number, status: 'approved' | 'rejected') =>
    put<ApiResponse<null>>(`/admin/reviews/${id}/moderate`, { status }),

  revenueReport: (from: string, to: string) =>
    get<ApiResponse<unknown>>('/admin/revenue/report', { from, to }),
};
