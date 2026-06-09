import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
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
  '/api/razorpay/webhook(.*)',
  '/api/pdf-proxy(.*)',
  '/api/cron(.*)'
]);

let middlewareExport: any;

try {
  middlewareExport = clerkMiddleware(async (auth, req) => {
    try {
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
        // Exclude /api/lecturer/subscribe
        const pathname = req.nextUrl.pathname;
        if (pathname === '/api/lecturer/subscribe') {
          return;
        }

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
    } catch (innerError: any) {
      console.error('Middleware runtime error:', innerError);
      return new NextResponse(
        `MIDDLEWARE RUNTIME ERROR:\n\n${innerError?.message || String(innerError)}\n\n` +
        `Please check if Clerk or Supabase environment variables are correctly configured on your Vercel Dashboard.`,
        { status: 500, headers: { 'Content-Type': 'text/plain' } }
      );
    }
  });
} catch (outerError: any) {
  middlewareExport = function middleware(req: any) {
    return new NextResponse(
      `MIDDLEWARE INITIALIZATION ERROR:\n\n${outerError?.message || String(outerError)}\n\n` +
      `Please check if Clerk or Supabase environment variables are correctly configured on your Vercel Dashboard.`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  };
}

export default middlewareExport;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
