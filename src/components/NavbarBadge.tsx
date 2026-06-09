"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function NavbarBadge() {
  const { isSignedIn } = useAuth();
  const [level, setLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLevel(null);
      return;
    }

    const fetchStatus = () => {
      fetch("/api/trial/status")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch status");
        })
        .then((data) => {
          if (data && data.level) {
            setLevel(data.level);
          }
        })
        .catch((err) => console.error("Error fetching navbar status:", err));
    };

    fetchStatus();
    // Poll status every 30 seconds to update in case of real-time upgrades
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn]);

  if (!level || level === "free" || level === "none") return null;

  let text = "";
  let badgeStyles = "";

  if (level === "trial") {
    text = "Trial";
    badgeStyles = "bg-brand/10 text-brand border-brand/30";
  } else if (level === "video_only") {
    text = "Video";
    badgeStyles = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  } else if (level === "premium") {
    text = "Pro";
    badgeStyles = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-extrabold tracking-wider uppercase inline-flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${badgeStyles}`}>
      <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
      {text}
    </span>
  );
}
