// components/leaderboard/Leaderboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays, format } from 'date-fns';
import {
    TrophyIcon,
    FireIcon,
    AcademicCapIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface LeaderboardProps {
    userId: string;
}

export default function Leaderboard({ userId }: LeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [userStats, setUserStats] = useState<any>(null);
    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [timeframe]);

    const loadData = async () => {
        // Load leaderboard
        const { data: leaderboardData } = await supabase
            .from('leaderboard_entries')
            .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
            .order('total_points', { ascending: false })
            .limit(100);

        setLeaderboard(leaderboardData || []);

        // Load heatmap data for current user
        const startDate = subDays(new Date(), 365);
        const { data: heatmap } = await supabase
            .from('contribution_heatmap')
            .select('*')
            .eq('user_id', userId)
            .gte('activity_date', startDate.toISOString().split('T')[0]);

        setHeatmapData(heatmap || []);

        // Get user stats
        const { data: stats } = await supabase
            .from('leaderboard_entries')
            .select('*')
            .eq('user_id', userId)
            .single();

        setUserStats(stats);
        setLoading(false);
    };

    const getContributionColor = (value: number) => {
        if (!value) return 'color-empty';
        if (value < 5) return 'color-scale-1';
        if (value < 10) return 'color-scale-2';
        if (value < 20) return 'color-scale-3';
        return 'color-scale-4';
    };

    if (loading) {
        return <div className="text-center py-12 text-black">Loading...</div>;
    }

    return (
        <div className="space-y-8 text-black">
            {/* User Stats */}
            {userStats && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">Your Stats</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <div className="text-3xl font-bold">{userStats.total_points}</div>
                            <div className="text-sm text-indigo-100">Total Points</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{userStats.questions_solved}</div>
                            <div className="text-sm text-indigo-100">Questions</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{userStats.quizzes_taken}</div>
                            <div className="text-sm text-indigo-100">Quizzes</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{userStats.streak_days}</div>
                            <div className="text-sm text-indigo-100">Day Streak</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Heatmap */}
            <div className="bg-white rounded-2xl shadow-sm p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center">
                        <FireIcon className="w-5 h-5 mr-2 text-orange-500" />
                        Contribution Heatmap
                    </h3>
                    <div className="flex items-center space-x-2 text-xs">
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-gray-200 rounded mr-1"></span> Less
                        </span>
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-green-300 rounded mr-1"></span>
                        </span>
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded mr-1"></span>
                        </span>
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-green-700 rounded mr-1"></span> More
                        </span>
                    </div>
                </div>

                <CalendarHeatmap
                    startDate={subDays(new Date(), 365)}
                    endDate={new Date()}
                    values={heatmapData.map(d => ({
                        date: d.activity_date,
                        count: d.count
                    }))}
                    classForValue={(value) => {
                        if (!value) return 'color-empty';
                        return getContributionColor(value.count);
                    }}
                    tooltipDataAttrs={(value: any) => {
                        return {
                            'data-tip': value?.date ?
                                `${value.date}: ${value.count} activities` :
                                'No activity'
                        } as any;
                    }}
                    showWeekdayLabels={true}
                />
            </div>

            {/* Timeframe Selector */}
            <div className="flex space-x-2">
                {['weekly', 'monthly', 'alltime'].map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${timeframe === tf
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold flex items-center">
                        <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
                        Global Leaderboard
                    </h3>
                </div>

                <div className="divide-y">
                    {leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.user_id === userId;
                        const rank = index + 1;

                        return (
                            <div
                                key={entry.user_id}
                                className={`p-4 flex items-center ${isCurrentUser ? 'bg-indigo-50' : ''
                                    }`}
                            >
                                <div className="w-12 text-center">
                                    {rank <= 3 ? (
                                        <span className="text-2xl">
                                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                                        </span>
                                    ) : (
                                        <span className="text-gray-500 font-mono">#{rank}</span>
                                    )}
                                </div>

                                <div className="flex-1 flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                        {entry.profiles?.full_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {entry.profiles?.full_name || 'Anonymous'}
                                            {isCurrentUser && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">You</span>}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {entry.questions_solved} questions • {entry.quizzes_taken} quizzes
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-lg">{entry.total_points}</p>
                                    <p className="text-xs text-gray-500">points</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
