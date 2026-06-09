import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self';",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.gstatic.com https://cdnjs.cloudflare.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "font-src 'self' data: https://fonts.gstatic.com;",
      "img-src 'self' data: blob: https://checkout.razorpay.com https://img.clerk.com https://*.clerk.accounts.dev https://img.youtube.com;",
      "connect-src 'self' ws: wss: blob: https://api.razorpay.com https://*.supabase.co https://*.upstash.io https://www.gstatic.com https://cdnjs.cloudflare.com https://*.clerk.accounts.dev https://clerk-telemetry.com;", // Allowed ws/wss for Next.js Dev Server HMR, blob: for ThreeJS, Supabase, and CDNs
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.supabase.co https://*.jsdelivr.net https://example.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com;", // Allowed iframes for embedding PDF viewers from Supabase and trusted CDNs
      "worker-src 'self' blob: https://cdnjs.cloudflare.com;",
      "media-src 'self' blob:;",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "frame-ancestors 'none';",
    ].join(" "),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["three", "gsap", "@react-three/fiber", "@react-three/drei"],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    staticGenerationMaxConcurrency: 1,
    workerThreads: false,
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/book.glb",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/handwritten_notes_preview.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/draco/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
