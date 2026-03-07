'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { spacedRepetition } from '@/lib/spaced-repetition/service';

export default function TestStatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        loadStats();
    }, [refreshKey]);

    const loadStats = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const userStats = await spacedRepetition.getStats(user.id);
            setStats(userStats);
        }
        setLoading(false);
    };

    const refreshStats = () => {
        setRefreshKey(prev => prev + 1);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 pb-32 pt-24 max-w-4xl mx-auto min-h-screen">
            <h1 className="text-3xl font-display font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue to-purple-500">Analytics Monitor</h1>

            <button
                onClick={refreshStats}
                className="mb-8 px-5 py-2.5 bg-blue-dim text-blue hover:bg-blue hover:text-white transition-colors rounded-xl font-medium shadow-sm"
            >
                Refresh Diagnostics
            </button>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card p-6 border-border rounded-xl">
                    <h3 className="text-sm font-semibold mb-2 text-text-muted">Total Cards</h3>
                    <p className="text-4xl font-bold text-blue tracking-tight">{stats?.totalCards}</p>
                </div>
                <div className="card p-6 border-border rounded-xl">
                    <h3 className="text-sm font-semibold mb-2 text-text-muted">Cards Due</h3>
                    <p className="text-4xl font-bold text-orange-500 tracking-tight">{stats?.dueCount}</p>
                </div>
                <div className="card p-6 border-border rounded-xl">
                    <h3 className="text-sm font-semibold mb-2 text-text-muted">Retention Rate</h3>
                    <p className="text-4xl font-bold text-green-500 tracking-tight">{stats?.retentionRate}%</p>
                </div>
                <div className="card p-6 border-border rounded-xl">
                    <h3 className="text-sm font-semibold mb-2 text-text-muted">Current Streak</h3>
                    <p className="text-4xl font-bold text-purple-500 tracking-tight">{stats?.streak?.current_streak}</p>
                </div>
            </div>

            <div className="bg-[#0b0c10] border border-border shadow-2xl p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gold/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green/50"></div>
                    </div>
                    <h3 className="text-xs uppercase tracking-widest font-semibold text-text-muted">Raw JSON Payload</h3>
                </div>

                <pre className="text-emerald-400 font-mono text-sm leading-relaxed overflow-auto scrollbar-hide">
                    {JSON.stringify(stats, null, 2)}
                </pre>
            </div>
        </div>
    );
}
