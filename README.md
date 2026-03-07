# PlacementIntel — Complete Setup Guide

A full-stack AI-powered placement preparation platform built on Next.js 14, Supabase, and OpenAI.

## What's Included

- **Landing page** — Conversion-focused with testimonials, stats, and pricing
- **Authentication** — Email + Google via Supabase Auth
- **Company directory** — 40+ companies with free/pro tiers
- **Question bank** — Round-wise, difficulty-filtered interview questions
- **AI Resume Scorer** — Upload PDF, get GPT-4 score + improvement plan
- **Prep Roadmap Generator** — Personalized week-by-week study plans
- **Bookmark system** — Save questions, track progress per company
- **Payments** — Razorpay integration (UPI, cards, net banking)
- **User profiles** — History, bookmarks, resume scores, roadmaps
- **Admin panel** — Full CRUD for companies, questions, users, payments
- **Community submissions** — Students submit questions, admin approves

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google OAuth) |
| AI | OpenAI GPT-4o-mini |
| Payments | Razorpay |
| Styling | Tailwind CSS |
| Fonts | Syne (display) + DM Sans (body) |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd placement-intel
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your project URL and anon key
3. Go to **SQL Editor** → paste and run the entire contents of `schema.sql`
4. Go to **Authentication** → enable Google provider (add OAuth credentials from Google Console)
5. Go to **Authentication → URL Configuration** → add your site URL + `http://localhost:3000/auth/callback`

### 3. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Fund your account (GPT-4o-mini is very cheap — ~$0.0001 per resume analysis)

### 4. Set up Razorpay

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to Settings → API Keys → Generate Test Keys
3. Copy Key ID and Key Secret
4. For live payments, complete KYC and switch to live keys

### 5. Environment Variables

Create `.env.local` (copy from `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=sk-your_openai_key

RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=your@email.com
```

### 6. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 7. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add all env vars in Vercel dashboard
# Set NEXT_PUBLIC_APP_URL to your Vercel URL
```

---

## Business Model

| Tier | Price | What's included |
|------|-------|-----------------|
| Free | ₹0 | 3 free companies, 1 resume/day, 3 roadmaps/week |
| Pro Monthly | ₹499/month | All 40+ companies, unlimited AI, all features |
| Pro Annual | ₹2,999/year | Same as Pro + 50% discount |

### Revenue projections (conservative)

| Users | Conversion | Monthly Revenue |
|-------|-----------|-----------------|
| 1,000 | 3% (30 pro) | ₹14,970 |
| 5,000 | 3% (150 pro) | ₹74,850 |
| 10,000 | 3% (300 pro) | ₹1,49,700 |

---

## Adding Content

### Add Companies (Admin Panel)

1. Sign in with your admin email (set `ADMIN_EMAILS` in env)
2. Go to `/admin` → Companies tab
3. Fill form and click "Add Company"
4. Set tier: `free` for Indian companies, `pro` for FAANG

### Add Questions (Admin Panel)

1. Go to `/admin` → Questions tab
2. Select company, fill round/topic/difficulty
3. All questions added here are immediately live

### Bulk add via SQL

Run `schema.sql` modifications directly in Supabase SQL editor for bulk imports.

---

## Growth Strategy

1. **Week 1**: Go live, post in college placement groups
2. **Week 2-4**: Add more companies based on requests (use submissions feature)
3. **Month 2**: Partner with college placement cells
4. **Month 3**: Add referral program (1 free month for each referral who upgrades)
5. **Month 6**: Add mock interview feature, placement drive tracker

---

## Key Files

```
app/
├── page.tsx                    ← Landing page
├── auth/login/page.tsx         ← Login
├── auth/signup/page.tsx        ← Signup
├── dashboard/page.tsx          ← User dashboard
├── companies/page.tsx          ← Company directory
├── company/[slug]/page.tsx     ← Company questions
├── resume/page.tsx             ← Resume analyzer
├── roadmap/page.tsx            ← Roadmap generator
├── profile/page.tsx            ← User profile
├── pricing/page.tsx            ← Pricing page
├── admin/page.tsx              ← Admin panel
├── api/resume/route.ts         ← Resume AI API
├── api/roadmap/route.ts        ← Roadmap AI API
├── api/payment/create-order/   ← Razorpay order creation
└── api/payment/verify/         ← Razorpay payment verification

lib/
├── supabase.ts                 ← Supabase clients
└── openai.ts                   ← OpenAI client

schema.sql                      ← Complete database schema + seed data
```

---

## License

Build freely. Ship fast. Monetize ethically.
