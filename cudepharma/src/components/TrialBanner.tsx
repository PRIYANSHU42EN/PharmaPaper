"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function TrialBanner() {
  const { isSignedIn } = useAuth();
  const [trialData, setTrialData] = useState<any>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setTrialData(null);
      return;
    }

    fetch("/api/trial/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.isTrial) {
          setTrialData(data);
        } else {
          setTrialData(null);
        }
      })
      .catch((err) => console.error("Error fetching trial status:", err));
  }, [isSignedIn]);

  if (!trialData) return null;

  const isExpiringSoon = trialData.daysLeft <= 3;

  return (
    <div
      className={`w-full py-2.5 px-4 text-center text-xs tracking-wider uppercase font-mono border-b transition-all duration-300 z-[90] relative ${
        isExpiringSoon
          ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_2px_10px_rgba(239,68,68,0.05)]"
          : "bg-brand-subtle text-brand border-brand/20 shadow-[0_2px_10px_rgba(142,146,144,0.05)]"
      }`}
    >
      {isExpiringSoon ? (
        <span>⚠️ Premium trial expires in {trialData.daysLeft} day{trialData.daysLeft !== 1 ? "s" : ""}! </span>
      ) : (
        <span>🎓 14-day premium trial active — {trialData.daysLeft} days left. </span>
      )}
      <Link
        href="/pricing"
        className="underline font-bold hover:text-brand-cream transition-colors ml-1"
      >
        Upgrade now →
      </Link>
    </div>
  );
}
