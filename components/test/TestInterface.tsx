'use client';

import { useState } from 'react';
import Timer from './Timer';
import {
    XMarkIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    CheckCircleIcon,
    PlayIcon
} from '@heroicons/react/24/outline';

interface TestInterfaceProps {
    testId: string;
    company: string;
    duration: number;
    questions: any[];
    onComplete: (score: number) => void;
    onExit: () => void;
}

export default function TestInterface({ testId, company, duration, questions, onComplete, onExit }: TestInterfaceProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});

    const question = questions[currentIndex];

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const toggleComplete = (id: string) => {
        const isCompleted = !answers[id];
        setAnswers({ ...answers, [id]: isCompleted });

        // Also mark the original question array so results count correctly
        const qIndex = questions.findIndex(q => q.id === id);
        if (qIndex > -1) {
            questions[qIndex].completed = isCompleted;
        }
    };

    const handleSubmit = () => {
        // calculate a mock score based on marked questions and points
        let earned = 0;
        let total = 0;
        questions.forEach(q => {
            total += (q.points || 10);
            if (answers[q.id]) {
                earned += (q.points || 10);
            }
        });

        const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
        onComplete(percentage);
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
                    <p className="text-gray-600 mb-6">No questions available for this test.</p>
                    <button onClick={onExit} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0F] text-gray-100 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-[#2E2E42] px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={onExit} className="p-2 hover:bg-[#2E2E42] rounded-lg transition-colors text-gray-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-display text-white">{company} Assessment</h1>
                        <p className="text-sm text-gray-400">Question {currentIndex + 1} of {questions.length}</p>
                    </div>
                </div>
                <Timer duration={duration} onExpire={handleSubmit} />
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-5xl mx-auto w-full p-6 flex flex-col md:flex-row gap-6">

                {/* Sidebar Pagination */}
                <div className="md:w-64 flex-shrink-0">
                    <div className="bg-[#12121A] border border-[#2E2E42] rounded-xl p-4 sticky top-24">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Questions</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id || idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`
                    w-12 h-12 flex items-center justify-center rounded-lg font-medium text-sm transition-all
                    ${currentIndex === idx ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#12121A]' :
                                            answers[q.id] ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                'bg-[#1A1A24] text-gray-400 hover:bg-[#2E2E42] border border-[#2E2E42]'}
                  `}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#2E2E42]">
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition"
                            >
                                Submit Test
                            </button>
                        </div>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 min-w-0">
                    <div className="bg-[#12121A] border border-[#2E2E42] rounded-2xl p-8 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white break-words">{question.title}</h2>
                            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ml-4 shrink-0 ${question.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    question.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {question.difficulty}
                            </span>
                        </div>

                        <div className="flex space-x-4 mb-8 text-sm text-gray-400">
                            <span className="bg-[#1A1A24] px-3 py-1 rounded-md">{question.points || 10} Points</span>
                            <span className="bg-[#1A1A24] px-3 py-1 rounded-md">Expected Time: {question.time_estimate || 20} min</span>
                        </div>

                        <div className="prose prose-invert max-w-none text-gray-300 mb-8 whitespace-pre-wrap">
                            Review the problem statement on LeetCode and write your optimal solution locally or directly in their editor. Once completed to your satisfaction, mark this question as solved below!
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-[#2E2E42]">
                            <a
                                href={question.leetcode_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-[#2E2E42] hover:bg-[#3E3E52] text-white rounded-xl transition"
                            >
                                <PlayIcon className="w-5 h-5" />
                                <span>Solve on LeetCode</span>
                            </a>

                            <button
                                onClick={() => toggleComplete(question.id)}
                                className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition font-medium
                  ${answers[question.id]
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-transparent border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10'}`}
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>{answers[question.id] ? 'Completed!' : 'Mark as Completed'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="flex items-center px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition"
                        >
                            <ChevronLeftIcon className="w-5 h-5 mr-1" />
                            Previous
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
                            >
                                Finish Test
                                <CheckCircleIcon className="w-5 h-5 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center px-6 py-2 bg-[#2E2E42] hover:bg-[#3E3E52] text-white rounded-xl transition"
                            >
                                Next
                                <ChevronRightIcon className="w-5 h-5 ml-1" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
