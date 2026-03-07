'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import KanbanBoard from '@/components/applications/KanbanBoard';

export default function ApplicationsClient() {
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) router.push('/auth/login');
            else setUserId(user.id);
        });
    }, [router]);

    if (!userId) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return <KanbanBoard userId={userId} />;
}
