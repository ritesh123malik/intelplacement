'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    Search,
    Filter,
    ArrowUpRight,
    Plus,
    X,
    Loader2,
    Zap
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
    id: string;
    title: string;
    url: string;
    difficulty: string;
    status: string;
    topic_tags?: string[];
    question_number?: number;
    platform?: string;
    external_id?: string;
    rating?: number;
    notes?: string;
}

interface Props {
    initialQuestions: Question[];
    sheetId: string;
}

export default function QuestionList({ initialQuestions, sheetId }: Props) {
    const supabase = createClient();
    const [questions, setQuestions] = useState(initialQuestions);
    const [userStatus, setUserStatus] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved'>('All');
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newQuestion, setNewQuestion] = useState({ title: '', url: '', difficulty: 'Medium' });

    // Fetch user-specific status on mount
    useEffect(() => {
        const fetchUserStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: statuses, error } = await supabase
                .from('user_question_status')
                .select('question_id, status')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching user statuses:', error);
                return;
            }

            if (statuses) {
                const statusMap = statuses.reduce((acc, curr) => ({
                    ...acc,
                    [curr.question_id]: curr.status
                }), {});
                setUserStatus(statusMap);
            }
        };
        fetchUserStatus();
    }, [sheetId, supabase]);

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const currentStatus = userStatus[q.id] || 'unsolved';
            const matchesDifficulty = filter === 'All' || q.difficulty === filter;
            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Solved' ? currentStatus === 'solved' : currentStatus !== 'solved');
            const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
            return matchesDifficulty && matchesStatus && matchesSearch;
        });
    }, [questions, userStatus, filter, statusFilter, search]);

    const stats = useMemo(() => {
        const total = questions.length;
        const solved = Object.values(userStatus).filter(s => s === 'solved').length;
        const progress = total ? Math.round((solved / total) * 100) : 0;
        return { total, solved, progress };
    }, [questions, userStatus]);

    async function toggleStatus(questionId: string, currentStatus: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const nextStatus = currentStatus === 'solved' ? 'unsolved' : 'solved';
        setUserStatus(prev => ({ ...prev, [questionId]: nextStatus }));

        const { error } = await supabase
            .from('user_question_status')
            .upsert({
                user_id: user.id,
                question_id: questionId,
                status: nextStatus,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,question_id' });

        if (error) {
            console.error('Error updating status:', error);
            setUserStatus(prev => ({ ...prev, [questionId]: currentStatus }));
        }
    }

    async function handleAddQuestion() {
        if (!newQuestion.title || !newQuestion.url) return;
        setIsAdding(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: inserted, error } = await supabase
                .from('sheet_questions')
                .insert({
                    sheet_id: sheetId,
                    title: newQuestion.title,
                    url: newQuestion.url,
                    difficulty: newQuestion.difficulty,
                    question_number: questions.length + 1
                })
                .select()
                .single();

            if (error) throw error;

            // Add the new question to the list with a local ID if needed, 
            // though 'inserted' should have the DB ID.
            setQuestions(prev => [...prev, inserted]);
            setIsAddModalOpen(false);
            setNewQuestion({ title: '', url: '', difficulty: 'Medium' });

            // Optional: You could add a toast here if sonner was installed, 
            // but we'll stick to local state for now.
        } catch (err: any) {
            console.error('Injection error:', err);
            alert('Failed to inject intel: ' + (err.message || 'Protocol interrupted'));
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Real-time Progress Card */}
            <div className="glass-card p-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/5 blur-[100px] rounded-full" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-3">Sync_Loop_Stability</p>
                        <div className="flex items-end gap-4">
                            <h2 className="text-7xl font-black text-[var(--brand-primary)] leading-none tracking-tighter">{stats.progress}%</h2>
                            <p className="text-[var(--text-secondary)] font-black text-xl mb-1 uppercase tracking-tight">{stats.solved} / {stats.total} Secured</p>
                        </div>
                    </div>
                    <div className="flex-1 max-w-md">
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
                            <div
                                className="h-full bg-brand-gradient shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.3)] transition-all duration-1000 ease-out"
                                style={{ width: `${stats.progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            <span>Sector Start</span>
                            <span className="text-[var(--brand-primary)] animate-pulse">Infiltration Active</span>
                            <span>Objective Complete</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary-lg !py-4 !px-8 flex items-center gap-3 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Inject New Data
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center sticky top-20 z-30 py-6 bg-[var(--bg-base)]/80 backdrop-blur-xl -mx-4 px-6 border-y border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl mr-2">
                        <Filter size={14} className="text-[var(--brand-primary)]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Difficulty</span>
                    </div>
                    {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                        <button
                            key={d}
                            onClick={() => setFilter(d as any)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === d
                                ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-[var(--brand-primary)]/20'
                                : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-white/5'
                                }`}
                        >
                            {d}
                        </button>
                    ))}

                    <div className="w-px h-8 bg-[var(--border-subtle)] mx-3" />

                    <div className="flex items-center gap-2">
                        {['All', 'Solved', 'Unsolved'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s as any)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-white/5'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search for a tactical challenge..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] rounded-2xl text-sm text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-all shadow-xl"
                    />
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] w-24 text-center">Protocol_ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Intel_Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tactical_Archive</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Threat_Level</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Deployment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {filteredQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 text-[var(--text-muted)]">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-dashed border-[var(--border-subtle)]">
                                                <Search size={40} className="opacity-20" />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-sm">No matches found in database.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredQuestions.map((q, idx) => (
                                <tr key={q.id} className="hover:bg-white/[0.02] transition-all group">
                                    <td className="px-8 py-6 text-[11px] font-mono text-[var(--text-muted)] text-center font-black">#{String(q.question_number || idx + 1).padStart(3, '0')}</td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => toggleStatus(q.id, userStatus[q.id] || 'unsolved')}
                                            className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-tighter transition-all hover:scale-105 ${(userStatus[q.id] || 'unsolved') === 'solved' ? 'text-[var(--brand-success)]' :
                                                'text-[var(--text-muted)] hover:text-white'
                                                }`}
                                        >
                                            {(userStatus[q.id] || 'unsolved') === 'solved' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            <span className="tracking-widest">{(userStatus[q.id] || 'unsolved')}</span>
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-md">
                                            <div className="flex items-center gap-3 mb-1">
                                                {/* Platform Badge */}
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${q.platform === 'leetcode' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    q.platform === 'codeforces' ? 'bg-blue-500/20 text-blue-500' :
                                                        q.platform === 'cses' ? 'bg-teal-500/20 text-teal-500' :
                                                            q.platform === 'gfg' ? 'bg-emerald-500/20 text-emerald-500' :
                                                                q.platform === 'atcoder' ? 'bg-gray-500/20 text-gray-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {q.platform === 'leetcode' ? 'LC' :
                                                        q.platform === 'codeforces' ? 'CF' :
                                                            q.platform === 'cses' ? 'CSES' :
                                                                q.platform === 'atcoder' ? 'AC' : q.platform}
                                                </span>
                                                <p
                                                    className="text-[17px] font-black text-white group-hover:text-[var(--brand-primary)] transition-colors uppercase tracking-tight leading-tight cursor-pointer"
                                                    onClick={() => q.url && window.open(q.url, '_blank')}
                                                >
                                                    {q.title}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {q.topic_tags?.slice(0, 3).map((tag: string) => (
                                                    <span key={tag} className="text-[9px] bg-white/5 border border-white/5 px-3 py-1 rounded-lg text-[var(--text-muted)] font-black uppercase tracking-widest group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {q.notes && q.notes.startsWith('http') && (
                                                    <a
                                                        href={q.notes}
                                                        target="_blank"
                                                        className="text-[9px] bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-lg text-brand-primary font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center gap-1"
                                                    >
                                                        Solution <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border text-center ${q.difficulty === 'Easy' ? 'text-[var(--brand-success)] border-[var(--brand-success)]/20 bg-[var(--brand-success)]/5' :
                                                q.difficulty === 'Medium' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                                    'text-[var(--brand-danger)] border-[var(--brand-danger)]/20 bg-[var(--brand-danger)]/5'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                            {q.platform === 'codeforces' && q.rating && (
                                                <span className="text-[9px] font-mono text-text-muted text-center tracking-widest">
                                                    Rating: {q.rating}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <a
                                            href={q.url || `https://www.google.com/search?q=${encodeURIComponent(q.title + ' interview question')}`}
                                            target="_blank"
                                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-[var(--brand-primary)]/20 ${q.url ? 'bg-white text-black hover:bg-[var(--brand-primary)] hover:text-white' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-white/5'
                                                }`}
                                        >
                                            {q.url ? 'Infiltrate' : 'Trace Intel'} <ArrowUpRight size={14} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Question Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[3rem] p-12 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Inject Data</h3>
                                    <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest">Manual Intel Ingestion Protocol</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white/5 hover:bg-[var(--brand-danger)]/20 hover:text-[var(--brand-danger)] rounded-2xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Challenge Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Spiral Matrix II"
                                        value={newQuestion.title}
                                        onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Deployment URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://leetcode.com/problems/..."
                                        value={newQuestion.url}
                                        onChange={(e) => setNewQuestion(prev => ({ ...prev, url: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Threat Level</label>
                                    <div className="flex gap-3">
                                        {['Easy', 'Medium', 'Hard'].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setNewQuestion(prev => ({ ...prev, difficulty: d }))}
                                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${newQuestion.difficulty === d ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white' : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10'
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddQuestion}
                                    disabled={!newQuestion.title || !newQuestion.url || isAdding}
                                    className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[var(--brand-primary)] hover:text-white transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} />}
                                    {isAdding ? 'Uploading Intel...' : 'Confirm Injection'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
