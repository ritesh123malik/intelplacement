// app/companies/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    ClockIcon,
    ChartBarIcon,
    ArrowTopRightOnSquareIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';

export default function CompanyPage() {
    const { slug } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, [slug]);

    const loadData = async () => {
        // Load company
        const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('slug', slug)
            .single();

        setCompany(companyData);

        // Load questions
        if (companyData) {
            const { data: questionsData } = await supabase
                .from('questions')
                .select('*')
                .eq('company_id', companyData.id)
                .order('frequency', { ascending: false });

            setQuestions(questionsData || []);
        }

        setLoading(false);
    };

    const filteredQuestions = questions.filter(q =>
        selectedDifficulty === 'all' ? true : q.difficulty === selectedDifficulty
    );

    const difficulties = ['all', 'Easy', 'Medium', 'Hard'];
    const difficultyCounts = {
        all: questions.length,
        Easy: questions.filter(q => q.difficulty === 'Easy').length,
        Medium: questions.filter(q => q.difficulty === 'Medium').length,
        Hard: questions.filter(q => q.difficulty === 'Hard').length
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

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link
                        href="/companies"
                        className="inline-flex items-center text-gray-600 hover:text-indigo-600"
                    >
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Back to Companies
                    </Link>
                </div>

                {/* Company Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex items-start space-x-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                            {company.name[0]}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
                            {company.description && (
                                <p className="text-gray-600 mb-4">{company.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm">
                                {company.industry && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                        {company.industry}
                                    </span>
                                )}
                                {company.hq && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                        📍 {company.hq}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Filter by:</span>
                            <div className="flex space-x-2">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() => setSelectedDifficulty(diff)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedDifficulty === diff
                                                ? diff === 'all'
                                                    ? 'bg-gray-900 text-white'
                                                    : diff === 'Easy'
                                                        ? 'bg-green-600 text-white'
                                                        : diff === 'Medium'
                                                            ? 'bg-yellow-600 text-white'
                                                            : 'bg-red-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {diff} {diff !== 'all' && `(${difficultyCounts[diff as keyof typeof difficultyCounts]})`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            {filteredQuestions.length} questions
                        </p>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                    {filteredQuestions.map((question) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-200"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {question.question}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full font-medium ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {question.difficulty}
                                        </span>
                                        {question.frequency && (
                                            <span className="flex items-center text-gray-500">
                                                <ChartBarIcon className="w-4 h-4 mr-1" />
                                                {question.frequency}% frequency
                                            </span>
                                        )}
                                        {question.year_reported && (
                                            <span className="flex items-center text-gray-500">
                                                <ClockIcon className="w-4 h-4 mr-1" />
                                                {question.year_reported}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {question.source_url && (
                                    <a
                                        href={question.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredQuestions.length === 0 && (
                        <div className="bg-white rounded-xl p-12 text-center">
                            <p className="text-gray-500">No questions found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
