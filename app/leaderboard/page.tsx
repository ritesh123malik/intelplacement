// app/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Leaderboard from '@/components/leaderboard/Leaderboard';

export default function LeaderboardPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth/login');
            return;
        }
        setUserId(user.id);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600" role="status" aria-label="Loading" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg py-10">
            <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-8 tracking-tight">Leaderboard & Activity</h1>
                <Leaderboard userId={userId!} />
            </div>
        </div>
    );
}
