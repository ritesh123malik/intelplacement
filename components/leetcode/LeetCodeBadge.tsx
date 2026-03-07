'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

interface LeetCodeBadgeProps {
    userId: string;
}

export default function LeetCodeBadge({ userId }: LeetCodeBadgeProps) {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchLeetCodeProfile();
    }, [userId]);

    const fetchLeetCodeProfile = async () => {
        const { data, error } = await supabase
            .from('leetcode_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (data && data.display_on_profile) {
            setProfile(data);
        }
    };

    if (!profile) return null;

    return (
        <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full text-sm">
            <AcademicCapIcon className="w-4 h-4 mr-1" />
            <span>LeetCode: {profile.total_solved} solved</span>
        </div>
    );
}
