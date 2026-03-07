'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    SparklesIcon,
    FireIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { REVIEW_RATINGS, DueCard } from '@/lib/spaced-repetition/service';
import { supabase } from '@/lib/supabase';
import { statsService } from '@/lib/stats-service';

interface ReviewCardProps {
    card: DueCard;
    onReview: (rating: number, updatedStats?: any) => Promise<void>;
    onSkip?: () => void;
}

export default function ReviewCard({ card, onReview, onSkip }: ReviewCardProps) {
    const [showAnswer, setShowAnswer] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(Date.now());
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const handleReveal = () => {
        setShowAnswer(true);
    };

    const handleReview = async (rating: number) => {
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to submit reviews');
                return;
            }

            const result = await statsService.submitReview(
                user.id,
                card.id,
                card.question_id,
                rating
            );

            if (result.success) {
                // Pass the updated stats back to parent
                await onReview(rating, result.stats);
            } else {
                alert('Error submitting review: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
            setShowAnswer(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-700 border-green-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
        >
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {timeElapsed}s
                    </span>
                    <span className="flex items-center text-gray-600">
                        <FireIcon className="w-4 h-4 mr-1 text-orange-500" />
                        Stage {card.stage}
                    </span>
                    <span className="flex items-center text-gray-600">
                        <ArrowPathIcon className="w-4 h-4 mr-1" />
                        {card.review_count} reviews
                    </span>
                </div>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        Skip for now
                    </button>
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm opacity-90">{card.company}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(card.difficulty)}`}>
                            {card.difficulty}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold">Question {card.review_count + 1}</h3>
                </div>

                {/* Question */}
                <div className="p-8">
                    <p className="text-lg text-gray-800 mb-6">{card.question}</p>

                    {!showAnswer ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReveal}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg flex items-center justify-center space-x-2"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>Reveal Answer</span>
                        </motion.button>
                    ) : (
                        <>
                            {/* Answer Section */}
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-8"
                            >
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-3">Solution Approach:</h4>
                                    <p className="text-gray-700 mb-4">
                                        {/* You can fetch the actual solution from your database */}
                                        This is where the solution explanation would appear.
                                        Consider linking to LeetCode for the full solution.
                                    </p>
                                    <a
                                        href={card.leetcode_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                                    >
                                        View on LeetCode →
                                    </a>
                                </div>
                            </motion.div>

                            {/* Rating Buttons */}
                            <div className="space-y-4">
                                <p className="text-center text-gray-600 font-medium">
                                    How well did you remember this?
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {REVIEW_RATINGS.map((rating) => (
                                        <motion.button
                                            key={rating.value}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={submitting}
                                            onClick={() => handleReview(rating.value)}
                                            className={`
                        p-4 rounded-xl border-2 transition-all
                        ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
                        ${rating.value === 0 ? 'hover:border-red-500 hover:bg-red-50' : ''}
                        ${rating.value === 1 ? 'hover:border-orange-500 hover:bg-orange-50' : ''}
                        ${rating.value === 2 ? 'hover:border-green-500 hover:bg-green-50' : ''}
                        ${rating.value === 3 ? 'hover:border-blue-500 hover:bg-blue-50' : ''}
                      `}
                                        >
                                            <div className="text-2xl mb-1">{rating.icon}</div>
                                            <div className="font-bold text-gray-800">{rating.label}</div>
                                            <div className="text-xs text-gray-500 mt-1">{rating.description}</div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Stats */}
                {card.last_reviewed_at && (
                    <div className="bg-gray-50 px-8 py-4 border-t text-sm text-gray-600">
                        Last reviewed: {new Date(card.last_reviewed_at).toLocaleDateString()}
                        {card.lapses > 0 && (
                            <span className="ml-4 text-orange-600">
                                ⚠️ Forgotten {card.lapses} times
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
