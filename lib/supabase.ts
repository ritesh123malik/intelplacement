// lib/supabase.ts — Supabase clients for browser and server

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — use in components and client pages
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server/admin client — use in API routes only (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  typeof window !== 'undefined' ? 'dummy' : process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Helper: get authenticated user from server component
// Usage: const user = await getUser(cookieStore)
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper: check if user has pro subscription
export async function isPro(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .single();

  if (!data) return false;
  if (data.plan === 'free') return false;
  if (data.status !== 'active') return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  return true;
}
