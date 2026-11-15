// ============================================================
// types/api.ts — All API types for LearnHub
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

// ============================================================
// USER & AUTH
// ============================================================

export type UserRole = 'student' | 'instructor' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  avatar_url: string;
  email_verified_at: string | null;
  created_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  bio: string | null;
  headline: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  youtube: string | null;
  github: string | null;
  timezone: string;
  language: string;
  phone: string | null;
  country: string | null;
  preferences: Record<string, boolean> | null;
  revenue_share: number;
  payout_email: string | null;
}

export interface InstructorProfile extends User {
  profile: UserProfile;
  stats: {
    courses_count: number;
    students_count: number;
    rating_avg: number;
    reviews_count: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================================
// CATEGORIES
// ============================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  parent_id: number | null;
  courses_count?: number;
  children?: Category[];
}

// ============================================================
// COURSES
// ============================================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
export type CourseStatus = 'draft' | 'under_review' | 'published' | 'archived';
export type PricingType = 'free' | 'paid' | 'subscription';

export interface CourseSummary {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  thumbnail: string | null;
  thumbnail_url: string | null;
  instructor: Pick<User, 'id' | 'name' | 'avatar' | 'avatar_url'>;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  level: CourseLevel;
  pricing_type: PricingType;
  price: number;
  sale_price: number | null;
  currency: string;
  rating_avg: number;
  rating_count: number;
  enrollments_count: number;
  duration_hours: number;
  lessons_count: number;
  language: string;
  is_featured: boolean;
  is_wishlisted?: boolean;
  is_enrolled?: boolean;
  effective_price: number;
  is_on_sale: boolean;
}

export interface CourseDetail extends CourseSummary {
  description: string | null;
  what_you_learn: string[];
  requirements: string[];
  for_whom: string[];
  trailer_video: string | null;
  certificate_enabled: boolean;
  published_at: string | null;
  tags: Tag[];
  sections: CourseSection[];
  enrollment: Enrollment | null;
  progress_map: Record<number, boolean>;
  reviews_summary: {
    avg: number;
    total: number;
    distribution: Record<string, number>;
  };
  instructor: InstructorProfile;
}

// ============================================================
// SECTIONS & LESSONS
// ============================================================

export type LessonType = 'video' | 'article' | 'quiz' | 'assignment' | 'download' | 'embed' | 'live';

export interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: Lesson[];
  lessons_count?: number;
  duration_seconds?: number;
}

export interface Lesson {
  id: number;
  section_id: number;
  course_id: number;
  title: string;
  description: string | null;
  type: LessonType;
  content: string | null;
  video_url: string | null;
  video_playback_id: string | null;
  duration_seconds: number;
  formatted_duration: string;
  embed_url: string | null;
  attachments: LessonAttachment[] | null;
  quiz_id: number | null;
  is_preview: boolean;
  is_published: boolean;
  sort_order: number;
  is_completed?: boolean;
}

export interface LessonAttachment {
  label: string;
  url: string;
  size: number;
  mime_type: string;
}

// ============================================================
// ENROLLMENT & PROGRESS
// ============================================================

export type EnrollmentStatus = 'active' | 'completed' | 'refunded' | 'expired';

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: EnrollmentStatus;
  amount_paid: number;
  enrolled_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface CourseProgress {
  percentage: number;
  completed_lessons: number;
  total_lessons: number;
  completed_lesson_ids: number[];
  last_lesson_id: number | null;
  last_lesson?: Lesson;
  certificate_eligible: boolean;
}

export interface LessonProgress {
  lesson_id: number;
  is_completed: boolean;
  watch_seconds: number;
  watch_percent: number;
  last_watched_at: string | null;
}

