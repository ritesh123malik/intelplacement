import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
  try {
    const { company, role, experience, duration } = await req.json();

    if (!company || !role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      );
    }

    console.log('Generating roadmap for:', { company, role, experience, duration });

    const roadmap = await generateRoadmap(company, role, experience, duration);

    return NextResponse.json({ roadmap });

  } catch (error: any) {
    console.error('Roadmap API error:', error);

    // More specific error message
    const errorMessage = error.message?.includes('model')
      ? 'AI model temporarily unavailable. Please try again.'
      : 'Failed to generate roadmap. Please try again.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}