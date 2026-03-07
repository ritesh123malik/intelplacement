// app/api/resume/route.ts

import { analyzeResume } from '@/lib/ai-service';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Pro check
    const { data: sub } = await supabase
      .from('subscriptions').select('plan, status').eq('user_id', user.id).single();
    const isPro = sub?.plan !== 'free' && sub?.status === 'active';

    // Rate limit free users: max 1 resume per day
    if (!isPro) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from('resumes')
        .select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', oneDayAgo);
      if ((count || 0) >= 1) {
        return Response.json({ error: 'Free plan: 1 resume analysis per day. Upgrade to Pro for unlimited.' }, { status: 429 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

    // Parse PDF text
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(buffer);
    const resumeText = parsed.text.slice(0, 4000); // trim for token limits

    if (!resumeText.trim()) {
      return Response.json({ error: 'Could not extract text from PDF. Try a text-based PDF.' }, { status: 400 });
    }

    // AI analysis
    const content = await analyzeResume(resumeText);

    let result;
    try {
      result = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      return Response.json({ error: 'AI returned invalid response. Please try again.' }, { status: 500 });
    }

    // Save to database
    await supabaseAdmin.from('resumes').insert({
      user_id: user.id,
      file_name: file.name,
      score: result.score,
      analysis: result.summary,
      strengths: result.strengths,
      improvements: result.improvements,
      missing_keywords: result.missing_keywords,
    });

    return Response.json({ result });
  } catch (err: any) {
    console.error('Resume API error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
