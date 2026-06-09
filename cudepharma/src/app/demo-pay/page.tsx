"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import Script from "next/script";

export default function DemoPayPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "failed" | "cancelled">("idle");
  const [errorDetails, setErrorDetails] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const triggerDemoPayment = async () => {
    if (!isSignedIn) return;
    
    setLoading(true);
    setStatus("idle");
    setErrorDetails("");
    setPaymentId("");

    try {
      // Create a 1 INR (100 paise) order
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 100, // 100 paise = 1 INR
          currency: "INR",
          plan_type: "premium_onetime",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create order");
      }

      const { order_id } = await response.json();

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error("Razorpay Key ID environment variable is not defined on the client.");
      }

      const options = {
        key: keyId,
        amount: 100,
        currency: "INR",
        name: "PharmPaper Demo",
        description: "Test Demo Payment of ₹1",
        order_id: order_id,
        handler: async function (res: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                plan_type: "premium_onetime",
                amount: 100,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setStatus("success");
              setPaymentId(res.razorpay_payment_id);
            } else {
              setStatus("failed");
              setErrorDetails(verifyData.error || "Verification failed");
            }
          } catch (err: any) {
            setStatus("failed");
            setErrorDetails(err.message || "Failed to verify payment signature");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.fullName || "Demo User",
          email: user?.primaryEmailAddress?.emailAddress || "demo@example.com",
        },
        theme: {
          color: "#0582CA",
        },
        modal: {
          ondismiss: function () {
            setStatus("cancelled");
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setStatus("failed");
        setErrorDetails(response.error.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorDetails(err.message || "Failed to launch Razorpay checkout");
      setStatus("failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-charcoal text-brand-cream relative overflow-hidden flex flex-col justify-between items-center pb-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Background radial light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] ambient-brand-glow pointer-events-none opacity-[0.08]" />

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

      <main className="flex-1 flex items-center justify-center w-full px-6 z-20">
        <div className="glass-panel border-brand-border max-w-md w-full p-8 rounded-3xl text-center flex flex-col items-center">
          <span className="px-3 py-1 rounded-full bg-brand-subtle border border-brand/30 text-[9px] uppercase tracking-widest font-mono text-brand mb-6">
            Sandbox Environment
          </span>

          <h1 className="font-bebas text-4xl text-brand-cream uppercase tracking-wide leading-none mb-4">
            Razorpay Demo <span className="text-brand">Checkout</span>
          </h1>

          <p className="text-xs text-brand-cream/60 leading-relaxed mb-8">
            Click the button below to test the standard Razorpay checkout flow with a mock transaction of ₹1 (100 paise).
          </p>

          {/* Payment Status Alerts */}
          {status === "success" && (
            <div className="w-full mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
              <p className="font-bold uppercase mb-1">🎉 Payment Success!</p>
              <p className="text-[10px] text-green-300 font-mono">ID: {paymentId}</p>
            </div>
          )}

          {status === "failed" && (
            <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <p className="font-bold uppercase mb-1">✕ Payment Failed</p>
              <p className="text-[10px] text-red-300 font-mono">{errorDetails}</p>
            </div>
          )}

          {status === "cancelled" && (
            <div className="w-full mb-6 p-4 rounded-xl bg-brand-charcoal border border-brand-border text-brand-cream/60 text-xs">
              <p className="uppercase font-bold">Transaction Cancelled</p>
            </div>
          )}

          {!isLoaded ? (
            <div className="w-full h-12 bg-brand-charcoal animate-pulse rounded-full" />
          ) : !isSignedIn ? (
            <SignInButton mode="modal">
              <button className="w-full py-3.5 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(5,130,202,0.25)]">
                Sign in to pay
              </button>
            </SignInButton>
          ) : (
            <button
              disabled={loading}
              onClick={triggerDemoPayment}
              className={`w-full py-3.5 rounded-full font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(5,130,202,0.25)] ${
                loading
                  ? "bg-brand-charcoal text-brand-cream/30 border border-brand-border cursor-not-allowed"
                  : "bg-brand hover:bg-brand-dark text-brand-charcoal hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              }`}
            >
              {loading ? "Launching Gateway..." : "Test ₹1 Payment"}
            </button>
          )}

          <div className="mt-8 flex gap-4 text-[9px] text-brand-cream/30 uppercase tracking-widest font-mono">
            <span>💳 Test Cards Permitted</span>
            <span>⚡ instant verify</span>
          </div>
        </div>
      </main>

      <footer className="text-center text-[10px] text-brand-cream/30 uppercase tracking-widest font-mono">
        PHARMPAPER Sandbox Portal
      </footer>
    </div>
  );
}
