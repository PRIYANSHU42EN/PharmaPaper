"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import TrialModal from "@/components/TrialModal";

export default function PricingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed" | "cancelled">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialStatus, setTrialStatus] = useState<any>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/trial/status")
        .then((res) => res.json())
        .then((data) => setTrialStatus(data))
        .catch((err) => console.error("Error checking trial status:", err));
    }
  }, [isSignedIn]);

  const handleCheckout = async (plan: "video_pass" | "premium_monthly" | "premium_yearly", amount: number, planName: string) => {
    if (!isSignedIn) return;

    setLoading(true);
    setPaymentStatus("idle");
    setErrorMsg("");
    setSelectedPlanName(planName);

    try {
      const isSubscription = plan === "premium_monthly" || plan === "premium_yearly";
      
      let res;
      let order_id = "";
      let subscription_id = "";

      if (isSubscription) {
        // 1. Create subscription on backend
        res = await fetch("/api/razorpay/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_type: plan }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to initiate subscription");
        }

        const data = await res.json();
        subscription_id = data.subscription_id;
      } else {
        // Create one-time order
        res = await fetch("/api/razorpay/create-order", {
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
          throw new Error(errData.error || "Failed to initiate transaction");
        }

        const data = await res.json();
        order_id = data.order_id;
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay Key ID environment variable is not defined on the client.");
      }

      // 2. Configure Razorpay options
      const options: any = {
        key: keyId,
        name: "PharmPaper Subscription",
        description: `${planName}`,
        prefill: {
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "#0582CA",
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus("cancelled");
            setLoading(false);
          },
        },
      };

      if (isSubscription) {
        options.subscription_id = subscription_id;
        options.handler = async function (response: any) {
          try {
            setLoading(true);
            // Verify subscription on backend
            const verifyRes = await fetch("/api/razorpay/verify-subscription", {
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
              setPaymentStatus("success");
            } else {
              setPaymentStatus("failed");
              setErrorMsg(verifyData.error || "Verification failed");
            }
          } catch (err: any) {
            setPaymentStatus("failed");
            setErrorMsg(err.message || "Verification request failed");
          } finally {
            setLoading(false);
          }
        };
      } else {
        options.amount = amount;
        options.currency = "INR";
        options.order_id = order_id;
        options.handler = async function (response: any) {
          try {
            setLoading(true);
            // Verify payment on backend
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
            } else {
              setPaymentStatus("failed");
              setErrorMsg(verifyData.error || "Verification failed");
            }
          } catch (err: any) {
            setPaymentStatus("failed");
            setErrorMsg(err.message || "Verification request failed");
          } finally {
            setLoading(false);
          }
        };
      }

      // Guard against Razorpay script not loaded (ad blockers, slow network)
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Payment gateway unavailable. Please disable ad blockers and try again.');
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setPaymentStatus("failed");
        setErrorMsg(response.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to launch Razorpay checkout");
      setPaymentStatus("failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-brand-cream relative overflow-hidden flex flex-col items-center justify-between pb-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.05]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.03]" />

      {/* Sticky navigation header */}
      <header className="w-full h-16 border-b border-brand-border/40 flex items-center justify-between px-6 md:px-12 backdrop-blur-md bg-brand-charcoal/80 z-50">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(5,130,202,0.8)] animate-pulse" />
          <span className="font-bebas text-xl tracking-wider text-brand-cream font-bold">
            PHARM<span className="text-brand">PAPER</span>
          </span>
        </Link>
        <Link href="/" className="px-4 py-1.5 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand text-xs font-semibold tracking-wider uppercase transition-all duration-300">
          Back to Home
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl px-6 py-12 z-20 w-full">
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
            Flexible Pricing Plans
          </span>
          <h1 className="font-bebas text-5xl md:text-7xl text-brand-cream tracking-tight mt-4 mb-4">
            CHOOSE YOUR <span className="text-brand">ACCESS LEVEL</span>
          </h1>
          <p className="text-xs md:text-sm text-brand-cream/60 max-w-2xl mx-auto leading-relaxed">
            Enhance your pharmacy education with verified D.Pharm & B.Pharm notes, distraction-free video lectures, and exam prep resources.
          </p>
        </div>

        {/* Display payment state feedback */}
        {paymentStatus === "success" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-12 p-8 glass-panel border-green-500/30 rounded-3xl text-center max-w-md w-full"
          >
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-green-500/20">
              ✓
            </div>
            <h2 className="text-lg font-bold text-brand-cream uppercase mb-2">Payment Successful!</h2>
            <p className="text-xs text-brand-cream/60 mb-6">
              Thank you! Your <strong>{selectedPlanName}</strong> tier is now active. Let's start learning.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/notes" className="inline-block px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-all">
                Go to Notes Workspace
              </Link>
              <Link href="/videos" className="inline-block px-6 py-2.5 rounded-full border border-brand-border hover:border-brand/40 text-brand-cream font-bold text-xs tracking-wider uppercase transition-all">
                Go to Videos Vault
              </Link>
            </div>
          </motion.div>
        )}

        {paymentStatus === "failed" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-12 p-8 glass-panel border-red-500/30 rounded-3xl text-center max-w-md w-full"
          >
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-lg mx-auto mb-4 border border-red-500/20">
              ✕
            </div>
            <h2 className="text-lg font-bold text-brand-cream uppercase mb-2">Payment Failed</h2>
            <p className="text-xs text-brand-cream/60 mb-2">
              We couldn't verify your transaction. Please try again or contact support.
            </p>
            {errorMsg && (
              <p className="text-[10px] font-mono text-red-400 bg-red-500/5 p-2.5 rounded border border-red-500/10 mb-6 text-left">
                Error Details: {errorMsg}
              </p>
            )}
            <button
              onClick={() => setPaymentStatus("idle")}
              className="px-6 py-2.5 rounded-full border border-brand-border hover:border-brand text-brand-cream font-bold text-xs tracking-wider uppercase transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {paymentStatus === "cancelled" && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-12 p-8 glass-panel border-brand-border rounded-3xl text-center max-w-md w-full"
          >
            <h2 className="text-lg font-bold text-brand-cream uppercase mb-2">Checkout Cancelled</h2>
            <p className="text-xs text-brand-cream/60 mb-6">
              You cancelled the payment dialog. Feel free to upgrade when you are ready.
            </p>
            <button
              onClick={() => setPaymentStatus("idle")}
              className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-all"
            >
              View Plans
            </button>
          </motion.div>
        )}

        {paymentStatus === "idle" && (
          <>
            {/* Free Trial Banner Callout */}
            {(!trialStatus || (trialStatus.level === 'free' && !trialStatus.isPremium)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 p-6 glass-panel border-brand/35 bg-[#0B0B0F]/90 rounded-3xl text-center max-w-2xl w-full mx-auto relative overflow-hidden shadow-[0_4px_25px_rgba(5,130,202,0.08)]"
              >
                <div className="absolute -top-1/4 -right-1/4 w-32 h-32 ambient-brand-glow opacity-20 pointer-events-none" />
                <span className="px-3 py-1 rounded-full bg-brand-subtle border border-brand/30 text-[9px] uppercase tracking-widest font-mono text-brand mb-3 inline-block">
                  Highly Recommended
                </span>
                <h2 className="font-bebas text-2xl md:text-4xl text-brand-cream uppercase tracking-wide leading-none mb-2">
                  START YOUR 14-DAY <span className="text-brand">FREE TRIAL</span>
                </h2>
                <p className="text-xs text-brand-cream/50 max-w-md mx-auto mb-5 leading-normal">
                  Unlock all study material, premium PYQs, quizzes, and ad-free reading. No credit card required to start!
                </p>
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => setIsTrialModalOpen(true)}
                    className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(5,130,202,0.2)] hover:scale-[1.02]"
                  >
                    🎓 Try Trial Now
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button type="button" className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(5,130,202,0.2)] hover:scale-[1.02]">
                      🎓 Sign In to Start Trial
                    </button>
                  </SignInButton>
                )}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {/* TIER 1: FREE */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel border-brand-border/40 hover:border-brand-cream/10 p-6 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-brand-cream/40 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                  Tier 1
                </span>
                <h3 className="font-bebas text-2xl text-brand-cream mt-3 mb-4 tracking-wide">FREE PLAN</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-brand-cream/80">₹0</span>
                  <span className="text-xs text-brand-cream/40 ml-2">/ lifetime</span>
                </div>
                <ul className="text-[11px] text-brand-cream/75 space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Browse all subjects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>First 2 min of any video</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>3 PDFs daily reading limit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>5 sample quiz questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>1 year PYQs only</span>
                  </li>
                </ul>
              </div>

              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button type="button" className="w-full py-3 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(5,130,202,0.2)]">
                    Start Free Trial
                  </button>
                </SignInButton>
              ) : trialStatus && !trialStatus.isPremium && trialStatus.level === 'free' ? (
                <button
                  type="button"
                  onClick={() => setIsTrialModalOpen(true)}
                  className="w-full py-3 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(5,130,202,0.2)]"
                >
                  Start Free Trial
                </button>
              ) : (
                <Link href="/notes" className="w-full text-center py-3 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand font-bold text-[10px] tracking-widest uppercase transition-all">
                  Use Free Version
                </Link>
              )}
            </motion.div>

            {/* TIER 2: VIDEO PASS */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel border-brand-border hover:border-brand-cream/20 p-6 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
                  LMS Access
                </span>
                <h3 className="font-bebas text-2xl text-brand-cream mt-3 mb-4 tracking-wide">VIDEO PASS</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-brand">₹20</span>
                  <span className="text-xs text-brand-cream/40 ml-2">/ month</span>
                </div>
                <ul className="text-[11px] text-brand-cream/75 space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>All video lectures (unlimited)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Subscribe to lecturers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Personal timestamp notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Write comments & feedback</span>
                  </li>
                  <li className="flex items-start gap-2 text-brand-cream/35">
                    <span className="shrink-0">✕</span>
                    <span>Does NOT unlock PDFs/PYQs</span>
                  </li>
                </ul>
              </div>

              {!isLoaded ? (
                <div className="w-full h-11 bg-white/5 animate-pulse rounded-full" />
              ) : !isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-full border border-brand-border hover:border-brand hover:text-brand font-bold text-[10px] tracking-widest uppercase transition-all">
                    Sign in to buy
                  </button>
                </SignInButton>
              ) : (
                <button
                  disabled={loading}
                  onClick={() => handleCheckout("video_pass", 2000, "Video Pass")}
                  className="w-full py-3 rounded-full bg-brand-subtle hover:bg-brand/20 text-brand border border-brand/30 font-bold text-[10px] tracking-widest uppercase transition-all"
                >
                  {loading ? "Processing..." : "Buy Video Pass"}
                </button>
              )}
            </motion.div>

            {/* TIER 3: FULL ACCESS MONTHLY */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel border-brand/40 hover:border-brand p-6 rounded-3xl flex flex-col justify-between relative shadow-[0_0_30px_rgba(5,130,202,0.15)]"
            >
              <div className="absolute top-3 right-4 bg-brand text-brand-charcoal text-[7px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
                Popular
              </div>
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">
                  Full Monthly
                </span>
                <h3 className="font-bebas text-2xl text-brand-cream mt-3 mb-4 tracking-wide">FULL ACCESS</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-brand">₹199</span>
                  <span className="text-xs text-brand-cream/40 ml-2">/ month</span>
                </div>
                <ul className="text-[11px] text-brand-cream/75 space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">★</span>
                    <span><strong>Everything</strong> in Video Pass</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Unlimited PDF downloads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>All PYQs (all years)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Unlimited Quizzes & flashcards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Offline access enabled</span>
                  </li>
                </ul>
              </div>

              {!isLoaded ? (
                <div className="w-full h-11 bg-white/5 animate-pulse rounded-full" />
              ) : !isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(5,130,202,0.2)]">
                    Sign in to buy
                  </button>
                </SignInButton>
              ) : (
                <button
                  disabled={loading}
                  onClick={() => handleCheckout("premium_monthly", 19900, "Full Access Monthly")}
                  className="w-full py-3 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(5,130,202,0.2)]"
                >
                  {loading ? "Processing..." : "Get Full Access"}
                </button>
              )}
            </motion.div>

            {/* TIER 4: FULL ACCESS YEARLY */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-panel border-brand-border/40 hover:border-brand-cream/10 p-6 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-brand-cream/60 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                  Best Value
                </span>
                <h3 className="font-bebas text-2xl text-brand-cream mt-3 mb-4 tracking-wide">YEARLY VAULT</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-brand">₹999</span>
                  <span className="text-xs text-brand-cream/40 ml-2">/ 12 months</span>
                </div>
                <ul className="text-[11px] text-brand-cream/75 space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>All Full Access features</span>
                  </li>
                  <li className="flex items-start gap-2 text-brand font-semibold">
                    <span className="shrink-0">✓</span>
                    <span>Save 60% vs. Monthly plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>12 months full availability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>Priority syllabus updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand shrink-0">✓</span>
                    <span>One-time secure checkout</span>
                  </li>
                </ul>
              </div>

              {!isLoaded ? (
                <div className="w-full h-11 bg-white/5 animate-pulse rounded-full" />
              ) : !isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-full border border-brand-border hover:border-brand hover:text-brand font-bold text-[10px] tracking-widest uppercase transition-all">
                    Sign in to buy
                  </button>
                </SignInButton>
              ) : (
                <button
                  disabled={loading}
                  onClick={() => handleCheckout("premium_yearly", 99900, "Yearly Vault")}
                  className="w-full py-3 rounded-full bg-brand-subtle hover:bg-brand/20 text-brand border border-brand/30 font-bold text-[10px] tracking-widest uppercase transition-all"
                >
                  {loading ? "Processing..." : "Select Yearly"}
                </button>
              )}
            </motion.div>
            </div>
          </>
        )}
      </main>

      <footer className="text-center text-[10px] text-brand-cream/30 uppercase tracking-widest font-mono z-20">
        © {new Date().getFullYear()} PharmPaper. Secure payments powered by Razorpay.
      </footer>

      <TrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onActivated={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
