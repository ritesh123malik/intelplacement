// app/quiz/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QuizEngine from '@/components/quiz/QuizEngine';
import {
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function QuizPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [userProgress, setUserProgress] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
        loadData();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth/login');
            return;
        }
        setUserId(user.id);
    };

    const loadData = async () => {
        // Load categories
        const { data: cats } = await supabase
            .from('subject_categories')
            .select('*')
            .order('order_index');

        setCategories(cats || []);

        // Load user progress
        if (userId) {
            const { data: progress } = await supabase
                .from('user_subject_progress')
                .select('*')
                .eq('user_id', userId);

            setUserProgress(progress || []);
        }

        setLoading(false);
    };

    const getSubjectProgress = (subject: string) => {
        const prog = userProgress.find(p => p.subject === subject);
        return prog || { accuracy: 0, questions_attempted: 0 };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600" role="status" aria-label="Loading" />
            </div>
        );
    }

    if (selectedCategory && userId) {
        const category = categories.find(c => c.id === selectedCategory);
        return (
            <div className="min-h-screen bg-bg py-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                        ← Back to Categories
                    </button>
                    <QuizEngine
                        categoryId={selectedCategory}
                        subject={category?.name || ''}
                        userId={userId}
                        onComplete={() => {
                            setSelectedCategory(null);
                            loadData();
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg py-10">
            <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-8 tracking-tight">CS Fundamentals & Aptitude</h1>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card p-6">
                        <AcademicCapIcon className="w-8 h-8 text-primary-600 mb-2" aria-hidden />
                        <div className="text-2xl font-bold text-gray-900">{userProgress.reduce((sum, p) => sum + p.questions_attempted, 0)}</div>
                        <div className="text-sm text-gray-600">Questions Attempted</div>
                    </div>
                    <div className="card p-6">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-600 mb-2" aria-hidden />
                        <div className="text-2xl font-bold text-gray-900">{Math.round(userProgress.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(userProgress.length, 1))}%</div>
                        <div className="text-sm text-gray-600">Avg. Accuracy</div>
                    </div>
                    <div className="card p-6">
                        <ChartBarIcon className="w-8 h-8 text-primary-600 mb-2" aria-hidden />
                        <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                        <div className="text-sm text-gray-600">Subjects</div>
                    </div>
                    <div className="card p-6">
                        <ClockIcon className="w-8 h-8 text-amber-600 mb-2" aria-hidden />
                        <div className="text-2xl font-bold text-gray-900">2.5h</div>
                        <div className="text-sm text-gray-600">Time Spent</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => {
                        const progress = getSubjectProgress(category.name);
                        const Icon = getSubjectIcon(category.name);

                        return (
                            <button
                                type="button"
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className="card card-hover p-6 text-left w-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl" aria-hidden>{Icon}</span>
                                    {progress.questions_attempted > 0 && (
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                            {Math.round(progress.accuracy)}% Accuracy
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{progress.questions_attempted} questions attempted</span>
                                    <span className="text-primary-600 font-medium">Start Quiz →</span>
                                </div>
                                {progress.questions_attempted > 0 && (
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${progress.accuracy}%` }} />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function getSubjectIcon(subject: string): string {
    const icons: Record<string, string> = {
        'Operating Systems': '🖥️',
        'Database Management Systems': '🗄️',
        'Computer Networks': '🌐',
        'Object-Oriented Programming': '⚙️',
        'Quantitative Aptitude': '📊',
        'System Design': '🏗️'
    };
    return icons[subject] || '📚';
}
