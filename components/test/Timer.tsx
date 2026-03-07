'use client';

import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface TimerProps {
    duration: number; // minutes
    onExpire: () => void;
}

export default function Timer({ duration, onExpire }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isWarning = timeLeft < 300; // Less than 5 mins

    return (
        <div className={`flex items-center space-x-2 font-mono text-xl font-bold px-4 py-2 bg-[#12121A] rounded-xl border-2 transition-colors ${isWarning ? 'text-red-500 animate-pulse border-red-500/50 bg-red-500/10/10' : 'text-gray-100 border-[#2E2E42]'
            }`}>
            <ClockIcon className="w-5 h-5 text-indigo-400" />
            <span>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
