import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);
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

    // ── Admin guard ───────────────────────────────────────────────────────────
    if (isAdminRoute(req)) {
      if (!userId) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // ── Lecturer guard ────────────────────────────────────────────────────────
    if (isLecturerRoute(req)) {
      const pathname = req.nextUrl.pathname;

      // Public lecturer subscription endpoint — skip auth
      if (pathname === '/api/lecturer/subscribe') {
        return;
      }

      if (!userId) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      if (role !== 'lecturer' && role !== 'admin') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
        let isLecturer = false;

        if (supabaseUrl && supabaseServiceKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data } = await supabase
              .from('lecturers')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();
            if (data) isLecturer = true;
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error('Middleware lecturer check failed:', msg);
          }
        }

        if (!isLecturer) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }
    }

    // ── Unauthenticated access to protected routes ────────────────────────────
    if (!isPublicRoute(req) && !userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  } catch (innerError: unknown) {
    const msg = innerError instanceof Error ? innerError.message : String(innerError);
    console.error('Middleware runtime error:', msg);
    return new NextResponse(
      JSON.stringify({
        error: 'Service configuration error. Please try again later.',
        code: 'MIDDLEWARE_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
