// app/admin/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Only admin emails can access
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  if (!adminEmails.includes(user.email || '')) {
    redirect('/dashboard');
  }

  const [companiesRes, questionsRes, usersRes, subsRes, submissionsRes] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('questions').select('*, company:companies(name)').order('created_at', { ascending: false }).limit(50),
    supabase.from('profiles').select('id, email, full_name, college, created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('subscriptions').select('*, profile:profiles(email)').neq('plan', 'free').order('created_at', { ascending: false }),
    supabase.from('question_submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-bg noise">
      <AdminClient
        companies={companiesRes.data || []}
        questions={questionsRes.data || []}
        users={usersRes.data || []}
        subscriptions={subsRes.data || []}
        pendingSubmissions={submissionsRes.data || []}
      />
    </div>
  );
}
