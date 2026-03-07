// components/quiz/QuizEngine.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_option: number;
    explanation: string;
    subject: string;
    difficulty: string;
    time_limit_seconds: number;
}

interface QuizEngineProps {
    categoryId: string;
    subject: string;
    userId: string;
    onComplete?: (score: number, total: number) => void;
}

export default function QuizEngine({ categoryId, subject, userId, onComplete }: QuizEngineProps) {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState<number[]>([]);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, [categoryId]);

    useEffect(() => {
        if (questions.length > 0 && !quizCompleted) {
            // Initialize timer for each question
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    const newTime = [...prev];
                    if (newTime[currentIndex] > 0) {
                        newTime[currentIndex] -= 1;
                    } else if (newTime[currentIndex] === 0) {
                        // Auto-move to next question when time runs out
                        handleNext();
                    }
                    return newTime;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [currentIndex, questions, quizCompleted]);

    const loadQuestions = async () => {
        const { data } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category_id', categoryId)
            .order('difficulty', { ascending: true });

        if (data) {
            setQuestions(data);
            setSelectedAnswers(new Array(data.length).fill(-1));
            setTimeLeft(data.map(q => q.time_limit_seconds));
        }
        setLoading(false);
    };

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentIndex] = optionIndex;
        setSelectedAnswers(newAnswers);

        // Check if answer is correct
        if (optionIndex === questions[currentIndex].correct_option) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowExplanation(false);
        } else {
            completeQuiz();
        }
    };

    const completeQuiz = async () => {
        setQuizCompleted(true);

        // Calculate final score
        const finalScore = selectedAnswers.reduce((acc, answer, idx) => {
            return acc + (answer === questions[idx]?.correct_option ? 1 : 0);
        }, 0);

        // Save attempt to database
        await supabase
            .from('quiz_attempts')
            .insert({
                user_id: userId,
                category_id: categoryId,
                score: finalScore,
                total_questions: questions.length,
                answers: selectedAnswers,
                completed_at: new Date().toISOString()
            });

        // Update user progress
        await updateUserProgress(finalScore, questions.length);

        onComplete?.(finalScore, questions.length);
    };

    const updateUserProgress = async (score: number, total: number) => {
        // Get current progress
        const { data: progress } = await supabase
            .from('user_subject_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('subject', subject)
            .single();

        const newCorrect = (progress?.correct_answers || 0) + score;
        const newAttempted = (progress?.questions_attempted || 0) + total;
        const newAccuracy = (newCorrect / newAttempted) * 100;

        await supabase
            .from('user_subject_progress')
            .upsert({
                user_id: userId,
                subject,
                questions_attempted: newAttempted,
                correct_answers: newCorrect,
                accuracy: newAccuracy,
                last_attempt: new Date().toISOString()
            });
    };

    if (loading) {
        return <div className="text-center py-12">Loading questions...</div>;
    }

    if (quizCompleted) {
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center text-black">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Quiz Complete! 🎉</h2>
                <p className="text-5xl font-bold text-indigo-600 mb-4">{percentage}%</p>
                <p className="text-gray-600 mb-6">
                    You scored {score} out of {questions.length}
                </p>

                <div className="max-w-md mx-auto">
                    <div className="bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        {percentage >= 80 ? 'Excellent! You\'re well prepared!' :
                            percentage >= 60 ? 'Good job! Keep practicing!' :
                                'Keep practicing! You\'ll get better!'}
                    </p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center text-black">
                <h2 className="text-3xl font-bold mb-2 opacity-50">No Questions Found</h2>
                <p>Could not locate any questions for this category.</p>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 text-black">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-end mb-4">
                <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className={`font-mono text-xl ${timeLeft[currentIndex] < 10 ? 'text-red-600' : 'text-gray-700'
                    }`}>
                    {Math.floor(timeLeft[currentIndex] / 60)}:{(timeLeft[currentIndex] % 60).toString().padStart(2, '0')}
                </span>
            </div>

            {/* Question */}
            <h3 className="text-xl font-bold mb-6">{currentQuestion.question}</h3>

            {/* Options */}
            <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition ${selectedAnswers[currentIndex] === idx
                                ? idx === currentQuestion.correct_option
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                            }`}
                        disabled={selectedAnswers[currentIndex] !== -1}
                    >
                        <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                    </button>
                ))}
            </div>

            {/* Explanation (shown after answering) */}
            {selectedAnswers[currentIndex] !== -1 && !showExplanation && (
                <button
                    onClick={() => setShowExplanation(true)}
                    className="w-full mb-4 text-indigo-600 hover:text-indigo-800 text-sm"
                >
                    Show Explanation
                </button>
            )}

            {showExplanation && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
                    <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                </div>
            )}

            {/* Next Button */}
            <button
                onClick={handleNext}
                disabled={selectedAnswers[currentIndex] === -1}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {currentIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
            </button>
        </div>
    );
}
