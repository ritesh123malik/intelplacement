'use client';
// app/profile/ProfileClient.tsx

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User, Bookmark, FileText, Map, Settings, Zap, LogOut, ExternalLink, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

type Tab = 'overview' | 'bookmarks' | 'resumes' | 'roadmaps' | 'settings';

export default function ProfileClient({ user, profile, subscription, bookmarks, resumes, roadmaps }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [college, setCollege] = useState(profile?.college || '');
  const [name, setName] = useState(profile?.full_name || '');
  const [saved, setSaved] = useState(false);

  const isPro = subscription?.plan !== 'free' && subscription?.status === 'active';

  async function saveProfile() {
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name, college }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const TABS: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, count: bookmarks.length },
    { id: 'resumes', label: 'Resumes', icon: FileText, count: resumes.length },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map, count: roadmaps.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
      {/* Profile header */}
      <div className="card p-6 mb-8 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-dim border border-blue/30 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-2xl text-blue uppercase">
            {(profile?.full_name || user.email)?.[0]}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl">{profile?.full_name || 'Your Profile'}</h1>
          <p className="text-text-muted text-sm">{user.email}</p>
          {profile?.college && <p className="text-text-secondary text-sm mt-0.5">{profile.college}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={clsx('badge', isPro ? 'badge-pro' : 'badge-free')}>
            {isPro && <Zap size={10} />}
            {isPro ? `Pro — ${subscription.plan}` : 'Free Plan'}
          </span>
          {!isPro && (
            <Link href="/pricing" className="text-blue text-xs hover:underline flex items-center gap-1">
              Upgrade <ExternalLink size={10} />
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap',
              activeTab === id
                ? 'bg-blue-dim text-blue font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
          >
            <Icon size={15} />
            {label}
            {count !== undefined && count > 0 && (
              <span className="bg-border text-text-muted text-xs px-1.5 py-0.5 rounded-full font-mono">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display font-bold mb-4">Activity Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Bookmarks', value: bookmarks.length },
                { label: 'Resumes Analyzed', value: resumes.length },
                { label: 'Roadmaps Made', value: roadmaps.length },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="font-display font-bold text-2xl text-blue">{value}</p>
                  <p className="text-text-muted text-xs font-mono uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-display font-bold mb-4">Subscription</h2>
            <p className="text-text-secondary text-sm mb-1">
              Plan: <span className="text-text-primary font-medium capitalize">{subscription?.plan || 'Free'}</span>
            </p>
            <p className="text-text-secondary text-sm mb-1">
              Status: <span className="text-green font-medium capitalize">{subscription?.status || 'Active'}</span>
            </p>
            {subscription?.expires_at && (
              <p className="text-text-secondary text-sm">
                Expires: <span className="text-text-primary">{new Date(subscription.expires_at).toLocaleDateString('en-IN')}</span>
              </p>
            )}
            {!isPro && (
              <Link href="/pricing" className="btn-gold w-full flex items-center justify-center gap-2 mt-4 text-sm">
                <Zap size={14} />Upgrade to Pro
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div>
          <h2 className="font-display font-bold text-lg mb-4">Saved Questions ({bookmarks.length})</h2>
          {bookmarks.length === 0 ? (
            <div className="card p-10 text-center">
              <Bookmark size={32} className="text-text-muted mx-auto mb-3" />
              <p className="font-display font-bold mb-1">No bookmarks yet</p>
              <p className="text-text-secondary text-sm mb-4">Browse company questions and bookmark the ones you want to practice.</p>
              <Link href="/companies" className="btn-primary inline-flex">Browse Companies</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookmarks.map((b: any) => (
                <div key={b.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${b.question?.difficulty === 'Easy' ? 'badge-easy' : b.question?.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'}`}>
                        {b.question?.difficulty}
                      </span>
                      <span className="badge border-border text-text-muted text-xs">{b.question?.round}</span>
                      {b.question?.company && (
                        <Link href={`/company/${b.question.company.slug}`}
                          className="badge border-blue/30 text-blue bg-blue-dim text-xs">
                          {b.question.company.name}
                        </Link>
                      )}
                    </div>
                    <span className="text-text-muted text-xs font-mono">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{b.question?.question}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resumes */}
      {activeTab === 'resumes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Resume History ({resumes.length})</h2>
            <Link href="/resume" className="btn-primary text-sm flex items-center gap-2">
              <FileText size={14} />Analyze New
            </Link>
          </div>
          {resumes.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText size={32} className="text-text-muted mx-auto mb-3" />
              <p className="font-display font-bold mb-1">No resumes analyzed yet</p>
              <p className="text-text-secondary text-sm mb-4">Upload your resume to get an AI score and improvement suggestions.</p>
              <Link href="/resume" className="btn-primary inline-flex">Analyze Resume</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {resumes.map((r: any) => (
                <div key={r.id} className="card p-6 flex items-center gap-5">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg viewBox="0 0 120 120" className="w-16 h-16 -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#1E1E2E" strokeWidth="10" />
                      <circle cx="60" cy="60" r="52" fill="none"
                        stroke={r.score >= 75 ? '#10B981' : r.score >= 50 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="10"
                        strokeDasharray={`${(r.score / 100) * 326.7} 326.7`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`font-display font-bold text-lg ${r.score >= 75 ? 'text-green' : r.score >= 50 ? 'text-gold' : 'text-red'}`}>{r.score}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold">{r.file_name || 'Resume'}</p>
                    <p className="text-text-secondary text-sm mt-0.5 line-clamp-2">{r.analysis}</p>
                    <p className="text-text-muted text-xs font-mono mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roadmaps */}
      {activeTab === 'roadmaps' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Saved Roadmaps ({roadmaps.length})</h2>
            <Link href="/roadmap" className="btn-primary text-sm flex items-center gap-2">
              <Map size={14} />New Roadmap
            </Link>
          </div>
          {roadmaps.length === 0 ? (
            <div className="card p-10 text-center">
              <Map size={32} className="text-text-muted mx-auto mb-3" />
              <p className="font-display font-bold mb-1">No roadmaps yet</p>
              <Link href="/roadmap" className="btn-primary inline-flex mt-4">Generate Roadmap</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {roadmaps.map((r: any) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold">{r.company} — {r.duration_weeks}-Week Plan</h3>
                    <span className="badge border-border text-text-muted capitalize text-xs">{r.level}</span>
                  </div>
                  <p className="text-text-secondary text-sm line-clamp-2">{r.content.slice(0, 160)}...</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Calendar size={12} className="text-text-muted" />
                    <span className="text-text-muted text-xs font-mono">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                    <Link href={`/roadmap?company=${encodeURIComponent(r.company)}`}
                      className="ml-auto text-blue text-xs hover:underline flex items-center gap-1">
                      Regenerate <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-md">
          <h2 className="font-display font-bold text-lg mb-6">Account Settings</h2>
          <div className="flex flex-col gap-4 mb-8">
            <div>
              <label className="section-label block mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="section-label block mb-1.5">College / University</label>
              <input type="text" value={college} onChange={e => setCollege(e.target.value)}
                placeholder="IIT Bombay, NIT Surathkal..." className="input" />
            </div>
            <div>
              <label className="section-label block mb-1.5">Email (cannot change)</label>
              <input type="email" value={user.email} disabled className="input opacity-50 cursor-not-allowed" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <button
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
              className="flex items-center gap-2 text-red text-sm hover:bg-red-dim px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
