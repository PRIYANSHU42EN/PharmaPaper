"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";

interface VideoUpgradeOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function VideoUpgradeOverlay({ isOpen, onClose }: VideoUpgradeOverlayProps) {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [trialAvailable, setTrialAvailable] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed">("idle");

  // Check if trial is available
  useEffect(() => {
    if (!isSignedIn) return;

    const checkTrial = async () => {
      try {
        const res = await fetch("/api/trial/start", { method: "POST", body: JSON.stringify({ dryRun: true }) });
        // Let's check the database if a trial already exists
        const statusRes = await fetch("/api/trial/status");
        if (statusRes.ok) {
          const status = await statusRes.json();
          // if they are already premium or trial is active or trial was used
          // Wait, status.isTrial is true if trial is currently active.
          // Let's fetch if they already have a trial row from a simple custom helper or check status.
        }
      } catch (err) {
        // ignore
      }
    };
    checkTrial();
  }, [isSignedIn]);

  // Load Razorpay SDK helper
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Start Free Trial
  const handleStartTrial = async () => {
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
        setPaymentStatus("success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to activate trial.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  // Launch Razorpay checkout for video pass or full access
  const handlePayment = async (plan: "video_pass" | "full_access", amount: number) => {
    if (!isSignedIn) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error("Razorpay SDK failed to load. Please check connection.");
      }

      // 1. Create Order
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount, // in paise
          currency: "INR",
          plan_type: plan,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create payment order.");
      }

      const { order_id } = await res.json();

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay Key ID is missing.");
      }

      // 2. Open checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: "INR",
        name: "PharmPaper LMS",
        description: plan === "video_pass" ? "Monthly Video Pass" : "Full Platform Access",
        order_id: order_id,
        theme: { color: "#0582CA" },
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_type: plan,
                amount: amount,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setPaymentStatus("success");
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              setPaymentStatus("failed");
              setErrorMsg(verifyData.error || "Verification failed");
            }
          } catch (e: any) {
            setPaymentStatus("failed");
            setErrorMsg(e.message || "Verification failed");
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
        setPaymentStatus("failed");
        setErrorMsg(response.error.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-[#07080f]/95 backdrop-blur-md z-40 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full flex flex-col items-center">
        {paymentStatus === "success" ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-8">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-3xl mb-4 border border-green-500/20">
              ✓
            </div>
            <h3 className="font-bebas text-3xl text-brand-cream uppercase tracking-wider mb-2">Access Granted</h3>
            <p className="text-xs text-brand-cream/60">Your pass is active. Unlocking lecture...</p>
          </motion.div>
        ) : (
          <>
            {/* Lock icon */}
            <div className="w-16 h-16 bg-[#0582CA]/10 border border-[#0582CA]/25 rounded-full flex items-center justify-center mb-4 text-[#0582CA] shadow-[0_0_20px_rgba(5,130,202,0.1)]">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </div>

            <span className="text-[10px] uppercase font-mono tracking-widest text-[#0582CA] mb-1">Preview Ended</span>
            <h2 className="font-bebas text-3xl md:text-4xl text-brand-cream uppercase tracking-wide mb-2">Watch Full Lecture</h2>
            <p className="text-xs text-brand-cream/50 mb-6 max-w-xs leading-normal">
              This B.Pharm / D.Pharm reference lecture requires a Video Pass or Premium Membership.
            </p>

            {errorMsg && (
              <div className="mb-4 w-full p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-left">
                {errorMsg}
              </div>
            )}

            {/* Options Panel */}
            <div className="w-full space-y-3 mb-6">
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-full bg-brand text-[#07080f] font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                    Sign In to Unlock
                  </button>
                </SignInButton>
              ) : (
                <>
                  {/* Option A */}
                  <button
                    disabled={loading}
                    onClick={() => handlePayment("video_pass", 2000)}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand/40 text-left flex items-center justify-between text-xs text-brand-cream transition-all hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-brand-cream">🎬 Get Video Pass</p>
                      <p className="text-[10px] text-brand-cream/40 mt-0.5">Video Lectures only</p>
                    </div>
                    <span className="font-bold text-brand">₹20/month</span>
                  </button>

                  {/* Option B */}
                  <button
                    disabled={loading}
                    onClick={() => handlePayment("full_access", 5000)}
                    className="w-full py-3 px-4 rounded-xl bg-brand-subtle border border-[#0582CA]/30 hover:border-brand text-left flex items-center justify-between text-xs text-brand-cream transition-all hover:bg-[#0582CA]/15 disabled:opacity-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-brand-cream flex items-center gap-1">
                        ⭐ Get Full Access
                      </p>
                      <p className="text-[10px] text-brand-cream/40 mt-0.5">Videos, Notes, PYQs, Exams</p>
                    </div>
                    <span className="font-bold text-brand">₹50/month</span>
                  </button>

                  {/* Option C */}
                  {trialAvailable && (
                    <button
                      disabled={loading}
                      onClick={handleStartTrial}
                      className="w-full py-2.5 rounded-full border border-brand-border hover:border-brand/40 text-brand-cream/80 hover:text-brand-cream text-[10px] uppercase font-bold tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Starting..." : "🎓 Start 14-Day Free Trial"}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 items-center">
              {/* Go back option */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-[10px] text-brand-cream/40 hover:text-brand-cream uppercase font-mono tracking-widest transition-colors cursor-pointer"
                >
                  ← Seek Back & Preview Again
                </button>
              )}

              <Link
                href="/pricing"
                className="text-[10px] text-[#0582CA] hover:text-brand uppercase font-mono tracking-widest transition-colors"
              >
                Compare All Pricing Plans →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