export interface LessonNote {
  id: number;
  lesson_id: number;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ENROLLED COURSE (My Learning)
// ============================================================

export interface EnrolledCourse {
  course: CourseSummary;
  enrollment: Enrollment;
  progress: {
    completed_lessons: number;
    total_lessons: number;
    percentage: number;
    last_lesson: (Lesson & { section: Pick<CourseSection, 'id' | 'title'> }) | null;
  };
}

// ============================================================
// REVIEWS
// ============================================================

export interface Review {
  id: number;
  user: Pick<User, 'id' | 'name' | 'avatar_url'>;
  course_id: number;
  rating: number;
  title: string | null;
  content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_verified_purchase: boolean;
  created_at: string;
}

// ============================================================
// QUIZZES
// ============================================================

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'multi_select';

export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number | null;
  randomize_questions: boolean;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  type: QuestionType;
  question: string;
  explanation: string | null;
  points: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  content: string;
  is_correct?: boolean; // hidden until submitted
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface QuizAttemptResult extends QuizAttempt {
  answers: Array<{
    question_id: number;
    selected_options: number[];
    text_answer: string | null;
    is_correct: boolean;
    points_earned: number;
  }>;
  questions: QuizQuestion[]; // with is_correct revealed
}

// ============================================================
// PAYMENTS & ORDERS
// ============================================================

export interface Order {
  id: number;
  order_number: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  payment_method: string | null;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  course_id: number;
  course_title: string;
  price: number;
  currency: string;
  course: Pick<CourseSummary, 'id' | 'title' | 'thumbnail_url'>;
}

export interface CheckoutResponse {
  order_id: number;
  client_secret?: string;
  amount: number;
  currency: string;
  subtotal: number;
  discount: number;
  free?: boolean;
  redirect?: string;
}

export interface CouponValidation {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discount_amount: number;
  final_total: number;
}

// ============================================================
// CERTIFICATES
// ============================================================

export interface Certificate {
  id: number;
  uuid: string;
  user_id: number;
  course_id: number;
  pdf_url: string | null;
  verify_url: string;
  issued_at: string;
  user?: Pick<User, 'id' | 'name'>;
  course?: Pick<CourseSummary, 'id' | 'title'>;
}

// ============================================================
// LIVE CLASSES
// ============================================================

export interface LiveClass {
  id: number;
  course_id: number;
  instructor_id: number;
  title: string;
  description: string | null;
  room_name: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduled_at: string;
  duration_minutes: number;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  max_attendees: number | null;
  instructor?: Pick<User, 'id' | 'name' | 'avatar_url'>;
}

export interface LiveClassJoinResponse {
  token: string;
  room: string;
  url: string;
}

// ============================================================
// DISCUSSIONS
// ============================================================

export interface Discussion {
  id: number;
  user: Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>;
  course_id: number;
  lesson_id: number | null;
  title: string;
  content: string;
  is_pinned: boolean;
  is_answered: boolean;
  views_count: number;
  replies_count: number;
  created_at: string;
  replies?: DiscussionReply[];
}

export interface DiscussionReply {
  id: number;
  user: Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>;
  content: string;
  is_accepted_answer: boolean;
  upvotes_count: number;
  created_at: string;
  children?: DiscussionReply[];
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    action_url?: string;
    course_id?: number;
    course_title?: string;
  };
  read_at: string | null;
  created_at: string;
}

// ============================================================
// TAGS
// ============================================================

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

// ============================================================
// CART (Frontend State)
// ============================================================

export interface CartItem {
  course: CourseSummary;
  price: number;
}

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
}

// ============================================================
// ADMIN & DASHBOARD
// ============================================================

export interface AdminDashboardStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  total_revenue: number;
  monthly_revenue: Array<{ month: string; amount: number }>;
  new_users_this_month: number;
  new_courses_this_month: number;
}

export interface InstructorDashboardStats {
  total_students: number;
  total_revenue: number;
  pending_payout: number;
  total_courses: number;
  avg_rating: number;
  recent_enrollments: EnrolledCourse[];
  monthly_revenue: Array<{ month: string; amount: number }>;
}
