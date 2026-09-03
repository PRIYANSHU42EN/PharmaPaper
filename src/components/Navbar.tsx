"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/supabase";

interface NavbarProps {
  /** When true the navbar is transparent (for pages with a background). Default: glass pill. */
  transparent?: boolean;
  /** Override site name (falls back to platform_settings). */
  siteName?: string;
}

function renderLogo(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length <= 1) return <span>{name.toUpperCase()}</span>;
  return (
    <>
      {parts[0].toUpperCase()}
      <span className="text-brand"> {parts.slice(1).join(" ").toUpperCase()}</span>
    </>
  );
}

/**
 * Shared navigation bar used across all pages except the Hero landing section
 * (which has its own inline nav for scroll-animation reasons).
 */
export default function Navbar({ transparent = false, siteName: propSiteName }: NavbarProps) {
  const [siteName, setSiteName] = useState(propSiteName ?? "Pharma Paper");

  useEffect(() => {
    if (propSiteName) return; // caller provided a name, skip fetch
    getSettings().then((s) => {
      if (s?.sitename) setSiteName(s.sitename);
    });
  }, [propSiteName]);

  const base = transparent
    ? "w-full h-16 flex items-center justify-between px-6 md:px-12"
    : "fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl h-16 glass-panel border-[#222222] rounded-full flex items-center justify-between px-8 z-50";

  return (
    <header id="main-navbar" className={base}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="PharmPaper home">
        <span className="w-3 h-3 rounded-full bg-[#888888] shadow-[0_0_10px_rgba(136,136,136,0.5)] animate-pulse" />
        <span className="font-bebas text-2xl tracking-wider text-[#fafafa] font-bold">
          {renderLogo(siteName)}
        </span>
      </Link>

      {/* Desktop nav links */}
      <nav
        className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-[#fafafa]/70"
        aria-label="Primary navigation"
      >
        <Link href="/" className="hover:text-[#888888] transition-colors duration-200">
          Home
        </Link>
        <Link href="/contact" className="hover:text-[#888888] transition-colors duration-200">
          Contact
        </Link>
        <Link href="/privacy" className="hover:text-[#888888] transition-colors duration-200">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-[#888888] transition-colors duration-200">
          Terms
        </Link>
      </nav>

      {/* Auth buttons */}
      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <Link
            href="/app/login"
            id="navbar-signin-btn"
            className="px-4 py-2 rounded-full text-[#fafafa]/80 hover:text-[#fafafa] border border-[#222222] hover:border-[#888888] font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Sign In
          </Link>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <UserButton />
          </div>
        </Show>
      </div>
    </header>
  );
}
