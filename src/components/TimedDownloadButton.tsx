"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, CheckCircle2, Clock, FileText, AlertCircle, ExternalLink } from "lucide-react";
import { logDownload } from "@/lib/supabase";

// ── Non-negotiable Constants per skill.md Rule 2 ───────────────────────────
const MIN_WAIT = 5;  // seconds
const MAX_WAIT = 10; // seconds

interface TimedDownloadButtonProps {
  unitId: string;
  unitTitle: string;
  fileUrl: string;
  fileName: string;
  fileSizeKb?: number;
}

type ButtonState = "idle" | "counting" | "ready" | "downloaded";

export default function TimedDownloadButton({
  unitId,
  unitTitle,
  fileUrl,
  fileName,
  fileSizeKb,
}: TimedDownloadButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [countdown, setCountdown] = useState<number>(0);
  const [initialWait, setInitialWait] = useState<number>(MIN_WAIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleStartCountdown() {
    if (state !== "idle") return;

    // Randomize duration between MIN_WAIT (5) and MAX_WAIT (10) inclusive per Rule 2
    const duration = Math.floor(Math.random() * (MAX_WAIT - MIN_WAIT + 1)) + MIN_WAIT;
    setInitialWait(duration);
    setCountdown(duration);
    setState("counting");

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setState("ready");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleFinalDownload() {
    if (state !== "ready" && state !== "downloaded") return;

    // Record in download_logs analytics table
    try {
      await logDownload(unitId);
    } catch (e) {
      console.error("Failed to log download", e);
    }

    setState("downloaded");

    // Open file URL safely
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  // Calculate percentage of circular countdown
  const progress = initialWait > 0 ? ((initialWait - countdown) / initialWait) * 100 : 100;
  const strokeDashoffset = 100 - progress;

  return (
    <div className="w-full max-w-md mx-auto my-6">
      {/* File Details Tag */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1 font-mono">
        <span className="flex items-center gap-1.5 truncate max-w-[240px]">
          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{fileName}</span>
        </span>
        {fileSizeKb && (
          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold shrink-0">
            {(fileSizeKb / 1024).toFixed(1)} MB
          </span>
        )}
      </div>

      {/* Button Footprint Wrapper (No layout shifts per design.md) */}
      <div className="min-h-[72px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* 1. IDLE STATE */}
          {state === "idle" && (
            <motion.button
              key="idle"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={handleStartCountdown}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
              aria-label={`Start preparation to download ${unitTitle} PDF`}
            >
              <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Download PDF Notes</span>
            </motion.button>
          )}

          {/* 2. COUNTING STATE */}
          {state === "counting" && (
            <motion.div
              key="counting"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full py-3.5 px-6 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-between border border-slate-800"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                {/* Circular Mini Progress Ring */}
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="w-9 h-9 transform -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-slate-800"
                      fill="none"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-[#FBC02D] transition-all duration-1000"
                      fill="none"
                      strokeDasharray="88"
                      strokeDashoffset={((88 * countdown) / initialWait).toFixed(1)}
                    />
                  </svg>
                  <span className="absolute font-mono font-extrabold text-xs text-white">
                    {countdown}
                  </span>
                </div>

                <div className="text-left">
                  <div className="font-bold text-sm text-white">Preparing your download…</div>
                  <div className="text-[11px] text-slate-400">Verifying high-speed cloud link</div>
                </div>
              </div>

              <Clock className="w-5 h-5 text-amber-400 animate-spin" />
            </motion.div>
          )}

          {/* 3. READY STATE */}
          {(state === "ready" || state === "downloaded") && (
            <motion.button
              key="ready"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={handleFinalDownload}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 animate-pulse cursor-pointer"
              aria-label={`Download ${unitTitle} PDF`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{state === "downloaded" ? "Download Again" : "Download Now"}</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-2">
        Instant, virus-scanned PDF hosted on high-availability cloud storage.
      </p>
    </div>
  );
}
