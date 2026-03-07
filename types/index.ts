// types/index.ts — All TypeScript types for PlacementIntel

export type Plan = 'free' | 'pro' | 'annual';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Round = 'Online Test' | 'Technical 1' | 'Technical 2' | 'Managerial' | 'HR';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  college: string | null;
  graduation_year: number | null;
  target_role: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  expires_at: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  hq: string | null;
  industry: string | null;
  package_lpa_min: number | null;
  package_lpa_max: number | null;
  tier: 'free' | 'pro';
  is_active: boolean;
}

export interface Question {
  id: string;
  company_id: string;
  round: Round;
  question: string;
  topic: string | null;
  difficulty: Difficulty;
  frequency: number;
  year_reported: number | null;
  source_url?: string;
  acceptance_rate?: string;
  is_approved: boolean;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
  question?: Question;
}

export interface UserProgress {
  id: string;
  user_id: string;
  company_id: string;
  questions_viewed: number;
  questions_bookmarked: number;
  last_studied_at: string;
  prep_score: number;
  company?: Company;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string | null;
  score: number | null;
  analysis: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  missing_keywords: string[] | null;
  created_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  company: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  content: string;
  created_at: string;
}

export interface DashboardStats {
  companiesStudied: number;
  questionsBookmarked: number;
  resumeScore: number | null;
  roadmapsGenerated: number;
}
