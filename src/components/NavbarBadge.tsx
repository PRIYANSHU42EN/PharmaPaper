"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface StatusResponse {
  isPremium: boolean;
  isTrial: boolean;
  daysLeft: number;
  trialEnd: string | null;
  level: string; // "free" | "trial" | "premium" | "video_only"
  canWatchVideos: boolean;
}

export default function NavbarBadge() {
  const { isSignedIn } = useAuth();
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setStatus(null);
      return;
    }

    const fetchStatus = () => {
      fetch("/api/trial/status")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch status");
        })
        .then((data: StatusResponse) => {
          setStatus(data);
        })
        .catch((err) => console.error("Error fetching navbar status:", err));
    };

    fetchStatus();
    // Poll status every 30 seconds to update in case of real-time upgrades
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  // If not signed in, show nothing or default free
  if (!isSignedIn) return null;

  const level = status?.level || "free";
  const daysLeft = status?.daysLeft ?? 0;
  const isTrial = status?.isTrial ?? false;

  let text = "FREE";
  let badgeStyles = "bg-white/[0.02] text-[#888888] border-white/5";
  let showPulse = false;

  if (level === "premium" || level === "video_only") {
    text = "PRO";
    badgeStyles = "bg-white/10 text-white border-white/20";
  } else if (isTrial && level === "trial") {
    if (daysLeft <= 3) {
      text = `EXPIRES SOON (${daysLeft}d)`;
      badgeStyles = "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse";
    } else {
      text = `TRIAL ${daysLeft}d`;
      badgeStyles = "bg-white/5 text-[#888888] border-white/10";
      showPulse = true;
    }
  } else if (level === "free") {
    text = "FREE";
    badgeStyles = "bg-white/[0.02] text-[#888888] border-white/5";
  }

  return (
    <span className={`px-3 py-1 rounded-full border text-[10px] font-mono font-extrabold tracking-wider uppercase inline-flex items-center gap-1.5 transition-all duration-300 ${badgeStyles}`}>
      {showPulse && <span className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-pulse" />}
      {text}
    </span>
  );
}
