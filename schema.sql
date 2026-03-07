-- ============================================================
-- PLACEMENT INTEL — Complete Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ─────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  college text,
  graduation_year int,
  target_role text default 'SDE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── SUBSCRIPTIONS ──────────────────────────────────────────
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan text not null default 'free',          -- 'free' | 'pro' | 'annual'
  status text not null default 'active',      -- 'active' | 'expired' | 'cancelled'
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_paise int,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ─── COMPANIES ──────────────────────────────────────────────
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  website text,
  hq text,
  industry text,
  package_lpa_min int,
  package_lpa_max int,
  tier text default 'free',                   -- 'free' | 'pro'
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─── QUESTIONS ──────────────────────────────────────────────
create table questions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  round text not null,                        -- 'Online Test' | 'Technical 1' | 'Technical 2' | 'Managerial' | 'HR'
  question text not null,
  topic text,                                 -- 'Arrays' | 'DP' | 'Graphs' | 'System Design' etc.
  difficulty text default 'Medium',           -- 'Easy' | 'Medium' | 'Hard'
  frequency int default 1,                    -- how many people reported this question
  year_reported int,
  source_url text,
  is_approved boolean default false,
  created_at timestamptz default now()
);

-- ─── BOOKMARKS ──────────────────────────────────────────────
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_id, question_id)
);

-- ─── USER PROGRESS ──────────────────────────────────────────
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  questions_viewed int default 0,
  questions_bookmarked int default 0,
  last_studied_at timestamptz default now(),
  prep_score int default 0,                   -- 0-100
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, company_id)
);

-- ─── RESUMES ────────────────────────────────────────────────
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text,
  score int,                                  -- 0-100
  analysis text,                              -- full AI analysis text
  strengths text[],
  improvements text[],
  missing_keywords text[],
  created_at timestamptz default now()
);

-- ─── ROADMAPS ───────────────────────────────────────────────
create table roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company text not null,
  level text default 'intermediate',          -- 'beginner' | 'intermediate' | 'advanced'
  duration_weeks int default 4,
  content text not null,                      -- AI generated markdown
  created_at timestamptz default now()
);

-- ─── QUESTION SUBMISSIONS (crowdsourced) ────────────────────
create table question_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  round text not null,
  question text not null,
  topic text,
  difficulty text,
  year_appeared int,
  status text default 'pending',              -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table bookmarks enable row level security;
alter table user_progress enable row level security;
alter table resumes enable row level security;
alter table roadmaps enable row level security;
alter table question_submissions enable row level security;

-- Companies and questions are public read
alter table companies enable row level security;
alter table questions enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_own" on profiles
  for all using (auth.uid() = id);

-- Subscriptions: users can read their own
create policy "subscriptions_own_read" on subscriptions
  for select using (auth.uid() = user_id);

-- Companies: everyone can read active companies
create policy "companies_public_read" on companies
  for select using (is_active = true);

-- Questions: everyone can read approved questions
create policy "questions_public_read" on questions
  for select using (is_approved = true);

-- Bookmarks: users manage their own
create policy "bookmarks_own" on bookmarks
  for all using (auth.uid() = user_id);

-- Progress: users manage their own
create policy "progress_own" on user_progress
  for all using (auth.uid() = user_id);

-- Resumes: users manage their own
create policy "resumes_own" on resumes
  for all using (auth.uid() = user_id);

-- Roadmaps: users manage their own
create policy "roadmaps_own" on roadmaps
  for all using (auth.uid() = user_id);

-- Submissions: users can insert and read their own
create policy "submissions_insert" on question_submissions
  for insert with check (auth.uid() = user_id);
create policy "submissions_own_read" on question_submissions
  for select using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger progress_updated_at before update on user_progress
  for each row execute function update_updated_at();

-- ============================================================
-- SEED DATA — Sample companies and questions
-- ============================================================

insert into companies (name, slug, description, hq, industry, package_lpa_min, package_lpa_max, tier) values
('Google', 'google', 'World''s largest search engine and tech conglomerate.', 'Mountain View, CA', 'Technology', 40, 120, 'pro'),
('Microsoft', 'microsoft', 'Enterprise software, cloud computing, and gaming.', 'Redmond, WA', 'Technology', 35, 100, 'pro'),
('Amazon', 'amazon', 'E-commerce, cloud (AWS), and AI services.', 'Seattle, WA', 'Technology', 30, 90, 'pro'),
('Flipkart', 'flipkart', 'India''s leading e-commerce marketplace.', 'Bengaluru, India', 'E-commerce', 25, 60, 'free'),
('Infosys', 'infosys', 'IT services, consulting, and outsourcing.', 'Bengaluru, India', 'IT Services', 10, 30, 'free'),
('TCS', 'tcs', 'Largest Indian IT services company globally.', 'Mumbai, India', 'IT Services', 8, 25, 'free'),
('Razorpay', 'razorpay', 'India''s leading payment gateway and fintech.', 'Bengaluru, India', 'Fintech', 25, 55, 'free'),
('Meesho', 'meesho', 'Social commerce platform for small businesses.', 'Bengaluru, India', 'E-commerce', 20, 50, 'free'),
('Atlassian', 'atlassian', 'Collaboration tools for software teams.', 'Sydney, Australia', 'SaaS', 35, 80, 'pro'),
('Adobe', 'adobe', 'Creative software and digital document solutions.', 'San Jose, CA', 'Technology', 30, 75, 'pro');

-- Get company IDs for questions (use subqueries)
insert into questions (company_id, round, question, topic, difficulty, frequency, year_reported, is_approved)
select id, 'Online Test', 'Find the longest substring without repeating characters.', 'Sliding Window', 'Medium', 847, 2024, true from companies where slug = 'google'
union all
select id, 'Technical 1', 'Design a URL shortener like bit.ly. What data model would you use?', 'System Design', 'Hard', 612, 2024, true from companies where slug = 'google'
union all
select id, 'Technical 1', 'Given a binary tree, find the maximum path sum.', 'Trees', 'Hard', 534, 2023, true from companies where slug = 'google'
union all
select id, 'Technical 2', 'Implement LRU Cache with O(1) get and put operations.', 'Data Structures', 'Medium', 923, 2024, true from companies where slug = 'amazon'
union all
select id, 'Technical 1', 'Find the kth largest element in an unsorted array.', 'Arrays', 'Medium', 789, 2024, true from companies where slug = 'amazon'
union all
select id, 'Technical 2', 'Design Amazon''s recommendation engine. Focus on scalability.', 'System Design', 'Hard', 445, 2023, true from companies where slug = 'amazon'
union all
select id, 'Online Test', 'Two Sum — find indices of two numbers that add to target.', 'Arrays', 'Easy', 1200, 2024, true from companies where slug = 'microsoft'
union all
select id, 'Technical 1', 'Design a file system with create, delete, read, write.', 'System Design', 'Hard', 567, 2024, true from companies where slug = 'microsoft'
union all
select id, 'Technical 1', 'Merge K sorted linked lists.', 'Linked Lists', 'Hard', 678, 2023, true from companies where slug = 'flipkart'
union all
select id, 'Online Test', 'Given a string, find all permutations.', 'Recursion', 'Medium', 345, 2024, true from companies where slug = 'razorpay';
