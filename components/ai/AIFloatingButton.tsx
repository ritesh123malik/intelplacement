'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AIAssistant from '@/components/ai/AIAssistant';

interface AIFloatingButtonProps {
    selectedProblem?: string;
}

export default function AIFloatingButton({ selectedProblem }: AIFloatingButtonProps) {
    const [showAI, setShowAI] = useState(false);

    return (
        <>
            {/* AI Assistant Button */}
            {!showAI && (
                <button
                    onClick={() => setShowAI(true)}
                    className="fixed bottom-6 right-6 z-40 btn-primary p-4 rounded-full shadow-glow hover:-translate-y-1 transition-all duration-300 group"
                    aria-label="Ask AI Tutor"
                >
                    <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                </button>
            )}

            {/* AI Assistant Modal */}
            {showAI && (
                <AIAssistant
                    problem={selectedProblem || "Ask anything about coding problems..."}
                    onClose={() => setShowAI(false)}
                />
            )}
        </>
    );
}
