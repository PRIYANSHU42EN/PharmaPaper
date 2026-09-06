import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * PDF Proxy Route — STREAMING
 * Streams a remote PDF through the server to bypass CORS and ensure inline rendering.
 * Passes Content-Length and Content-Type from upstream.
 */

const ALLOWED_HOSTS = [
  "drive.google.com",
  "docs.google.com",
  "drive.usercontent.google.com",
  "www.w3.org",
  "pcvvdcbivqzqrwrwowlp.supabase.co",
  ...(process.env.NODE_ENV === "development" ? ["localhost", "127.0.0.1"] : []),
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
      { error: "Too many requests. Please try again in a moment." },
      { status: 429, headers }
    );
  }

  const urlParam = req.nextUrl.searchParams.get("url");
  const isDownload = req.nextUrl.searchParams.get("download") === "true";
  const filename = req.nextUrl.searchParams.get("filename") || "document.pdf";

  if (!urlParam) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
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
    !(process.env.NODE_ENV === "development" && (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1"))
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
    // Upstream fetch with 15s timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const upstream = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf, */*",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${upstream.status} ${upstream.statusText}` },
        { status: 502 }
      );
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const disposition = isDownload
      ? `attachment; filename="${safeFilename}"`
      : `inline; filename="${safeFilename}"`;

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
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
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream storage request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch the PDF from the remote server" },
      { status: 502 }
    );
  }
}
