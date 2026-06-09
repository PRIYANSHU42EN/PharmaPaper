"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export default function TrialModal({ isOpen, onClose, onActivated }: TrialModalProps) {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const startFreeTrial = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        if (onActivated) onActivated();
      } else {
        setErrorMsg(data.error || "Failed to start free trial.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to request free trial.");
    } finally {
      setLoading(false);
    }
  };

  const startCardTrial = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Check client-side configuration
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay Key ID is not configured on the client.");
      }

      // 2. Initialize subscription session
      const res = await fetch("/api/trial/start-with-card", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate card trial session.");
      }

      const { subscriptionId } = data;

      // 3. Load Razorpay script if not loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK."));
          document.body.appendChild(script);
        });
      }

      // 4. Trigger subscription modal
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "PharmPaper Premium",
        description: "14-Day Free Trial → ₹99/month",
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "#0582CA",
        },
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/trial/verify-card", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setSuccess(true);
              if (onActivated) onActivated();
            } else {
              throw new Error(verifyData.error || "Card verification failed.");
            }
          } catch (err: any) {
            setErrorMsg(err.message || "Card verification request failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setErrorMsg(response.error.description || "Card validation failed.");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to launch card trial.");
      setLoading(false);
    }
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
            onClick={loading ? undefined : onClose}
            className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="glass-panel border-brand-border bg-[#0B0B0F]/90 max-w-md w-full p-8 rounded-3xl text-center relative z-10 shadow-[0_10px_50px_rgba(5,130,202,0.15)] overflow-hidden"
          >
            {/* Ambient background glow inside modal */}
            <div className="absolute -top-1/4 -right-1/4 w-40 h-40 ambient-brand-glow opacity-30 pointer-events-none" />

            {success ? (
              <div>
                <div className="w-16 h-16 bg-brand-subtle border border-brand/30 text-brand rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_15px_rgba(5,130,202,0.2)]">
                  🎉
                </div>
                <h2 className="font-bebas text-3xl tracking-wide text-brand-cream uppercase mb-3">
                  Trial Activated!
                </h2>
                <p className="text-xs text-brand-cream/60 leading-relaxed mb-8">
                  You now have 14 days of full premium access. Enjoy unlimited study vaults, question papers, and bookmarks!
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(5,130,202,0.25)] hover:scale-[1.02]"
                >
                  Start Studying →
                </button>
              </div>
            ) : (
              <div>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="absolute top-4 right-4 text-brand-cream/40 hover:text-brand-cream transition-colors text-sm font-semibold cursor-pointer"
                >
                  ✕
                </button>

                <span className="px-3 py-1 rounded-full bg-brand-subtle border border-brand/30 text-[9px] uppercase tracking-widest font-mono text-brand mb-4 inline-block">
                  LIMITED TIME OFFER
                </span>

                <h2 className="font-bebas text-4xl text-brand-cream uppercase tracking-wide leading-none mt-2 mb-2">
                  14 DAYS FREE
                </h2>
                <p className="text-xs text-brand-cream/50 mb-6">
                  Full premium access. Cancel anytime.
                </p>

                {errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-left">
                    {errorMsg}
                  </div>
                )}

                {/* Features list */}
                <div className="space-y-2.5 text-left bg-brand-charcoal/40 border border-brand-border/30 rounded-2xl p-4 mb-6">
                  {[
                    "📚 Unlimited notes & study vault downloads",
                    "📑 Verified previous year question papers",
                    "🔍 Fast indexing & search engine support",
                    "💾 Bookmarks & personalized vault folders",
                    "🚫 Pure ad-free reading environment",
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
                    onClick={startFreeTrial}
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-semibold text-xs tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? "Activating..." : "🎓 Start Free Trial — No Card Needed"}
                  </button>

                  <div className="text-[10px] text-brand-cream/30 uppercase tracking-widest font-mono">
                    or
                  </div>

                  <button
                    onClick={startCardTrial}
                    disabled={loading}
                    className="w-full py-3 rounded-full border border-brand-border hover:border-brand/40 text-brand-cream/80 hover:text-brand-cream font-semibold text-xs tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                  >
                    💳 Card Trial → Auto ₹99/mo after 14d
                  </button>

                  <p className="text-[9px] text-brand-cream/30 text-center leading-normal mt-2">
                    Card trial starts a monthly subscription. Cancel before day 14 to avoid any charge.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
