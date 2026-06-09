import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);
const isLecturerRoute = createRouteMatcher(['/lecturer(.*)', '/api/lecturer(?!/subscribe)(.*)']);

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
  '/api/razorpay/webhook(.*)',
  '/api/pdf-proxy(.*)',
  '/api/cron(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Block unauthenticated access to admin
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // ✅ Check admin role from Clerk metadata
    const role = (sessionClaims as any)?.metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Block unauthorized access to lecturer dashboard
  if (isLecturerRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = (sessionClaims as any)?.metadata?.role;
    if (role !== 'lecturer' && role !== 'admin') {
      // Check database if they exist in lecturers table
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      let isLecturer = false;

      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data } = await supabase
            .from('lecturers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          if (data) {
            isLecturer = true;
          }
        } catch (e) {
          console.error('Middleware lecturer verification exception:', e);
        }
      }

      if (!isLecturer) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  // Protect non-public routes
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
