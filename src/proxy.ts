import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isLecturerRoute = createRouteMatcher(['/lecturer(.*)', '/api/lecturer(.*)']);

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/contact(.*)',
  '/pricing(.*)',
  '/upgrade(.*)',
  '/api/razorpay/webhook(.*)',
  '/api/pdf-proxy(.*)',
  '/api/cron(.*)',
  '/api/newsletter(.*)',
  '/api/trial/status(.*)',
]);

interface ClerkSessionClaims {
  metadata?: {
    role?: string;
  };
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  try {
    const { userId, sessionClaims } = await auth();
    const claims = sessionClaims as ClerkSessionClaims | null;
    const role = claims?.metadata?.role;
    const url = req.nextUrl;

    const hostname = req.headers.get('host') || '';
    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

    // Skip rewrites for API routes and Next.js internals
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
      // API routes shouldn't be rewritten structurally, but we still need auth guards
      if (url.pathname.startsWith('/api/v1/admin')) {
        if (!userId || role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
      return NextResponse.next();
    }

    const isAdminDomain = hostname.startsWith('admin.');
    const isAppDomain = hostname.startsWith('app.');

    // ── Admin guard ───────────────────────────────────────────────────────────
    if (isAdminDomain) {
      if (!userId) {
        // Redirect to login (assuming login is on marketing or app domain, but typically handled by Clerk on same domain)
        return NextResponse.redirect(new URL('/login', req.url));
      }
      if (role !== 'admin') {
        // If not admin, boot them to the student app
        return NextResponse.redirect(new URL('http://app.pharmpaper.com/', req.url)); // adjust local dev host handling if needed
      }
    }

    // ── Lecturer guard ────────────────────────────────────────────────────────
    if (isLecturerRoute(req)) {
      if (url.pathname === '/api/lecturer/subscribe') return NextResponse.next();

      if (!userId) return NextResponse.redirect(new URL('/login', req.url));

      if (role !== 'lecturer' && role !== 'admin') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
        let isLecturer = false;

        if (supabaseUrl && supabaseServiceKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data } = await supabase.from('lecturers').select('id').eq('user_id', userId).maybeSingle();
            if (data) isLecturer = true;
          } catch (e: unknown) {}
        }

        if (!isLecturer) return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // ── Unauthenticated access to protected routes (Student App) ──────────────
    if (isAppDomain && !isPublicRoute(req) && !userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // ── Rewrites ──────────────────────────────────────────────────────────────
    if (isAdminDomain) {
      // Rewrite admin.domain.com/dashboard to /admin/dashboard
      return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, req.url));
    }

    if (isAppDomain) {
      // Rewrite app.domain.com/dashboard to /app/dashboard
      return NextResponse.rewrite(new URL(`/app${path === '/' ? '' : path}`, req.url));
    }

    // Marketing domain falls through to standard routing
    return NextResponse.next();

  } catch (innerError: unknown) {
    console.error('Middleware runtime error:', innerError);
    return new NextResponse(
      JSON.stringify({ error: 'Service configuration error.', code: 'MIDDLEWARE_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)',
  ],
};
