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
      "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.gstatic.com https://cdnjs.cloudflare.com https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "font-src 'self' data: https://fonts.gstatic.com;",
      "img-src 'self' data: blob: https://checkout.razorpay.com https://img.youtube.com;",
      "connect-src 'self' ws: wss: blob: https://api.razorpay.com https://*.supabase.co https://*.upstash.io https://www.gstatic.com https://cdnjs.cloudflare.com;",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.supabase.co https://*.jsdelivr.net https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com;",
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
  compress: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },

  turbopack: {
    root: __dirname,
  },

  async redirects() {
    return [
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
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
