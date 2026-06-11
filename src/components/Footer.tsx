"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/supabase";

export default function Footer() {
  const [siteName, setSiteName] = useState("PharmPaper");

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.sitename) {
        setSiteName(settings.sitename);
      }
    });
  }, []);

  return (
    <footer className="border-t border-white/10 bg-brand-charcoal/50 backdrop-blur-sm py-12 mt-20 relative z-50 overflow-hidden">
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-6 relative z-10">
        {/* Core Navigation Links */}
        <div className="flex flex-wrap gap-6 md:gap-10 justify-center text-sm text-brand-cream/80 font-medium">
          <Link href="/notes" className="hover:text-brand transition-colors duration-200">
            Notes
          </Link>
          <Link href="/pyq" className="hover:text-brand transition-colors duration-200">
            Question Papers
          </Link>
          <Link href="/videos" className="hover:text-brand transition-colors duration-200">
            Video Lectures
          </Link>
          <Link href="/pricing" className="text-brand hover:text-brand/80 font-semibold transition-colors duration-200">
            Premium Plans
          </Link>
        </div>

        {/* Legal Policy Links */}
        <div className="flex flex-wrap gap-6 justify-center text-xs text-white/40 border-t border-brand-border/20 pt-6 w-full max-w-2xl">
          <Link href="/terms" className="hover:text-white/60 transition-colors duration-200">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors duration-200">
            Privacy Policy
          </Link>
          <Link href="/refund" className="hover:text-white/60 transition-colors duration-200">
            Cancellation & Refund Policy
          </Link>
          <Link href="/contact" className="hover:text-white/60 transition-colors duration-200">
            Contact Us / Support
          </Link>
        </div>

        {/* Brand Copyright */}
        <p className="text-center text-white/30 text-xs mt-2">
          © 2026 {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
