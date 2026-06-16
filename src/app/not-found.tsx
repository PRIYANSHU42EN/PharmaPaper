"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#171717] text-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] ambient-brand-glow opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] ambient-brand-glow opacity-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        {/* Error Code */}
        <div className="font-bebas text-[8rem] md:text-[12rem] leading-none text-[#fafafa]/5 select-none mb-0 tracking-tighter">
          404
        </div>

        {/* Glass card overlay */}
        <div className="glass-panel border-[#222222] rounded-3xl p-8 md:p-12 -mt-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-[#222222] text-[#888888] text-[10px] uppercase font-bold tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-ping" />
            Page Not Found
          </div>

          <h1 className="font-bebas text-4xl md:text-5xl text-[#fafafa] mb-4 uppercase tracking-wide leading-none">
            STUDY MATERIAL <span className="text-[#888888]">NOT FOUND</span>
          </h1>

          <p className="text-[#fafafa]/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-8 py-3 rounded-full bg-[#888888] hover:bg-[#aaaaaa] text-[#171717] font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(136,136,136,0.15)]"
            >
              Back to Home
            </Link>
            <Link
              href="/notes"
              className="px-8 py-3 rounded-full glass-panel border-[#222222] hover:border-[#888888] text-[#fafafa] font-semibold text-xs tracking-widest uppercase transition-all duration-300"
            >
              Browse Notes
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-8 pt-6 border-t border-[#222222]/30 grid grid-cols-3 gap-4 text-[10px] uppercase tracking-widest">
            {[
              { href: "/pyq", label: "📋 PYQs" },
              { href: "/videos", label: "🎬 Videos" },
              { href: "/dashboard", label: "📊 Dashboard" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#fafafa]/40 hover:text-[#888888] transition-colors duration-200 font-mono"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
