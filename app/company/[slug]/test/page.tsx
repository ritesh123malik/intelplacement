'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { testGenerator } from '@/lib/tests/generator';
import TestInterface from '@/components/test/TestInterface';
import TestResults from '@/components/test/TestResults';
import {
    ClockIcon,
    DocumentTextIcon,
    ChartBarIcon,
    ArrowPathIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';

export default function CompanyTestPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [company, setCompany] = useState<any>(null);
    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [testCompleted, setTestCompleted] = useState(false);
    const [testScore, setTestScore] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [duration, setDuration] = useState(45);
    const [difficulty, setDifficulty] = useState('mixed');

    useEffect(() => {
        fetchCompany();
    }, [slug]);

    const fetchCompany = async () => {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('slug', slug)
            .single();

        if (data) {
            setCompany(data);
            // Auto-generate a test when company loads
            generateNewTest(data.id, data.name);
        } else {
            setLoading(false);
        }
    };

    const generateNewTest = async (companyId?: string, companyName?: string) => {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log('Current user:', user?.email, 'Auth error:', authError);

        if (!user) {
            console.error('User not authenticated');
            router.push('/auth/login');
            return;
        }

        const targetCompanyId = companyId || company?.id;
        const targetCompanyName = companyName || company?.name;

        if (!targetCompanyId || !targetCompanyName) return;

        setGenerating(true);
        const newTest = await testGenerator.generateCompanyTest(
            targetCompanyId,
            targetCompanyName,
            duration,
            difficulty
        );

        if (newTest) {
            setTest(newTest);
        }
        setGenerating(false);
        setLoading(false);
    };

    const handleStartTest = () => {
        setTestStarted(true);
    };

    const handleTestComplete = (score: number) => {
        setTestScore(score);
        setTestCompleted(true);
        setTestStarted(false);
        setTimeSpent(Math.floor((Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000)); // This will be replaced with actual time
    };

    const handleRetry = () => {
        setTestCompleted(false);
        setTest(null);
        generateNewTest();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `My ${company?.name} Assessment Score`,
                text: `I scored ${testScore}% on the ${company?.name} practice test!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Company not found</h1>
                    <Link href="/companies" className="text-indigo-600 hover:text-indigo-800">
                        ← Back to Companies
                    </Link>
                </div>
            </div>
        );
    }

    // Show test results if completed
    if (testCompleted) {
        return (
            <TestResults
                score={testScore}
                timeSpent={timeSpent}
                completedCount={test?.questions?.filter((q: any) => q.completed)?.length || 0}
                totalQuestions={test?.questions?.length || 0}
                company={company.name}
                onRetry={handleRetry}
                onShare={handleShare}
            />
        );
    }

    // Show test interface if started
    if (testStarted && test) {
        return (
            <TestInterface
                testId={test.id}
                company={company.name}
                duration={test.duration}
                questions={test.questions}
                onComplete={handleTestComplete}
                onExit={() => setTestStarted(false)}
            />
        );
    }

    // Show test configuration page
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href={`/company/${slug}`}
                        className="inline-flex items-center text-gray-600 hover:text-indigo-600"
                    >
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Back to {company.name} Questions
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                            {company.name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{company.name} Assessment</h1>
                            <p className="text-gray-600">Practice with real interview questions under timed conditions</p>
                        </div>
                    </div>

                    {/* Test Configuration */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="30">30 minutes (Quick)</option>
                                <option value="45">45 minutes (Standard)</option>
                                <option value="60">60 minutes (Extended)</option>
                                <option value="90">90 minutes (Deep Dive)</option>
                            </select>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty
                            </label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="mixed">Mixed (Realistic)</option>
                                <option value="Easy">Easy (Warm-up)</option>
                                <option value="Medium">Medium (Standard)</option>
                                <option value="Hard">Hard (Challenge)</option>
                            </select>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Questions
                            </label>
                            <div className="p-2 bg-white border border-gray-300 rounded-lg text-gray-900">
                                {test?.questions?.length || '~3-4'} problems
                            </div>
                        </div>
                    </div>

                    {/* Generate/Regenerate Button */}
                    <button
                        onClick={() => generateNewTest()}
                        disabled={generating}
                        className="w-full mb-6 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center space-x-2"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                        <span>{generating ? 'Generating...' : 'Generate New Test Set'}</span>
                    </button>

                    {/* Test Preview */}
                    {test && (
                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Test Preview</h2>
                            <div className="space-y-3 mb-6">
                                {test.questions.map((q: any, index: number) => (
                                    <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-900">{q.title}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                        q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {q.difficulty}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{q.points} points</span>
                                                    <span className="text-xs text-gray-500">⏱️ {q.time_estimate} min</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={q.leetcode_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                                        >
                                            View →
                                        </a>
                                    </div>
                                ))}
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={handleStartTest}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition transform hover:scale-[1.02]"
                            >
                                Start {duration}-Minute Assessment
                            </button>

                            <p className="text-center text-sm text-gray-500 mt-4">
                                ⏱️ Timer starts when you click Start. Make sure you have {duration} minutes of uninterrupted time.
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <ClockIcon className="w-8 h-8 text-indigo-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Timed Practice</h3>
                        <p className="text-sm text-gray-600">
                            Simulates real interview pressure with a countdown timer
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <DocumentTextIcon className="w-8 h-8 text-indigo-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Real Questions</h3>
                        <p className="text-sm text-gray-600">
                            Questions sourced from actual {company.name} interviews
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <ChartBarIcon className="w-8 h-8 text-indigo-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Performance Analysis</h3>
                        <p className="text-sm text-gray-600">
                            Get detailed score and improvement suggestions
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
