'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { leetcodeAPI } from '@/lib/leetcode/api';
import {
    UserCircleIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrophyIcon,
    ChartBarIcon,
    FireIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

interface LeetCodeProfile {
    id: string;
    leetcode_username: string;
    total_solved: number;
    easy_solved: number;
    medium_solved: number;
    hard_solved: number;
    acceptance_rate: number;
    ranking: number;
    streak: number;
    last_synced_at: string;
}

export default function LeetCodeConnect() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [stats, setStats] = useState<any>(null);

    // Fetch existing profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('leetcode_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setProfile(data);
            fetchStats(data.leetcode_username);
        }
    };

    const fetchStats = async (username: string) => {
        const profileData = await leetcodeAPI.fetchUserProfile(username);
        if (profileData) {
            setStats(profileData);
        }
    };

    const handleConnect = async () => {
        if (!username.trim()) {
            setError('Please enter a LeetCode username');
            return;
        }

        setValidating(true);
        setError('');
        setSuccess('');

        try {
            // Validate username
            const isValid = await leetcodeAPI.validateUsername(username);

            if (!isValid) {
                setError('Invalid LeetCode username. Please check and try again.');
                setValidating(false);
                return;
            }

            // Fetch profile data
            const profileData = await leetcodeAPI.fetchUserProfile(username);

            if (!profileData) {
                setError('Could not fetch profile data. Please try again.');
                setValidating(false);
                return;
            }

            setStats(profileData);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('You must be logged in to connect a profile');
                return;
            }

            // Save to database
            const { data, error: dbError } = await supabase
                .from('leetcode_profiles')
                .upsert({
                    user_id: user.id,
                    leetcode_username: username,
                    total_solved: profileData.totalSolved,
                    easy_solved: profileData.easySolved,
                    medium_solved: profileData.mediumSolved,
                    hard_solved: profileData.hardSolved,
                    acceptance_rate: profileData.acceptanceRate,
                    ranking: profileData.ranking,
                    streak: profileData.streak,
                    last_synced_at: new Date().toISOString(),
                    profile_data: profileData
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (dbError) throw dbError;

            setProfile(data);
            setSuccess('LeetCode profile connected successfully!');
            setUsername('');
        } catch (err: any) {
            setError(err.message || 'Failed to connect profile');
        } finally {
            setValidating(false);
        }
    };

    const handleSync = async () => {
        if (!profile) return;

        setSyncing(true);
        setError('');

        try {
            const profileData = await leetcodeAPI.fetchUserProfile(profile.leetcode_username);

            if (!profileData) {
                throw new Error('Could not fetch profile data');
            }

            const { data: { user } } = await supabase.auth.getUser();

            const { error: updateError } = await supabase
                .from('leetcode_profiles')
                .update({
                    total_solved: profileData.totalSolved,
                    easy_solved: profileData.easySolved,
                    medium_solved: profileData.mediumSolved,
                    hard_solved: profileData.hardSolved,
                    acceptance_rate: profileData.acceptanceRate,
                    ranking: profileData.ranking,
                    streak: profileData.streak,
                    last_synced_at: new Date().toISOString(),
                    profile_data: profileData
                })
                .eq('user_id', user?.id);

            if (updateError) throw updateError;

            setStats(profileData);
            setProfile({ ...profile, ...profileData, last_synced_at: new Date().toISOString() });
            setSuccess('Profile synced successfully!');

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to sync profile');
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your LeetCode profile?')) return;

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('leetcode_profiles')
            .delete()
            .eq('user_id', user?.id);

        if (error) {
            setError('Failed to disconnect profile');
        } else {
            setProfile(null);
            setStats(null);
            setSuccess('Profile disconnected');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
                <div className="flex items-center space-x-3">
                    <AcademicCapIcon className="w-8 h-8" />
                    <div>
                        <h2 className="text-xl font-bold font-display">Connect LeetCode Profile</h2>
                        <p className="text-orange-100 text-sm">Showcase your problem-solving skills</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center text-sm">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        {success}
                    </div>
                )}

                {!profile ? (
                    // Connect Form
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                LeetCode Username
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g., john_doe"
                                    className="flex-1 p-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm outline-none"
                                    disabled={validating}
                                />
                                <button
                                    onClick={handleConnect}
                                    disabled={validating || !username}
                                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                                >
                                    {validating ? (
                                        <>
                                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        'Connect'
                                    )}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Your profile will be visible to employers and recruiters
                            </p>
                        </div>

                        {/* Preview of what they'll get */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Problems Solved', icon: '✓', color: 'green' },
                                { label: 'Acceptance Rate', icon: '📊', color: 'blue' },
                                { label: 'Global Ranking', icon: '🏆', color: 'yellow' },
                                { label: 'Current Streak', icon: '🔥', color: 'orange' },
                            ].map((item, i) => (
                                <div key={i} className="bg-surface border border-border p-4 rounded-xl text-center">
                                    <div className="text-2xl mb-1">{item.icon}</div>
                                    <div className="text-xs text-text-muted font-medium">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Connected Profile View
                    <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                                    {profile.leetcode_username[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {profile.leetcode_username}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Last synced: {new Date(profile.last_synced_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="p-2 text-gray-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition border border-transparent hover:border-orange-100"
                                    title="Sync now"
                                >
                                    <ArrowPathIcon className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-100"
                                    title="Disconnect"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-green-50 border border-green-100 p-3 rounded-xl hover:shadow-sm transition">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {profile.total_solved}
                                </div>
                                <div className="text-xs text-gray-500 mb-2 font-medium">Total Solved</div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-green-600/80">Easy</span>
                                        <span className="font-medium text-gray-700">{profile.easy_solved}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-yellow-600/80">Medium</span>
                                        <span className="font-medium text-gray-700">{profile.medium_solved}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-500/80">Hard</span>
                                        <span className="font-medium text-gray-700">{profile.hard_solved}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl hover:shadow-sm transition flex flex-col justify-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {profile.acceptance_rate?.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Acceptance Rate</div>
                            </div>

                            <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl hover:shadow-sm transition flex flex-col justify-center">
                                <div className="text-lg font-bold text-purple-600 mb-1 truncate" title={`#${profile.ranking?.toLocaleString()}`}>
                                    #{profile.ranking?.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Global Rank</div>
                            </div>

                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl hover:shadow-sm transition flex flex-col justify-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1 flex items-center">
                                    {profile.streak}
                                    <FireIcon className="w-4 h-4 ml-1 text-orange-500" />
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Day Streak</div>
                            </div>
                        </div>

                        {/* Badges/Achievements */}
                        {stats?.contributions && (
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <TrophyIcon className="w-4 h-4 mr-2 text-yellow-500" />
                                    Contributions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {stats.contributions.points > 0 && (
                                        <span className="px-2 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-xs font-medium">
                                            {stats.contributions.points} Points
                                        </span>
                                    )}
                                    {stats.contributions.questionCount > 0 && (
                                        <span className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-medium">
                                            {stats.contributions.questionCount} Questions
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
