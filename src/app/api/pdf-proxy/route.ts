import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { checkUserPremiumStatus } from "@/lib/premium-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * PDF Proxy Route — STREAMING
 * Streams a remote PDF through the server to bypass CORS.
 * Passes Content-Length from upstream so the client can show download progress.
 */

const ALLOWED_HOSTS = [
  "drive.google.com",
  "docs.google.com",
  "drive.usercontent.google.com",
  "www.w3.org",
  "pcvvdcbivqzqrwrwowlp.supabase.co",
  "localhost",
  "127.0.0.1",
];

function toDirectGoogleDriveUrl(url: string): string {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { blocked, headers } = await checkRateLimit("pdf", ip);
  if (blocked) {
    return NextResponse.json(
      { error: "Too many PDF proxy requests. Try again in 1 minute." },
      { status: 429, headers }
    );
  }

  // 1. Verify User Authentication & Premium Status
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: Please sign in to view documents." },
      { status: 401 }
    );
  }

  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  const premiumStatus = await checkUserPremiumStatus(userId);
  const isPremium = premiumStatus.isPremium;

  if (!isPremium) {
    // Check daily unique PDF views limit for free users
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data: views, error: viewsError } = await supabase
      .from("page_analytics")
      .select("page")
      .eq("user_id", userId)
      .eq("event_type", "pdf_view")
      .gte("created_at", todayStart.toISOString());

    if (viewsError) {
      console.error("Error querying daily PDF views:", viewsError.message);
      return NextResponse.json({ error: "Database error querying usage limits" }, { status: 500 });
    }

    const uniqueUrls = new Set(views?.map(v => v.page).filter(Boolean) || []);
    const isAlreadyViewed = uniqueUrls.has(urlParam);

    if (!isAlreadyViewed && uniqueUrls.size >= 3) {
      return NextResponse.json(
        { error: "limit_reached", message: "You have reached your daily free limit of 3 PDFs. Please upgrade to Pro." },
        { status: 403 }
      );
    }
  }

  // Handle preflight checks
  const checkOnly = req.nextUrl.searchParams.get("check") === "true";
  if (checkOnly) {
    return NextResponse.json({ allowed: true });
  }

  // Log view event
  const docTitle = req.nextUrl.searchParams.get("title") || "Study Material";
  try {
    await supabase.from("page_analytics").insert({
      event_type: "pdf_view",
      page: urlParam,
      user_id: userId,
      metadata: { title: docTitle }
    });
  } catch (err) {
    console.error("Failed to log pdf_view event:", err);
  }

  let parsedUrl: URL;
  try {
    if (urlParam.startsWith("/")) {
      parsedUrl = new URL(urlParam, req.nextUrl.origin);
    } else {
      parsedUrl = new URL(urlParam);
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.hostname !== "localhost" &&
    parsedUrl.hostname !== "127.0.0.1"
  ) {
    return NextResponse.json(
      { error: "Only HTTPS URLs are allowed" },
      { status: 400 }
    );
  }

  // Whitelist domain check
  const isAllowed = ALLOWED_HOSTS.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith("." + domain));
  if (!isAllowed) {
    return NextResponse.json(
      { error: `Host '${parsedUrl.hostname}' is not in the allowed list` },
      { status: 403 }
    );
  }

  let fetchUrl = parsedUrl.toString();
  if (
    parsedUrl.hostname === "drive.google.com" &&
    urlParam.includes("/file/d/")
  ) {
    fetchUrl = toDirectGoogleDriveUrl(urlParam);
  }

  try {
    const upstream = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf, */*",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${upstream.status} ${upstream.statusText}` },
        { status: 502 }
      );
    }

    // Force reject non-PDF content type
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"document.pdf\"",
      "X-Content-Type-Options": "nosniff", // prevent MIME sniffing
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    };

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("[pdf-proxy] Fetch error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch the PDF from the remote server" },
      { status: 502 }
    );
  }
}
