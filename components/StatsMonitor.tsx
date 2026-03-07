'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { statsService } from '@/lib/stats-service';

export default function StatsMonitor() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();

        // Refresh every 5 seconds
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const userStats = await statsService.getUserStats(user.id);
            setStats(userStats);
            setLoading(false);
        }
    };

    if (loading) return <div className="sr-only">Loading stats...</div>;

    return (
        <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-xl fixed bottom-4 right-4 w-80 shadow-lg z-50 backdrop-blur-sm" role="complementary" aria-label="Live stats">
            <h3 className="font-bold text-gray-900 mb-2">Live Stats</h3>
            <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Total Cards:</span>
                    <span className="font-mono font-medium text-gray-900">{stats?.totalCards}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Due Today:</span>
                    <span className="font-mono font-medium text-amber-600">{stats?.dueCount}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Retention:</span>
                    <span className="font-mono font-medium text-emerald-600">{stats?.retentionRate}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Streak:</span>
                    <span className="font-mono font-medium text-purple-600">{stats?.streak?.current_streak} days</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews:</span>
                    <span className="font-mono font-medium text-gray-900">{stats?.streak?.total_reviews}</span>
                </div>
            </div>
        </div>
    );
}
