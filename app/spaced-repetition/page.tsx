'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { statsService } from '@/lib/stats-service';
import ReviewCard from '@/components/spaced-repetition/ReviewCard';
import StatsMonitor from '@/components/StatsMonitor';
import {
    FireIcon,
    ChartBarIcon,
    ClockIcon,
    AcademicCapIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';

export default function SpacedRepetitionPage() {
    const [dueCards, setDueCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [completed, setCompleted] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth/login');
            return;
        }

        // Get stats
        const userStats = await statsService.getUserStats(user.id);
        setStats(userStats);

        // Get due cards from database
        const { data: cards, error } = await supabase
            .from('spaced_repetition_cards')
            .select(`
        id,
        question_id,
        ease_factor,
        interval,
        stage,
        review_count,
        lapses,
        last_reviewed_at,
        next_review_at,
        questions!inner (
          question,
          difficulty,
          source_url,
          companies!inner (
            name
          )
        )
      `)
            .eq('user_id', user.id)
            .lte('next_review_at', new Date().toISOString())
            .order('next_review_at', { ascending: true });

        if (error) {
            console.error('Error fetching due cards:', error);
        } else {
            // Format cards
            const formattedCards = (cards || []).map((card: any) => ({
                id: card.id,
                question_id: card.question_id,
                question: card.questions.question,
                difficulty: card.questions.difficulty,
                company: card.questions.companies?.name || 'Unknown',
                leetcode_url: card.questions.source_url,
                ease_factor: card.ease_factor,
                interval: card.interval,
                stage: card.stage,
                review_count: card.review_count || 0,
                lapses: card.lapses || 0,
                last_reviewed_at: card.last_reviewed_at
            }));

            setDueCards(formattedCards);
            setCurrentIndex(0);
            setCompleted(0);
        }

        setLoading(false);
    };

    const handleReview = async (rating: number, updatedStats?: any) => {
        if (updatedStats) {
            setStats(updatedStats);
        }

        setCompleted(prev => prev + 1);

        if (currentIndex < dueCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowCelebration(true);

            // Refresh data after celebration
            setTimeout(() => {
                setRefreshTrigger(prev => prev + 1);
                setShowCelebration(false);
            }, 3000);
        }
    };

    const handleSkip = () => {
        if (currentIndex < dueCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" role="status" aria-label="Loading" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg py-10">
            <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight">
                            Spaced Repetition
                        </h1>
                        <p className="text-gray-600 mt-2">Master interview questions through scientifically optimized review intervals.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Refresh"
                        aria-label="Refresh"
                    >
                        <ArrowPathIcon className="w-5 h-5" aria-hidden />
                    </button>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="card p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <AcademicCapIcon className="w-6 h-6 text-primary-600" aria-hidden />
                                <span className="text-3xl font-bold font-mono text-gray-900">{stats.totalCards}</span>
                            </div>
                            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Total Enrolled</p>
                        </div>
                        <div className="card p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <ClockIcon className="w-6 h-6 text-amber-500" aria-hidden />
                                <span className="text-3xl font-bold font-mono text-gray-900">{stats.dueCount}</span>
                            </div>
                            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Due Today</p>
                        </div>
                        <div className="card p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <ChartBarIcon className="w-6 h-6 text-emerald-500" aria-hidden />
                                <span className="text-3xl font-bold font-mono text-gray-900">{stats.retentionRate}%</span>
                            </div>
                            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Retention</p>
                        </div>
                        <div className="card p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <FireIcon className="w-6 h-6 text-purple-500" aria-hidden />
                                <span className="text-3xl font-bold font-mono text-gray-900">{stats.streak.current_streak}</span>
                            </div>
                            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Day Streak</p>
                        </div>
                    </div>
                )}

                {dueCards.length > 0 && (
                    <div className="max-w-3xl mx-auto mb-10">
                        <div className="flex justify-between text-sm font-medium text-gray-600 mb-3">
                            <span>Today&apos;s Progress</span>
                            <span><span className="text-primary-600 font-semibold">{completed}</span> <span className="text-gray-500">/ {dueCards.length} completed</span></span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-primary-600 to-accent-purple h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(completed / dueCards.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Celebration Modal */}
                <AnimatePresence>
                    {showCelebration && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm p-4"
                        >
                            <div className="card rounded-3xl p-12 text-center max-w-md shadow-xl relative overflow-hidden">
                                <motion.div
                                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-28 h-28 mx-auto mb-8 text-amber-500"
                                >
                                    <TrophyIcon className="w-full h-full" aria-hidden />
                                </motion.div>
                                <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">Mission Passed!</h2>
                                <p className="text-gray-600 mb-8 text-lg">
                                    You successfully cleared all {dueCards.length} pending reviews.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowCelebration(false)}
                                    className="btn-primary w-full py-3 text-lg"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Review Cards */}
                {dueCards.length > 0 ? (
                    <AnimatePresence mode="wait">
                        <ReviewCard
                            key={dueCards[currentIndex].id}
                            card={dueCards[currentIndex]}
                            onReview={handleReview}
                            onSkip={handleSkip}
                        />
                    </AnimatePresence>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card rounded-3xl p-16 text-center max-w-2xl mx-auto"
                    >
                        <CheckCircleIcon className="w-24 h-24 text-emerald-500 mx-auto mb-6" aria-hidden />
                        <h2 className="text-3xl font-display font-bold text-gray-900 mb-4 tracking-tight">All Caught Up! 🎉</h2>
                        <p className="text-gray-600 mb-10 text-lg">
                            You&apos;ve cleared your inbox. Expand your knowledge by queuing up more questions.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/companies')}
                            className="btn-primary px-8 py-3.5 text-lg"
                        >
                            Browse Companies
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Live Algorithm Monitor */}
            <StatsMonitor />
        </div>
    );
}
