"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, Menu, X, GraduationCap, FileText, Info, Shield, Mail, Sparkles } from "lucide-react";

export default function Navbar() {
  const [bpharmOpen, setBpharmOpen] = useState(false);
  const [dpharmOpen, setDpharmOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const bpharmRef = useRef<HTMLDivElement>(null);
  const dpharmRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bpharmRef.current && !bpharmRef.current.contains(e.target as Node)) {
        setBpharmOpen(false);
      }
      if (dpharmRef.current && !dpharmRef.current.contains(e.target as Node)) {
        setDpharmOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const bpharmSemesters = [
    { name: "1st Semester", slug: "1st-semester" },
    { name: "2nd Semester", slug: "2nd-semester" },
    { name: "3rd Semester", slug: "3rd-semester" },
    { name: "4th Semester", slug: "4th-semester" },
    { name: "5th Semester", slug: "5th-semester" },
    { name: "6th Semester", slug: "6th-semester" },
    { name: "7th Semester", slug: "7th-semester" },
    { name: "8th Semester", slug: "8th-semester" },
  ];

  const dpharmYears = [
    { name: "1st Year", slug: "1st-year" },
    { name: "2nd Year", slug: "2nd-year" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FBC02D] text-slate-900 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-[#FBC02D] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-950">
                Pharma<span className="text-blue-700">Paper</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-800 -mt-1 tracking-tight">
                Your Gateway to Excellence in Pharmacy Education
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
            >
              Home
            </Link>

            {/* BPHARM Dropdown */}
            <div className="relative" ref={bpharmRef}>
              <button
                onClick={() => { setBpharmOpen(!bpharmOpen); setDpharmOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
                aria-expanded={bpharmOpen}
              >
                <span>B.PHARM</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${bpharmOpen ? "rotate-180" : ""}`} />
              </button>

              {bpharmOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Bachelor of Pharmacy
                  </div>
                  <div className="grid grid-cols-1 divide-y divide-slate-50">
                    {bpharmSemesters.map(sem => (
                      <Link
                        key={sem.slug}
                        href={`/bpharm/${sem.slug}`}
                        onClick={() => setBpharmOpen(false)}
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors"
                      >
                        <span>{sem.name}</span>
                        <span className="text-xs text-slate-400">Notes &rarr;</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DPHARM Dropdown */}
            <div className="relative" ref={dpharmRef}>
              <button
                onClick={() => { setDpharmOpen(!dpharmOpen); setBpharmOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
                aria-expanded={dpharmOpen}
              >
                <span>D.PHARM</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${dpharmOpen ? "rotate-180" : ""}`} />
              </button>

              {dpharmOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Diploma in Pharmacy
                  </div>
                  <div className="grid grid-cols-1 divide-y divide-slate-50">
                    {dpharmYears.map(yr => (
                      <Link
                        key={yr.slug}
                        href={`/dpharm/${yr.slug}`}
                        onClick={() => setDpharmOpen(false)}
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors"
                      >
                        <span>{yr.name}</span>
                        <span className="text-xs text-slate-400">Notes &rarr;</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/posts" 
              className="px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
            >
              All Posts
            </Link>

            <Link 
              href="/about" 
              className="px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
            >
              About Us
            </Link>

            <Link 
              href="/privacy" 
              className="px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
            >
              Privacy
            </Link>

            <Link 
              href="/contact" 
              className="px-3 py-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
            >
              Contact Us
            </Link>
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FBC02D] border-t border-black/10 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-950 hover:bg-black/10"
          >
            Home
          </Link>

          <div className="space-y-1">
            <span className="block px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-800">
              B.PHARM SEMESTERS
            </span>
            <div className="grid grid-cols-2 gap-1 pl-2">
              {bpharmSemesters.map(sem => (
                <Link
                  key={sem.slug}
                  href={`/bpharm/${sem.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-900 bg-black/5 hover:bg-black/10"
                >
                  {sem.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="block px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-800">
              D.PHARM YEARS
            </span>
            <div className="grid grid-cols-2 gap-1 pl-2">
              {dpharmYears.map(yr => (
                <Link
                  key={yr.slug}
                  href={`/dpharm/${yr.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-900 bg-black/5 hover:bg-black/10"
                >
                  {yr.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-black/10 pt-2 space-y-1">
            <Link
              href="/posts"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-900 hover:bg-black/10"
            >
              All Posts / Career Articles
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-900 hover:bg-black/10"
            >
              About Us
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-900 hover:bg-black/10"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-900 hover:bg-black/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
