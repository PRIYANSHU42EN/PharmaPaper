import React from "react";

interface PageShellProps {
  /** Page content */
  children: React.ReactNode;
  /** Optional extra classes for the outer wrapper */
  className?: string;
  /** Max-width constraint. Defaults to max-w-7xl */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
  /** Padding preset */
  padded?: boolean;
}

const maxWidthMap: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-xl",
  "2xl":"max-w-2xl",
  "7xl":"max-w-7xl",
  full: "max-w-full",
};

/**
 * Standard page wrapper — provides consistent background, text colour,
 * overflow guard, and max-width centering used across all inner pages.
 *
 * Usage:
 *   <PageShell>
 *     <Navbar />
 *     <main>...</main>
 *   </PageShell>
 */
export default function PageShell({
  children,
  className = "",
  maxWidth = "7xl",
  padded = true,
}: PageShellProps) {
  return (
    <div
      className={`min-h-screen bg-brand-charcoal text-brand-cream overflow-x-hidden relative ${className}`}
    >
      {/* Subtle ambient top glow shared across pages */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(5,130,202,0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 mx-auto ${maxWidthMap[maxWidth]} ${
          padded ? "px-4 sm:px-6 md:px-8" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
