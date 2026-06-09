"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function UpgradePrompt({ message = "This premium study vault requires an active subscription." }: { message?: string }) {
  return (
    <div className="w-full flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel border-brand-border bg-[#0B0B0F]/90 max-w-lg w-full p-8 md:p-10 rounded-3xl text-center relative z-10 shadow-[0_10px_50px_rgba(5,130,202,0.15)] overflow-hidden"
      >
        {/* Ambient background glow inside paywall */}
        <div className="absolute -top-1/4 -right-1/4 w-48 h-48 bg-brand/10 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1/4 -left-1/4 w-48 h-48 bg-brand/5 filter blur-3xl pointer-events-none" />

        <span className="px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-[9px] uppercase tracking-widest font-mono text-brand mb-6 inline-block font-extrabold">
          Premium Locked
        </span>

        <h2 className="font-bebas text-4xl md:text-5xl text-brand-cream uppercase tracking-wide leading-none mt-2 mb-4">
          Upgrade to Premium
        </h2>
        
        <p className="text-xs text-brand-cream/60 mb-8 max-w-sm mx-auto leading-relaxed">
          {message} Upgrade to one of our premium plans to get full unlimited access to all study guides, notes, and previous year papers.
        </p>

        {/* Features list */}
        <div className="space-y-3 text-left bg-brand-charcoal/40 border border-brand-border/40 rounded-2xl p-6 mb-8">
          {[
            "📚 Unlimited study guides & PDF downloads",
            "📑 Complete collection of verified past papers (PYQs)",
            "⚡ Detailed mock assessments & explanations",
            "🎥 Distraction-free video lecture vaults",
            "💾 Offline study vault access & bookmark sync",
          ].map((feat) => (
            <div key={feat} className="text-xs text-brand-cream/80 flex items-center gap-2.5">
              <span className="text-brand text-sm">✓</span>
              <span>{feat.slice(2)}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pricing"
            className="flex-1 py-3.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-extrabold text-xs tracking-widest uppercase text-center transition-all duration-300 shadow-[0_4px_20px_rgba(5,130,202,0.25)] hover:scale-[1.02] active:scale-[0.98]"
          >
            🎓 View Pricing & Plans
          </Link>
          <Link
            href="/"
            className="flex-1 py-3.5 rounded-full border border-brand-border hover:border-brand/40 text-brand-cream/85 hover:text-brand-cream font-semibold text-xs tracking-widest uppercase text-center transition-all duration-300"
          >
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
