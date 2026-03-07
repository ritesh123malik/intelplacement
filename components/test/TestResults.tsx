'use client';

import {
    ChartBarIcon,
    ArrowPathIcon,
    ShareIcon,
    TrophyIcon,
    ClockIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface TestResultsProps {
    score: number;
    timeSpent: number;
    completedCount: number;
    totalQuestions: number;
    company: string;
    onRetry: () => void;
    onShare: () => void;
}

export default function TestResults({
    score,
    timeSpent,
    completedCount,
    totalQuestions,
    company,
    onRetry,
    onShare
}: TestResultsProps) {

    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    const isPassing = score >= 70;

    return (
        <div className="min-h-screen bg-[#0A0A0F] py-12 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#12121A] border-2 border-[#2E2E42] mb-6">
                        {isPassing ? (
                            <TrophyIcon className="w-10 h-10 text-yellow-400" />
                        ) : (
                            <ChartBarIcon className="w-10 h-10 text-indigo-400" />
                        )}
                    </div>
                    <h1 className="text-4xl font-bold font-display text-white mb-2">Assessment Complete</h1>
                    <p className="text-gray-400">You've finished the {company} practice test.</p>
                </div>

                <div className="bg-[#12121A] border border-[#2E2E42] rounded-3xl p-8 mb-8 shadow-xl">
                    <div className="flex flex-col items-center justify-center border-b border-[#2E2E42] pb-8 mb-8">
                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Total Score</span>
                        <div className="flex items-baseline">
                            <span className={`text-6xl font-black font-display tracking-tight ${isPassing ? 'text-green-400' : 'text-indigo-400'}`}>
                                {score}%
                            </span>
                        </div>
                        <p className={`mt-3 text-sm font-medium px-4 py-1 rounded-full ${isPassing ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#2E2E42] text-gray-300'}`}>
                            {isPassing ? 'Excellent Performance! Ready for the interview.' : 'Keep practicing, you are getting there!'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-[#0A0A0F] rounded-2xl p-6 border border-[#2E2E42] flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                <CheckBadgeIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Completion</p>
                                <p className="text-xl font-bold text-white"><span className={completedCount === totalQuestions ? 'text-green-400' : 'text-indigo-400'}>{completedCount}</span> <span className="text-gray-500 text-lg">/ {totalQuestions}</span></p>
                            </div>
                        </div>

                        <div className="bg-[#0A0A0F] rounded-2xl p-6 border border-[#2E2E42] flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                <ClockIcon className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Time Elapsed</p>
                                <p className="text-xl font-bold text-white">{minutes}m {seconds}s</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                        <button
                            onClick={onRetry}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition"
                        >
                            <ArrowPathIcon className="w-5 h-5 mr-2" />
                            Try Another Test
                        </button>

                        <button
                            onClick={onShare}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-[#2E2E42] hover:bg-[#3E3E52] text-white rounded-xl font-semibold transition"
                        >
                            <ShareIcon className="w-5 h-5 mr-2" />
                            Share Result
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/companies" className="text-gray-500 hover:text-white transition text-sm">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
