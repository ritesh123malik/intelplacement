// app/api/bookmark/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { questionId, companyId, action } = await req.json();

  if (action === 'add') {
    await supabase.from('bookmarks').upsert({ user_id: user.id, question_id: questionId });
    // Update progress counter
    await supabase.rpc('increment_bookmarks', { p_user_id: user.id, p_company_id: companyId });
  } else {
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', questionId);
  }

  return Response.json({ success: true });
}
