'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { spacedRepetition } from '@/lib/spaced-repetition/service';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AddToReviewButtonProps {
    questionId: string;
    className?: string;
}

export default function AddToReviewButton({ questionId, className = '' }: AddToReviewButtonProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [message, setMessage] = useState('');

    const handleAdd = async () => {
        setLoading(true);
        setMessage('');

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setMessage('Please login to add to reviews');
            setLoading(false);
            return;
        }

        const result = await spacedRepetition.addCard(user.id, questionId);

        if (result.success) {
            setAdded(true);
            setMessage('Added to your review queue!');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage(result.message || 'Failed to add');
        }

        setLoading(false);
    };

    if (added) {
        return (
            <button
                disabled
                className={`inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg ${className}`}
            >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                In Review Queue
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={handleAdd}
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 ${className}`}
            >
                <SparklesIcon className="w-4 h-4 mr-2" />
                {loading ? 'Adding...' : 'Add to Spaced Repetition'}
            </button>
            {message && (
                <p className="text-sm text-gray-600 mt-2">{message}</p>
            )}
        </div>
    );
}
