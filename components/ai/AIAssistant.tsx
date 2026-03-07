'use client';

import { useState } from 'react';
import { Bot, Loader2, X, Sparkles } from 'lucide-react';

interface AIAssistantProps {
    problem?: string;
    onClose?: () => void;
}

export default function AIAssistant({ problem, onClose }: AIAssistantProps) {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'explain' | 'hint' | 'approach'>('explain');

    const handleAskAI = async () => {
        if (!prompt && !problem) return;

        setLoading(true);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: mode,
                    problem: prompt || problem,
                    difficulty: 'Medium'
                }),
            });

            const data = await res.json();
            if (data.success) {
                setResponse(data.result);
            } else {
                setResponse('Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            setResponse('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-6 w-96 bg-surface rounded-2xl shadow-xl border border-border-strong overflow-hidden z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-accent-purple text-white">
                <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5" />
                    <span className="font-display font-bold">AI Tutor</span>
                    <Sparkles className="w-4 h-4 ml-1 text-amber-300" />
                </div>
                {onClose && (
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Mode Selector */}
            <div className="flex p-2 border-b border-border bg-surface-dark">
                {[
                    { id: 'explain', label: 'Explain' },
                    { id: 'hint', label: 'Hint' },
                    { id: 'approach', label: 'Approach' }
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === m.id
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-border'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={problem || "Ask anything about coding problems..."}
                    className="w-full p-3 border border-border-strong rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-bg text-text-primary placeholder:text-text-muted resize-none"
                    rows={3}
                />

                <button
                    onClick={handleAskAI}
                    disabled={loading || (!prompt && !problem)}
                    className="mt-3 w-full btn-primary py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        'Ask AI'
                    )}
                </button>
            </div>

            {/* Response Area */}
            {response && (
                <div className="p-5 border-t border-border bg-surface-dark max-h-60 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                        <div className="font-bold text-text-primary mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary-600" />
                            Response
                        </div>
                        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed text-sm">
                            {response}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
