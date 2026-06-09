"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle?: string;
}

export default function PaywallModal({ isOpen, onClose, resourceTitle = "Premium Vault" }: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/upgrade");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="glass-panel border-brand-border bg-[#0B0B0F]/90 max-w-md w-full p-8 rounded-3xl text-center relative z-10 shadow-[0_10px_50px_rgba(142,146,144,0.25)] overflow-hidden"
          >
            {/* Ambient background glow inside modal */}
            <div className="absolute -top-1/4 -right-1/4 w-40 h-40 ambient-brand-glow opacity-30 pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-brand-cream/40 hover:text-brand-cream transition-colors text-sm font-semibold cursor-pointer"
            >
              ✕
            </button>

            <span className="px-3 py-1 rounded-full bg-brand-subtle border border-brand/30 text-[9px] uppercase tracking-widest font-mono text-brand mb-4 inline-block">
              Premium Vault Locked
            </span>

            <h2 className="font-bebas text-3xl md:text-4xl text-brand-cream uppercase tracking-wide leading-none mt-2 mb-2">
              Unlock Premium Access
            </h2>
            <p className="text-xs text-brand-cream/50 mb-6 max-w-xs mx-auto leading-relaxed">
              Unlock full view & download permission for <span className="text-brand font-semibold">&quot;{resourceTitle}&quot;</span> and other study vaults.
            </p>

            {/* Features list */}
            <div className="space-y-2.5 text-left bg-brand-charcoal/40 border border-brand-border/30 rounded-2xl p-4 mb-6">
              {[
                "📚 Unlimited study vaults & notes downloads",
                "📑 High-quality verified previous year papers",
                "⚡ Exclusive mock tests & evaluation sheets",
                "💾 Personalized bookmarks & study folder vaults",
                "🚫 Completely clean, ad-free reading environment",
              ].map((feat) => (
                <div key={feat} className="text-xs text-brand-cream/80 flex items-center gap-2">
                  <span className="text-brand">✓</span>
                  <span>{feat.slice(2)}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full py-3.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-widest uppercase transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(142,146,144,0.25)]"
              >
                🎓 Unlock Vaults & Try Trial
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-full border border-brand-border hover:border-brand/40 text-brand-cream/80 hover:text-brand-cream font-semibold text-xs tracking-widest uppercase transition-all duration-300"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
