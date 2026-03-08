// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { BookOpen, FileText, Map, Bookmark, TrendingUp, ArrowRight, Zap, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/dashboard');

  // Fetch all user data in parallel
  const [profileRes, subRes, progressRes, bookmarksRes, resumeRes, roadmapsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('user_progress').select('*, company:companies(name, slug)').eq('user_id', user.id).order('last_studied_at', { ascending: false }).limit(5),
    supabase.from('bookmarks').select('id').eq('user_id', user.id),
    supabase.from('resumes').select('score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('roadmaps').select('id').eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const subscription = subRes.data;
  const progress = progressRes.data || [];
  const bookmarkCount = bookmarksRes.data?.length || 0;
  const latestResume = resumeRes.data?.[0];
  const roadmapCount = roadmapsRes.data?.length || 0;
  const isPro = subscription?.plan !== 'free' && subscription?.status === 'active';
  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';

  const QUICK_ACTIONS = [
    { href: '/companies', icon: BookOpen, label: 'Browse Companies', desc: '40+ companies', color: 'blue' },
    { href: '/resume', icon: FileText, label: 'Score Resume', desc: 'AI analysis', color: 'gold' },
    { href: '/roadmap', icon: Map, label: 'Build Roadmap', desc: '4-week plan', color: 'green' },
    { href: '/profile#bookmarks', icon: Bookmark, label: 'My Bookmarks', desc: `${bookmarkCount} saved`, color: 'blue' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="section-label mb-2">Dashboard</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-gray-900">
              Hey, {firstName} 👋
            </h1>
            <p className="text-gray-600 mt-1.5">
              {progress.length === 0
                ? "You haven't started studying yet. Pick a company below."
                : `You're studying ${progress.length} ${progress.length === 1 ? 'company' : 'companies'}.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Companies Studied', value: progress.length, icon: BookOpen, color: 'blue' },
            { label: 'Questions Bookmarked', value: bookmarkCount, icon: Bookmark, color: 'blue' },
            { label: 'Resume Score', value: latestResume?.score ? `${latestResume.score}/100` : '—', icon: FileText, color: 'gold' },
            { label: 'Roadmaps Generated', value: roadmapCount, icon: Map, color: 'green' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3
                ${color === 'blue' ? 'bg-primary-50' : color === 'gold' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <Icon size={17} className={color === 'blue' ? 'text-primary-600' : color === 'gold' ? 'text-amber-600' : 'text-emerald-600'} aria-hidden />
              </div>
              <p className="font-display font-bold text-2xl text-gray-900">{value}</p>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="md:col-span-1">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-600" aria-hidden />
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
                <Link key={href} href={href} className="card card-hover p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${color === 'blue' ? 'bg-primary-50' : color === 'gold' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <Icon size={18} className={color === 'blue' ? 'text-primary-600' : color === 'gold' ? 'text-amber-600' : 'text-emerald-600'} aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-gray-900">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={15} className="text-gray-400" aria-hidden />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary-600" aria-hidden />
              Recent Activity
            </h2>
            {progress.length === 0 ? (
              <div className="card p-10 text-center">
                <BookOpen size={32} className="text-gray-400 mx-auto mb-3" aria-hidden />
                <p className="font-display font-bold text-gray-900 mb-1">No companies studied yet</p>
                <p className="text-gray-600 text-sm mb-5">Browse companies and start reading questions to track progress here.</p>
                <Link href="/companies" className="btn-primary inline-flex">Browse Companies</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {progress.map((p: any) => (
                  <Link key={p.id} href={`/company/${p.company?.slug}`}
                    className="card card-hover p-5 flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-gray-900">{p.company?.name}</p>
                      <p className="text-gray-500 text-xs font-mono mt-0.5">
                        {p.questions_viewed} questions viewed • {p.questions_bookmarked} bookmarked
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-display font-bold text-primary-600">{p.prep_score}%</p>
                        <p className="text-gray-500 text-xs">prep score</p>
                      </div>
                      <div className="relative w-10 h-10">
                        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90" aria-hidden>
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-primary-600" strokeWidth="3"
                            strokeDasharray={`${(p.prep_score / 100) * 94.2} 94.2`}
                            strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/companies" className="text-primary-600 text-sm flex items-center gap-1 hover:gap-2 transition-all font-medium mt-1">
                  Add more companies <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
