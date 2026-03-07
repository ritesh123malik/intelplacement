import { NextRequest, NextResponse } from 'next/server';
import {
    getAIResponse,
    explainProblem,
    generateSolutionApproach,
    getHint,
    debugCode
} from '@/lib/ai-service';

export async function POST(req: NextRequest) {
    try {
        const { action, problem, difficulty, code, language } = await req.json();

        // Get user ID from session (you have this from your auth setup)
        const userId = req.headers.get('x-user-id') || 'anonymous';

        let result = '';

        switch (action) {
            case 'explain':
                result = await explainProblem(problem, difficulty || 'Medium');  // Changed here
                break;
            case 'approach':
                result = await generateSolutionApproach(problem, userId);
                break;
            case 'hint':
                result = await getHint(problem, userId);
                break;
            case 'debug':
                result = await debugCode(code, language || 'javascript', userId);
                break;
            default:
                result = await getAIResponse(problem, userId, "You're a LeetCode expert.");
        }

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get AI response' },
            { status: 500 }
        );
    }
}
