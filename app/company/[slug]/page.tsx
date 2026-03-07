// app/company/[slug]/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import PaywallModal from '@/components/PaywallModal';
import Link from 'next/link';
import { Globe, MapPin, TrendingUp, BookOpen, Filter, Zap, Clock } from 'lucide-react';
import { Question } from '@/types';
import AIFloatingButton from '@/components/ai/AIFloatingButton';
import Breadcrumbs from '@/components/Breadcrumbs';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ round?: string; difficulty?: string; topic?: string }>;
}

export default async function CompanyPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const [companyRes, subscriptionRes] = await Promise.all([
    supabase.from('companies').select('*').eq('slug', params.slug).eq('is_active', true).single(),
    user ? supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single() : Promise.resolve({ data: null }),
  ]);

  if (!companyRes.data) notFound();
  const company = companyRes.data;
  const isPro = subscriptionRes.data?.plan !== 'free' && subscriptionRes.data?.status === 'active';
  const canAccess = company.tier === 'free' || isPro;

  // Build question query
  let qQuery = supabase.from('questions').select('*').eq('company_id', company.id).eq('is_approved', true);
  if (searchParams.round) qQuery = qQuery.eq('round', searchParams.round);
  if (searchParams.difficulty) qQuery = qQuery.eq('difficulty', searchParams.difficulty);
  if (searchParams.topic) qQuery = qQuery.eq('topic', searchParams.topic);
  qQuery = qQuery.order('frequency', { ascending: false });

  const { data: questions } = await qQuery;

  // Get unique filter values
  const { data: allQuestions } = await supabase.from('questions')
    .select('round, difficulty, topic')
    .eq('company_id', company.id)
    .eq('is_approved', true);

  const rounds = [...new Set(allQuestions?.map(q => q.round) || [])];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const topics = [...new Set(allQuestions?.map(q => q.topic).filter(Boolean) || [])];

  // Get user bookmarks
  let bookmarkedIds: string[] = [];
  if (user) {
    const { data: bookmarks } = await supabase
      .from('bookmarks').select('question_id').eq('user_id', user.id);
    bookmarkedIds = bookmarks?.map(b => b.question_id) || [];
  }

  const displayedQuestions = canAccess ? questions : questions?.slice(0, 3);
  const lockedCount = !canAccess ? (questions?.length || 0) - 3 : 0;

  const roundStats = rounds.reduce((acc: any, round) => {
    acc[round] = allQuestions?.filter(q => q.round === round).length || 0;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Companies', href: '/companies' }, { label: company.name }]} className="mb-6" />

        {/* Company Header */}
        <div className="mb-10">
          <Link href="/companies" className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors mb-4 inline-flex items-center gap-1">
            ← Back to Companies
          </Link>
          <div className="flex items-start gap-6 mt-4">
            <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-white flex items-center justify-center font-display font-bold text-xl text-gray-600 flex-shrink-0 shadow-card">
              {company.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-gray-900">{company.name}</h1>
                {company.tier === 'pro' && (
                  <span className="badge badge-pro"><Zap size={10} aria-hidden />Pro</span>
                )}
              </div>
              <p className="text-gray-600 mb-3">{company.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {company.hq && <span className="flex items-center gap-1.5"><MapPin size={13} aria-hidden />{company.hq}</span>}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    <Globe size={13} aria-hidden />Website
                  </a>
                )}
                {company.package_lpa_min && (
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <TrendingUp size={13} aria-hidden />₹{company.package_lpa_min}–{company.package_lpa_max} LPA
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Round breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {rounds.map(round => (
            <Link
              key={round}
              href={`/company/${params.slug}?round=${encodeURIComponent(round)}`}
              className={`card p-4 text-center transition-all hover:border-gray-300
                ${searchParams.round === round ? 'border-primary-300 bg-primary-50' : ''}`}
            >
              <p className="font-display font-bold text-xl text-gray-900">{roundStats[round]}</p>
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-0.5 leading-tight">{round}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <div className="lg:w-52 flex-shrink-0">
            <div className="card p-5 sticky top-24">
              <h3 className="section-label mb-4 flex items-center gap-1.5">
                <Filter size={12} aria-hidden />Filters
              </h3>

              {/* Difficulty */}
              <div className="mb-5">
                <p className="text-gray-600 text-xs mb-2 font-medium">Difficulty</p>
                <div className="flex flex-col gap-1">
                  <Link href={`/company/${params.slug}${searchParams.round ? `?round=${searchParams.round}` : ''}`}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium
                      ${!searchParams.difficulty ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900'}`}>
                    All
                  </Link>
                  {difficulties.map(d => (
                    <Link key={d}
                      href={`/company/${params.slug}?${new URLSearchParams({ ...searchParams, difficulty: d }).toString()}`}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors
                        ${searchParams.difficulty === d ? (d === 'Easy' ? 'bg-green-50 text-green-700 font-medium' : d === 'Hard' ? 'bg-red-50 text-red-700 font-medium' : 'bg-amber-50 text-amber-700 font-medium') : 'text-gray-600 hover:text-gray-900'}`}>
                      {d}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Topics */}
              {topics.length > 0 && (
                <div>
                  <p className="text-gray-600 text-xs mb-2 font-medium">Topics</p>
                  <div className="flex flex-col gap-1">
                    {topics.slice(0, 10).map(topic => (
                      <Link key={topic}
                        href={`/company/${params.slug}?${new URLSearchParams({ ...searchParams, topic: topic! }).toString()}`}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors truncate
                          ${searchParams.topic === topic ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                        {topic}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-gray-600 text-sm">
                <span className="font-bold text-gray-900">{questions?.length || 0}</span> questions
                {searchParams.round && <span> in {searchParams.round}</span>}
              </p>
              {user && (
                <div className="flex items-center gap-3">
                  <Link href={`/company/${params.slug}/test`} className="btn-primary text-sm flex items-center gap-1.5">
                    <Clock size={14} aria-hidden />
                    Take Practice Test
                  </Link>
                  <Link href={`/roadmap?company=${encodeURIComponent(company.name)}`} className="btn-secondary text-sm flex items-center gap-1.5">
                    <BookOpen size={14} aria-hidden />
                    Generate Roadmap
                  </Link>
                </div>
              )}
            </div>

            {(!displayedQuestions || displayedQuestions.length === 0) ? (
              <div className="card p-10 text-center">
                <p className="text-gray-500 font-medium">No questions found for these filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 stagger-children">
                {displayedQuestions.map((question: Question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    isBookmarked={bookmarkedIds.includes(question.id)}
                    userId={user?.id}
                    companyId={company.id}
                  />
                ))}

                {/* Paywall */}
                {!canAccess && lockedCount > 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/90 to-transparent z-10 rounded-xl pointer-events-none" />
                    <div className="card p-12 text-center border-amber-200 relative z-20">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap size={26} className="text-amber-600" aria-hidden />
                      </div>
                      <h3 className="font-display font-bold text-xl text-gray-900 mb-2">
                        {lockedCount} more questions locked
                      </h3>
                      <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
                        {company.name} is a Pro company. Upgrade to see all questions, including system design and managerial rounds.
                      </p>
                      <Link href="/pricing" className="btn-gold inline-flex items-center gap-2">
                        <Zap size={15} aria-hidden />
                        Unlock with Pro
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* AI Assistant Floating Action Button */}
      <AIFloatingButton />
    </div>
  );
}
