// middleware.ts — Protect authenticated routes
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/resume', '/roadmap', '/profile', '/admin'];
const ADMIN_PATHS = ['/admin'];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',');

// Simple in-memory rate limiter
const rateLimit = new Map();

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Rate limiting for AI endpoints
  if (request.nextUrl.pathname.startsWith('/api/ai')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 requests per minute per user

    const userRate = rateLimit.get(ip) || { count: 0, reset: now + windowMs };

    if (now > userRate.reset) {
      userRate.count = 1;
      userRate.reset = now + windowMs;
    } else {
      userRate.count++;
    }

    rateLimit.set(ip, userRate);

    if (userRate.count > maxRequests) {
      return new NextResponse('Rate limit exceeded. Please slow down.', { status: 429 });
    }
  }

  const isProtected = PROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check admin access
  if (ADMIN_PATHS.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};