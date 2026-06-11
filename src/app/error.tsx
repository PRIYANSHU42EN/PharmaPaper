"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the Next.js App Router.
 * Catches runtime errors that bubble up from page/layout components.
 * Must be a Client Component.
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in development; in production wire to Sentry/Datadog
    console.error("[GlobalError]", error?.message, error?.digest);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f0f] text-[#f0ece4] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md w-full"
          style={{
            background: "rgba(26,26,26,0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(5,130,202,0.1)",
            borderRadius: "24px",
            padding: "3rem 2rem",
          }}
        >
          {/* Error icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              margin: "0 auto 1.5rem",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#f0ece4",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.75rem",
            }}
          >
            Something Went Wrong
          </h1>

          <p
            style={{
              color: "rgba(240,236,228,0.5)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            An unexpected error occurred. The team has been notified.
            {error?.digest && (
              <span
                style={{
                  display: "block",
                  marginTop: "0.5rem",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "rgba(240,236,228,0.3)",
                }}
              >
                Error ID: {error.digest}
              </span>
            )}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "999px",
                background: "#0582CA",
                color: "#0f0f0f",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = "0.85")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = "1")}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "999px",
                background: "transparent",
                border: "1px solid rgba(5,130,202,0.25)",
                color: "#f0ece4",
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "block",
                textAlign: "center",
              }}
            >
              Return Home
            </Link>
          </div>
        </motion.div>
      </body>
    </html>
  );
}
