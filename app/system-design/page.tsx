'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SystemDesignWhiteboard from '@/components/system-design/SystemDesignWhiteboard';
import {
    PlusIcon,
    DocumentDuplicateIcon,
    ChartBarIcon,
    ClockIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

export default function SystemDesignPage() {
    const [designs, setDesigns] = useState<any[]>([]);
    const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
        loadDesigns();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth/login');
            return;
        }
        setUserId(user.id);
    };

    const loadDesigns = async () => {
        const { data } = await supabase
            .from('system_designs')
            .select('*')
            .order('created_at', { ascending: false });

        setDesigns(data || []);
        setLoading(false);
    };

    const createNewDesign = async () => {
        if (!userId) return;

        const { data, error } = await supabase
            .from('system_designs')
            .insert({
                user_id: userId,
                title: 'New Design',
                description: '',
                problem_statement: ''
            })
            .select()
            .single();

        if (data) {
            setSelectedDesign(data.id);
            loadDesigns();
        }
    };

    const problems = [
        { title: 'Design Twitter', difficulty: 'Hard', time: '45 min' },
        { title: 'Design URL Shortener', difficulty: 'Medium', time: '30 min' },
        { title: 'Design WhatsApp', difficulty: 'Hard', time: '60 min' },
        { title: 'Design Netflix', difficulty: 'Hard', time: '60 min' },
        { title: 'Design Uber', difficulty: 'Hard', time: '45 min' },
        { title: 'Design Dropbox', difficulty: 'Medium', time: '30 min' },
    ];

    if (selectedDesign) {
        return (
            <SystemDesignWhiteboard
                designId={selectedDesign}
                userId={userId!}
                onSave={() => setSelectedDesign(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-bg py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Design Practice</h1>
                        <p className="text-gray-600 mt-1">Design scalable systems and get AI-powered feedback</p>
                    </div>
                    <button
                        onClick={createNewDesign}
                        className="btn-primary rounded-xl flex items-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        New Design
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="card p-6">
                        <DocumentDuplicateIcon className="w-8 h-8 text-indigo-600 mb-2" />
                        <div className="text-2xl font-bold">{designs.length}</div>
                        <div className="text-sm text-gray-600">Total Designs</div>
                    </div>
                    <div className="card p-6">
                        <ChartBarIcon className="w-8 h-8 text-green-600 mb-2" />
                        <div className="text-2xl font-bold">
                            {designs.filter(d => d.ai_feedback).length}
                        </div>
                        <div className="text-sm text-gray-600">AI Reviews</div>
                    </div>
                    <div className="card p-6">
                        <UserGroupIcon className="w-8 h-8 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-sm text-gray-600">Peer Reviews</div>
                    </div>
                    <div className="card p-6">
                        <ClockIcon className="w-8 h-8 text-orange-600 mb-2" />
                        <div className="text-2xl font-bold">3.5h</div>
                        <div className="text-sm text-gray-600">Practice Time</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* My Designs */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">My Designs</h2>
                        <div className="space-y-3">
                            {designs.map((design) => (
                                <div
                                    key={design.id}
                                    onClick={() => setSelectedDesign(design.id)}
                                    className="card card-hover p-4 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg">{design.title}</h3>
                                        {design.ai_feedback && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                AI Reviewed
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{design.problem_statement}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Created: {new Date(design.created_at).toLocaleDateString()}</span>
                                        {design.is_public && <span>🌍 Public</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Practice Problems */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">Practice Problems</h2>
                        <div className="card p-4">
                            <div className="space-y-3">
                                {problems.map((problem, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 border border-border rounded-lg hover:bg-surface-dark cursor-pointer transition-colors"
                                    >
                                        <h3 className="font-medium mb-1">{problem.title}</h3>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className={`px-2 py-1 rounded-full ${problem.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {problem.difficulty}
                                            </span>
                                            <span className="text-gray-500">{problem.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
