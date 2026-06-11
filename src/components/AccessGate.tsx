"use client";

import React from "react";
import Link from "next/link";
import { AccessLevel } from "@/lib/access";

interface AccessGateProps {
  /** User's current access level */
  userLevel: AccessLevel;
  /** Minimum level required to show children */
  requires: AccessLevel;
  /** Content shown when access is granted */
  children: React.ReactNode;
  /** Custom fallback — defaults to a Paywall prompt */
  fallback?: React.ReactNode;
  /** Label shown in the default paywall (e.g. "PDF notes") */
  contentLabel?: string;
}

// Access hierarchy: none < free < video_only < trial ≈ premium
const ACCESS_RANK: Record<AccessLevel, number> = {
  none:       0,
  free:       1,
  video_only: 2,
  trial:      3,
  premium:    3,
};

/**
 * Declarative access gate — renders children only when the user's access
 * level satisfies the requirement. Otherwise renders a paywall prompt.
 *
 * Usage:
 *   <AccessGate userLevel={access.level} requires="premium">
 *     <PDFViewer url={...} />
 *   </AccessGate>
 */
export default function AccessGate({
  userLevel,
  requires,
  children,
  fallback,
  contentLabel = "this content",
}: AccessGateProps) {
  const hasAccess = ACCESS_RANK[userLevel] >= ACCESS_RANK[requires];

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  // Default paywall UI
  return (
    <div className="w-full rounded-2xl glass-panel border-brand-border p-8 text-center flex flex-col items-center gap-4">
      {/* Lock icon */}
      <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xl">
        🔒
      </div>

      <div>
        <h3 className="font-bebas text-2xl text-brand-cream uppercase tracking-wide mb-2">
          Premium Content
        </h3>
        <p className="text-brand-cream/50 text-sm max-w-xs mx-auto">
          Unlock {contentLabel} with a PharmPaper premium plan. Get full access
          to all notes, PYQs, and videos.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link
          href="/pricing"
          id="access-gate-upgrade-btn"
          className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand/90 text-brand-charcoal font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(5,130,202,0.2)]"
        >
          ⭐ Upgrade Now
        </Link>
        <Link
          href="/pricing#trial"
          id="access-gate-trial-btn"
          className="px-6 py-2.5 rounded-full border border-brand-border hover:border-brand text-brand-cream font-bold text-xs tracking-widest uppercase transition-all duration-300"
        >
          Try 14-Day Free Trial
        </Link>
      </div>

      {userLevel === "none" && (
        <p className="text-[10px] text-brand-cream/30 font-mono uppercase tracking-widest mt-2">
          Sign in to activate your free trial
        </p>
      )}
    </div>
  );
}
