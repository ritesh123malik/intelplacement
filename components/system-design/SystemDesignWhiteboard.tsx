// components/system-design/SystemDesignWhiteboard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Tldraw, getSnapshot, loadSnapshot } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { supabase } from '@/lib/supabase';
import { groqAI } from '@/lib/groq';
import {
    CloudArrowUpIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon,
    ArrowPathIcon,
    ShareIcon
} from '@heroicons/react/24/outline';

interface SystemDesignWhiteboardProps {
    designId?: string;
    userId: string;
    onSave?: (id: string) => void;
}

export default function SystemDesignWhiteboard({ designId, userId, onSave }: SystemDesignWhiteboardProps) {
    const [editor, setEditor] = useState<any>(null);
    const [title, setTitle] = useState('Untitled Design');
    const [description, setDescription] = useState('');
    const [problem, setProblem] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<any>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sharePublic, setSharePublic] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (designId) {
            loadDesign();
        }
    }, [designId]);

    const loadDesign = async () => {
        const { data, error } = await supabase
            .from('system_designs')
            .select('*')
            .eq('id', designId)
            .single();

        if (data) {
            setTitle(data.title);
            setDescription(data.description || '');
            setProblem(data.problem_statement || '');
            setSharePublic(data.is_public || false);
            if (data.ai_feedback) {
                setAiFeedback(data.ai_feedback);
            }
            // Load diagram data into editor
            if (editor && data.diagram_data) {
                try {
                    // Preferred API in current tldraw versions
                    loadSnapshot(editor.store, data.diagram_data);
                } catch {
                    // Fallback for older/editor-wrapped APIs
                    editor.loadSnapshot?.(data.diagram_data);
                }
            }
        }
    };

    const handleSave = async () => {
        if (!editor) return;
        setSaving(true);

        // Get current diagram state
        const snapshot = (() => {
            try {
                return getSnapshot(editor.store);
            } catch {
                return editor.getSnapshot?.();
            }
        })();

        // Generate image from canvas (you'd need to implement this)
        const imageData = await captureCanvas();

        const designData = {
            user_id: userId,
            title,
            description,
            problem_statement: problem,
            diagram_data: snapshot,
            image_url: imageData,
            is_public: sharePublic,
            updated_at: new Date().toISOString()
        };

        let result;
        if (designId) {
            result = await supabase
                .from('system_designs')
                .update(designData)
                .eq('id', designId)
                .select();
        } else {
            result = await supabase
                .from('system_designs')
                .insert(designData)
                .select();
        }

        if (result.data) {
            const newId = result.data[0].id;
            if (!designId) onSave?.(newId);

            // Award points for creating design
            await awardPoints('design_created');
        }

        setSaving(false);
    };

    const captureCanvas = async (): Promise<string> => {
        // In production, you'd use html2canvas or similar
        // For now, return empty string
        return '';
    };

    const requestAIFeedback = async () => {
        if (!editor || !problem) {
            alert('Please describe the problem first');
            return;
        }

        setLoading(true);
        setShowFeedback(true);

        try {
            // Get a stable snapshot of shapes from the store
            const snapshot = getSnapshot(editor.store);
            const shapes = Object.values((snapshot as any)?.document?.pages?.[0]?.shapes || {});
            const componentTypes = shapes
                .map((shape: any) => shape.type)
                .filter((type: string, idx: number, arr: string[]) => arr.indexOf(type) === idx);
            const components = componentTypes.join(', ') || 'No components drawn yet';

            const prompt = `You are a system design expert. Review this architecture for: ${problem}

Components in diagram: ${components}

Provide feedback on:
1. Single points of failure
2. Database choices and scalability
3. Caching strategy
4. Load balancing approach
5. Potential bottlenecks
6. Security considerations

Format your response in markdown with clear sections.`;

            const response = await groqAI.generateContent(prompt);

            const feedback = {
                review: response,
                timestamp: new Date().toISOString(),
                components
            };

            setAiFeedback(feedback);

            // Save feedback to database
            if (designId) {
                await supabase
                    .from('system_designs')
                    .update({ ai_feedback: feedback })
                    .eq('id', designId);
            }
        } catch (error) {
            console.error('AI Feedback error:', error);
        } finally {
            setLoading(false);
        }
    };

    const awardPoints = async (activity: string) => {
        await supabase.rpc('award_activity_points', {
            p_user_id: userId,
            p_activity: activity
        });
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                        placeholder="Design Title"
                    />
                    <input
                        type="text"
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        className="flex-1 text-gray-600 bg-gray-100 border-none rounded-lg px-3 py-2 text-sm"
                        placeholder="Describe the system design problem (e.g., Design Twitter)"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={sharePublic}
                            onChange={(e) => setSharePublic(e.target.checked)}
                            className="rounded text-indigo-600"
                        />
                        <span>Share Public</span>
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                    >
                        <CloudArrowUpIcon className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>

                    <button
                        onClick={requestAIFeedback}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center space-x-2"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span>{loading ? 'Analyzing...' : 'AI Review'}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Main Whiteboard */}
                <div className={`flex-1 ${showFeedback ? 'w-2/3' : 'w-full'}`} ref={canvasRef}>
                    <Tldraw
                        onMount={(editor) => setEditor(editor)}
                        persistenceKey="system-design"
                    />
                </div>

                {/* AI Feedback Panel */}
                {showFeedback && (
                    <div className="w-1/3 bg-white border-l overflow-y-auto">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold flex items-center">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-purple-600" />
                                AI Architecture Review
                            </h3>
                            <button
                                onClick={() => setShowFeedback(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Analyzing your architecture...</p>
                                </div>
                            ) : aiFeedback ? (
                                <div className="prose prose-sm max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: aiFeedback.review }} />

                                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                                        <h4 className="font-semibold text-yellow-800 mb-2">Implementation Tips</h4>
                                        <ul className="text-sm text-yellow-700 space-y-1">
                                            <li>• Use Redis for caching frequently accessed data</li>
                                            <li>• Implement database sharding for scalability</li>
                                            <li>• Add CDN for static content delivery</li>
                                            <li>• Consider message queues for async processing</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Click "AI Review" to get feedback on your architecture</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
