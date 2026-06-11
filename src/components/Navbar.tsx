"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import NavbarBadge from "@/components/NavbarBadge";
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
 *
 * Usage:
 *   import Navbar from "@/components/Navbar";
 *   <Navbar />
 *   <Navbar transparent siteName="PharmPaper" />
 */
export default function Navbar({ transparent = false, siteName: propSiteName }: NavbarProps) {
  const [siteName, setSiteName] = useState(propSiteName ?? "Pharma Paper");

  useEffect(() => {
    if (propSiteName) return; // caller provided a name, skip fetch
    getSettings().then((s) => {
      if (s?.sitename) setSiteName(s.sitename);
    });
  }, [propSiteName]);

  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const bpharmSubjects = [
    { name: "Human Anatomy & Physiology I", sem: "sem1", type: "bpharm" },
    { name: "Pharmaceutics I", sem: "sem1", type: "bpharm" },
    { name: "Biochemistry", sem: "sem2", type: "bpharm" },
    { name: "Pathophysiology", sem: "sem2", type: "bpharm" },
    { name: "Pharmaceutical Microbiology", sem: "sem3", type: "bpharm" },
    { name: "Pharmacology I", sem: "sem4", type: "bpharm" },
    { name: "Medicinal Chemistry II", sem: "sem5", type: "bpharm" },
    { name: "Biopharmaceutics & Pharmacokinetics", sem: "sem6", type: "bpharm" }
  ];

  const dpharmSubjects = [
    { name: "Pharmaceutics", sem: "year1", type: "dpharm" },
    { name: "Pharmaceutical Chemistry", sem: "year1", type: "dpharm" },
    { name: "Pharmacology", sem: "year2", type: "dpharm" },
    { name: "Pharmacy Law & Ethics", sem: "year2", type: "dpharm" }
  ];

  const base = transparent
    ? "w-full h-16 flex items-center justify-between px-6 md:px-12"
    : "fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl h-16 glass-panel border-brand-border rounded-full flex items-center justify-between px-8 z-50";

  return (
    <header id="main-navbar" className={base}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="PharmPaper home">
        <span className="w-3 h-3 rounded-full bg-brand shadow-[0_0_10px_rgba(5,130,202,0.8)] animate-pulse" />
        <span className="font-bebas text-2xl tracking-wider text-brand-cream font-bold">
          {renderLogo(siteName)}
        </span>
      </Link>

      {/* Desktop nav links */}
      <nav
        className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-brand-cream/70"
        aria-label="Primary navigation"
      >
        <Link href="/notes" className="hover:text-brand transition-colors duration-200">
          Notes
        </Link>
        <Link href="/pyq" className="hover:text-brand transition-colors duration-200">
          Question Papers
        </Link>
        
        {/* Hover Mega Menu */}
        <div
          className="relative"
          onMouseEnter={() => setShowMegaMenu(true)}
          onMouseLeave={() => setShowMegaMenu(false)}
        >
          <Link href="/videos" className="hover:text-brand transition-colors duration-200 py-5 flex items-center gap-1">
            Video Lectures
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${showMegaMenu ? "rotate-180 text-brand" : "text-brand-cream/50"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>

          {showMegaMenu && (
            <div className="absolute top-[48px] left-1/2 -translate-x-1/2 w-[480px] glass-panel border border-brand-border p-6 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] z-[100] grid grid-cols-2 gap-6 transition-all duration-300">
              {/* B.Pharm Column */}
              <div>
                <h4 className="text-[10px] text-brand font-mono uppercase tracking-widest font-bold mb-3 border-b border-brand-border/30 pb-1">
                  B.Pharm Lectures
                </h4>
                <ul className="flex flex-col gap-2">
                  {bpharmSubjects.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={`/subject?name=${encodeURIComponent(sub.name)}&sem=${sub.sem}&type=${sub.type}`}
                        className="text-xs text-brand-cream/75 hover:text-brand transition-colors duration-150 block truncate font-medium"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* D.Pharm Column */}
              <div>
                <h4 className="text-[10px] text-brand font-mono uppercase tracking-widest font-bold mb-3 border-b border-brand-border/30 pb-1">
                  D.Pharm Lectures
                </h4>
                <ul className="flex flex-col gap-2">
                  {dpharmSubjects.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={`/subject?name=${encodeURIComponent(sub.name)}&sem=${sub.sem}&type=${sub.type}`}
                        className="text-xs text-brand-cream/75 hover:text-brand transition-colors duration-150 block truncate font-medium"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-brand-border/30">
                  <Link
                    href="/videos"
                    className="text-[10px] text-brand hover:text-brand/80 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    View Video Vault ➔
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/pricing"
          className="text-brand hover:text-brand/80 font-semibold transition-colors duration-200"
        >
          Go Premium
        </Link>
      </nav>

      {/* Auth buttons */}
      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              id="navbar-signin-btn"
              className="px-4 py-2 rounded-full text-brand-cream/80 hover:text-brand-cream border border-brand-border hover:border-brand font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              id="navbar-signup-btn"
              className="hidden sm:block px-5 py-2 rounded-full bg-brand hover:bg-brand/90 text-brand-charcoal font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(5,130,202,0.25)] cursor-pointer"
            >
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <NavbarBadge />
            <UserButton />
          </div>
        </Show>
      </div>
    </header>
  );
}
