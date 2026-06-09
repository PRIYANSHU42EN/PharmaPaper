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
        {/* Navigation Links required by Razorpay */}
        <div className="flex flex-wrap gap-6 md:gap-10 justify-center text-sm text-white/50">
          <Link href="/terms" className="hover:text-brand transition-colors duration-200">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="hover:text-brand transition-colors duration-200">
            Privacy Policy
          </Link>
          <Link href="/refund" className="hover:text-brand transition-colors duration-200">
            Refund Policy
          </Link>
          <Link href="/contact" className="hover:text-brand transition-colors duration-200">
            Contact Us
          </Link>
        </div>

        {/* Brand Copyright */}
        <p className="text-center text-white/30 text-xs mt-4">
          © 2026 {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
