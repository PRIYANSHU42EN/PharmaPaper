"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
  lecturerId: string;
  initialIsSubscribed: boolean;
  initialSubscriberCount: number;
}

export default function SubscribeButton({
  lecturerId,
  initialIsSubscribed,
  initialSubscriberCount,
}: SubscribeButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [subscriberCount, setSubscriberCount] = useState(initialSubscriberCount);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      // Direct unauthorized users to Clerk sign-in
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lecturer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecturerId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(data.subscribed);
        setSubscriberCount(data.subscriberCount);
      }
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest shadow-md transition-all ${
          isSubscribed
            ? "border border-brand-border text-brand-cream/60 bg-brand-gray/30 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 group"
            : "bg-brand hover:bg-brand/90 text-black"
        } disabled:opacity-50`}
      >
        {loading ? (
          <span>Updating...</span>
        ) : isSubscribed ? (
          <span className="flex items-center gap-1">
            <span className="inline group-hover:hidden">✓ Subscribed</span>
            <span className="hidden group-hover:inline">Unsubscribe</span>
          </span>
        ) : (
          <span>🔔 Subscribe</span>
        )}
      </button>

      <div className="flex flex-col font-mono">
        <span className="text-[11px] font-bold text-white leading-none">
          {subscriberCount.toLocaleString()}
        </span>
        <span className="text-[8px] uppercase tracking-wider text-brand-cream/35 mt-0.5">
          Subscribers
        </span>
      </div>
    </div>
  );
}
