'use client';
// app/admin/AdminClient.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, MessageSquare, Users, CreditCard, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'overview' | 'companies' | 'questions' | 'users' | 'payments' | 'submissions';

export default function AdminClient({ companies, questions, users, subscriptions, pendingSubmissions }: any) {
  const [tab, setTab] = useState<Tab>('overview');

  // New company form
  const [compName, setCompName] = useState('');
  const [compSlug, setCompSlug] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compHQ, setCompHQ] = useState('');
  const [compIndustry, setCompIndustry] = useState('Technology');
  const [compPkgMin, setCompPkgMin] = useState('');
  const [compPkgMax, setCompPkgMax] = useState('');
  const [compTier, setCompTier] = useState<'free' | 'pro'>('free');
  const [compSaving, setCompSaving] = useState(false);

  // New question form
  const [qCompanyId, setQCompanyId] = useState('');
  const [qRound, setQRound] = useState('Technical 1');
  const [qQuestion, setQQuestion] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qFrequency, setQFrequency] = useState('1');
  const [qYear, setQYear] = useState(new Date().getFullYear().toString());
  const [qSaving, setQSaving] = useState(false);

  async function addCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompSaving(true);
    const { error } = await supabase.from('companies').insert({
      name: compName, slug: compSlug, description: compDesc, hq: compHQ,
      industry: compIndustry, package_lpa_min: parseInt(compPkgMin) || null,
      package_lpa_max: parseInt(compPkgMax) || null, tier: compTier,
    });
    if (!error) {
      setCompName(''); setCompSlug(''); setCompDesc('');
      alert('Company added! Refresh to see it.');
    } else {
      alert('Error: ' + error.message);
    }
    setCompSaving(false);
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!qCompanyId) { alert('Select a company'); return; }
    setQSaving(true);
    const { error } = await supabase.from('questions').insert({
      company_id: qCompanyId, round: qRound, question: qQuestion,
      topic: qTopic || null, difficulty: qDifficulty,
      frequency: parseInt(qFrequency) || 1,
      year_reported: parseInt(qYear) || null,
      is_approved: true,
    });
    if (!error) {
      setQQuestion(''); setQTopic('');
      alert('Question added!');
    } else {
      alert('Error: ' + error.message);
    }
    setQSaving(false);
  }

  async function approveSubmission(id: string, data: any) {
    // Find or create company
    let companyId = companies.find((c: any) => c.name.toLowerCase() === data.company_name.toLowerCase())?.id;
    if (!companyId) {
      const { data: newComp } = await supabase.from('companies').insert({
        name: data.company_name,
        slug: data.company_name.toLowerCase().replace(/\s+/g, '-'),
        tier: 'free',
      }).select().single();
      companyId = newComp?.id;
    }

    if (companyId) {
      await supabase.from('questions').insert({
        company_id: companyId, round: data.round, question: data.question,
        topic: data.topic, difficulty: data.difficulty || 'Medium',
        year_reported: data.year_appeared, is_approved: true,
      });
    }
    await supabase.from('question_submissions').update({ status: 'approved' }).eq('id', id);
    alert('Approved and added!');
  }

  async function rejectSubmission(id: string) {
    await supabase.from('question_submissions').update({ status: 'rejected' }).eq('id', id);
    alert('Rejected');
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'companies', label: `Companies (${companies.length})` },
    { id: 'questions', label: `Questions (${questions.length})` },
    { id: 'users', label: `Users (${users.length})` },
    { id: 'payments', label: `Pro Users (${subscriptions.length})` },
    { id: 'submissions', label: `Submissions (${pendingSubmissions.length})` },
  ];

  const totalRevenue = subscriptions.reduce((acc: number, s: any) =>
    acc + (s.amount_paise || 0), 0) / 100;

  return (
    <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <p className="section-label mb-1">Admin</p>
        <h1 className="font-display font-bold text-3xl">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 border-b border-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={clsx(
              'px-4 py-2.5 text-sm transition-colors whitespace-nowrap -mb-px border-b-2',
              tab === id ? 'border-blue text-blue font-medium' : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Total Companies', value: companies.length, icon: Building2 },
            { label: 'Total Questions', value: questions.length, icon: MessageSquare },
            { label: 'Total Users', value: users.length, icon: Users },
            { label: 'Revenue (₹)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: CreditCard },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-6">
              <Icon size={20} className="text-blue mb-3" />
              <p className="font-display font-bold text-2xl">{value}</p>
              <p className="text-text-muted text-xs font-mono uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Company */}
      {tab === 'companies' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display font-bold text-lg mb-5">Add Company</h2>
            <form onSubmit={addCompany} className="card p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-label block mb-1.5">Name</label>
                  <input value={compName} onChange={e => { setCompName(e.target.value); setCompSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                    placeholder="Google" required className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Slug</label>
                  <input value={compSlug} onChange={e => setCompSlug(e.target.value)}
                    placeholder="google" required className="input" />
                </div>
              </div>
              <div>
                <label className="section-label block mb-1.5">Description</label>
                <textarea value={compDesc} onChange={e => setCompDesc(e.target.value)} rows={2} className="input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-label block mb-1.5">HQ</label>
                  <input value={compHQ} onChange={e => setCompHQ(e.target.value)} placeholder="Bengaluru, India" className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Industry</label>
                  <select value={compIndustry} onChange={e => setCompIndustry(e.target.value)} className="input">
                    {['Technology', 'E-commerce', 'IT Services', 'Fintech', 'SaaS', 'Other'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="section-label block mb-1.5">Min LPA</label>
                  <input type="number" value={compPkgMin} onChange={e => setCompPkgMin(e.target.value)} placeholder="20" className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Max LPA</label>
                  <input type="number" value={compPkgMax} onChange={e => setCompPkgMax(e.target.value)} placeholder="60" className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Tier</label>
                  <select value={compTier} onChange={e => setCompTier(e.target.value as 'free' | 'pro')} className="input">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={compSaving} className="btn-primary flex items-center gap-2">
                <Plus size={16} />{compSaving ? 'Adding...' : 'Add Company'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-display font-bold text-lg mb-5">All Companies</h2>
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {companies.map((c: any) => (
                <div key={c.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-text-muted text-xs font-mono">{c.slug} • {c.tier}</p>
                  </div>
                  <span className={`badge ${c.tier === 'pro' ? 'badge-pro' : 'badge-free'}`}>{c.tier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Question */}
      {tab === 'questions' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display font-bold text-lg mb-5">Add Question</h2>
            <form onSubmit={addQuestion} className="card p-6 flex flex-col gap-4">
              <div>
                <label className="section-label block mb-1.5">Company</label>
                <select value={qCompanyId} onChange={e => setQCompanyId(e.target.value)} required className="input">
                  <option value="">Select company...</option>
                  {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label block mb-1.5">Question</label>
                <textarea value={qQuestion} onChange={e => setQQuestion(e.target.value)} rows={3}
                  placeholder="Enter the interview question..." required className="input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="section-label block mb-1.5">Round</label>
                  <select value={qRound} onChange={e => setQRound(e.target.value)} className="input">
                    {['Online Test', 'Technical 1', 'Technical 2', 'Managerial', 'HR'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-1.5">Difficulty</label>
                  <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)} className="input">
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="section-label block mb-1.5">Topic</label>
                  <input value={qTopic} onChange={e => setQTopic(e.target.value)} placeholder="Arrays" className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Frequency</label>
                  <input type="number" value={qFrequency} onChange={e => setQFrequency(e.target.value)} placeholder="1" className="input" />
                </div>
                <div>
                  <label className="section-label block mb-1.5">Year</label>
                  <input type="number" value={qYear} onChange={e => setQYear(e.target.value)} className="input" />
                </div>
              </div>
              <button type="submit" disabled={qSaving} className="btn-primary flex items-center gap-2">
                <Plus size={16} />{qSaving ? 'Adding...' : 'Add Question'}
              </button>
            </form>
          </div>
          <div>
            <h2 className="font-display font-bold text-lg mb-5">Recent Questions</h2>
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {questions.map((q: any) => (
                <div key={q.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue font-mono">{q.company?.name}</span>
                    <span className="badge border-border text-text-muted text-xs">{q.round}</span>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <h2 className="font-display font-bold text-lg mb-5">All Users ({users.length})</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  {['Email', 'Name', 'College', 'Joined'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-text-muted font-mono text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, i: number) => (
                  <tr key={u.id} className={clsx('border-b border-border', i % 2 === 0 ? '' : 'bg-surface/50')}>
                    <td className="px-5 py-3 text-blue font-mono text-xs">{u.email}</td>
                    <td className="px-5 py-3">{u.full_name || '—'}</td>
                    <td className="px-5 py-3 text-text-secondary text-xs">{u.college || '—'}</td>
                    <td className="px-5 py-3 text-text-muted text-xs font-mono">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments */}
      {tab === 'payments' && (
        <div>
          <h2 className="font-display font-bold text-lg mb-5">Pro Subscribers ({subscriptions.length})</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  {['Email', 'Plan', 'Amount', 'Status', 'Expires'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-text-muted font-mono text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s: any, i: number) => (
                  <tr key={s.id} className={clsx('border-b border-border', i % 2 === 0 ? '' : 'bg-surface/50')}>
                    <td className="px-5 py-3 text-blue font-mono text-xs">{s.profile?.email}</td>
                    <td className="px-5 py-3"><span className="badge badge-pro capitalize">{s.plan}</span></td>
                    <td className="px-5 py-3 font-mono text-green">₹{((s.amount_paise || 0) / 100).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-mono ${s.status === 'active' ? 'text-green' : 'text-red'}`}>{s.status}</span>
                    </td>
                    <td className="px-5 py-3 text-text-muted text-xs font-mono">
                      {s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submissions */}
      {tab === 'submissions' && (
        <div>
          <h2 className="font-display font-bold text-lg mb-5">Pending Submissions ({pendingSubmissions.length})</h2>
          {pendingSubmissions.length === 0 ? (
            <div className="card p-10 text-center">
              <CheckCircle size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No pending submissions. All caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingSubmissions.map((s: any) => (
                <div key={s.id} className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-blue text-sm">{s.company_name}</span>
                    <span className="badge border-border text-text-muted text-xs">{s.round}</span>
                    <span className="text-text-muted text-xs font-mono ml-auto">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-4">{s.question}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => approveSubmission(s.id, s)}
                      className="flex items-center gap-1.5 bg-green-dim text-green border border-green/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green/20 transition-colors">
                      <CheckCircle size={13} />Approve & Add
                    </button>
                    <button onClick={() => rejectSubmission(s.id)}
                      className="flex items-center gap-1.5 bg-red-dim text-red border border-red/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red/20 transition-colors">
                      <XCircle size={13} />Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
