import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // ── Admin API security guard ─────────────────────────────────────────────
  if (url.pathname.startsWith("/api/v1/admin")) {
    // Always allow public access to admin auth setup/verification endpoint
    if (url.pathname === "/api/v1/admin/auth") {
      return NextResponse.next();
    }

    const rawHeader = req.headers.get("x-admin-passcode") || url.searchParams.get("passcode") || "";
    if (!rawHeader.trim() && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // All public marketing, content, and student-facing pages pass through without redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico|css|js)$).*)",
    "/api/v1/admin/:path*",
  ],
};

