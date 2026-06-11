"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import VideoUpgradeOverlay from "./VideoUpgradeOverlay";

// Dynamically import ReactPlayer to prevent SSR hydration mismatch
const ReactPlayer = dynamic<any>(() => import("react-player"), {
  ssr: false,
});

interface VideoPlayerProps {
  videoId: string;
  youtubeId: string;
  isPremium: boolean;
  freePreviewSeconds: number; // default 120
  userHasAccess: boolean;
  lastPosition?: number;
  onProgress: (seconds: number) => void;
  onComplete: () => void;
  seekTrigger?: { time: number } | null;
}

export default function SecureVideoPlayer({
  videoId,
  youtubeId,
  isPremium,
  freePreviewSeconds = 120,
  userHasAccess,
  lastPosition = 0,
  onProgress,
  onComplete,
  seekTrigger = null,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const lastProgressSavedTimeRef = useRef<number>(Date.now());

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(isPremium && !userHasAccess);

  // Resume Banner states
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);

  // Activity timer for controls auto-hide
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent keyboard space conflict when user is typing in forms
  const isTypingRef = useRef(false);

  // Sync typing reference
  useEffect(() => {
    const handleFocus = (e: any) => {
      const tag = e.target.tagName;
      isTypingRef.current = tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
    };
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  // Show resume banner if we have a valid lastPosition
  useEffect(() => {
    if (lastPosition > 30) {
      setResumeTime(lastPosition);
      setShowResumeBanner(true);
    }
  }, [lastPosition]);

  // Resume banner auto-dismiss / auto-resume
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showResumeBanner) {
      timeout = setTimeout(() => {
        handleResume();
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showResumeBanner, resumeTime]);

  // Keyboard Shortcuts (Space to play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isLocked]);

  // Handle external seek events
  useEffect(() => {
    if (seekTrigger && playerRef.current) {
      handleSeek(seekTrigger.time);
    }
  }, [seekTrigger]);

  // Auto-hide controls handler
  useEffect(() => {
    resetControlsTimer();
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isPlaying]);

  // Interaction handlers
  function togglePlay() {
    if (isLocked) return;
    if (isPlaying) {
      setIsPlaying(false);
      onProgress(currentTime);
    } else {
      if (isPremium && !userHasAccess && currentTime >= freePreviewSeconds) {
        setIsLocked(true);
        return;
      }
      setIsPlaying(true);
    }
  }

  function handleSeek(seconds: number) {
    let targetTime = Math.max(0, Math.min(duration, seconds));

    // Limit seek for non-premium
    if (isPremium && !userHasAccess && targetTime > freePreviewSeconds) {
      targetTime = freePreviewSeconds;
      setIsLocked(true);
      setIsPlaying(false);
    }

    if (playerRef.current) {
      playerRef.current.seekTo(targetTime, "seconds");
    }
    setCurrentTime(targetTime);
    onProgress(targetTime);
  }

  function handleProgressBarClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isLocked || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    handleSeek(pos * duration);
  }

  function changeVolume(val: number) {
    const v = Math.max(0, Math.min(1, val));
    setVolume(v);
    setIsMuted(v === 0);
  }

  function toggleMute() {
    setIsMuted(!isMuted);
  }

  function handleSpeedChange(rate: number) {
    setPlaybackRate(rate);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error trying to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }

  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }

  // Seek ±10s on double-tap
  const doubleTapTimerRef = useRef<{ time: number; x: number } | null>(null);

  function handleVideoTouch(e: React.TouchEvent<HTMLDivElement>) {
    resetControlsTimer();
    const now = Date.now();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;

    if (doubleTapTimerRef.current && now - doubleTapTimerRef.current.time < 300) {
      const isRight = touchX > rect.width / 2;
      if (isRight) {
        handleSeek(currentTime + 10);
      } else {
        handleSeek(currentTime - 10);
      }
      doubleTapTimerRef.current = null;
    } else {
      doubleTapTimerRef.current = { time: now, x: touchX };
    }
  }

  function handleResume() {
    setShowResumeBanner(false);
    if (resumeTime > 0) {
      if (playerRef.current) {
        playerRef.current.seekTo(resumeTime, "seconds");
      }
      setCurrentTime(resumeTime);
      setIsPlaying(true);
    }
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // ReactPlayer progress callback
  const handleProgressCallback = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    const time = state.playedSeconds;
    setCurrentTime(time);
    setBuffered(state.loadedSeconds);

    // Premium Lock Logic:
    // If isPremium AND userHasAccess = false: Allow playback until freePreviewSeconds
    if (isPremium && !userHasAccess && time >= freePreviewSeconds) {
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.seekTo(freePreviewSeconds, "seconds");
      }
      setCurrentTime(freePreviewSeconds);
      setIsLocked(true);
      return;
    }

    // Check if complete (>90%)
    if (duration > 0 && time / duration >= 0.9) {
      onComplete();
    }

    // Save progress to database every 15 seconds
    const now = Date.now();
    if (now - lastProgressSavedTimeRef.current >= 15000) {
      onProgress(time);
      lastProgressSavedTimeRef.current = now;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group border border-[#0582CA]/20 shadow-xl select-none"
      style={{ touchAction: "manipulation" }}
    >
      {/* 1. ReactPlayer Element */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {youtubeId && (
          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            controls={false}
            progressInterval={250}
            onProgress={handleProgressCallback}
            onDuration={setDuration}
            onEnded={() => {
              setIsPlaying(false);
              onComplete();
            }}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3,
                  disablekb: 1,
                  fs: 0,
                  playsinline: 1,
                },
              },
            }}
          />
        )}
      </div>

      {/* 2. Transparent overlay to capture clicks and touch events */}
      <div
        onClick={togglePlay}
        onTouchStart={handleVideoTouch}
        className="absolute inset-0 w-full h-full cursor-pointer z-10"
      />

      {/* 3. Resume Banner */}
      {showResumeBanner && (
        <div className="absolute top-4 left-4 right-4 z-30 glass-panel border-[#0582CA]/30 rounded-xl p-4 flex items-center justify-between animate-fade-in bg-black/80 backdrop-blur-md">
          <p className="text-xs text-brand-cream/90 font-medium">
            Resume watching from <span className="text-brand font-semibold">{formatTime(resumeTime)}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleResume}
              className="px-4 py-1.5 rounded-full bg-brand text-[#07080f] font-semibold text-[10px] uppercase tracking-wider hover:bg-brand-light transition-all cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={() => setShowResumeBanner(false)}
              className="px-4 py-1.5 rounded-full border border-brand-border text-brand-cream/70 hover:text-brand-cream font-semibold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* 4. Custom Control Bar Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/95 to-black/0 transition-opacity duration-300 flex flex-col gap-3 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Track */}
        <div className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer group/progress" onClick={handleProgressBarClick}>
          {/* Buffered level */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/10 rounded-full"
            style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
          />
          {/* Current watched level */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-brand rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-brand rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity animate-pulse"
            style={{ left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 7px)` }}
          />
        </div>

        {/* Lower Row Controls */}
        <div className="flex items-center justify-between text-xs text-brand-cream/80">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button onClick={togglePlay} className="text-brand hover:text-brand-light transition-colors text-base p-1 cursor-pointer">
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <span className="font-mono text-[11px] tracking-wide">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume controls */}
            <div className="flex items-center gap-1.5 group/volume">
              <button onClick={toggleMute} className="hover:text-brand transition-colors p-1 cursor-pointer">
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM19 12c0 3.28-1.95 6.1-4.78 7.37L15 20.73C18.6 19.36 21 15.97 21 12s-2.4-7.36-6-8.73l-.78 1.36C17.05 5.9 19 8.72 19 12zM3 9v6h4l5 5V4L7 9H3z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-16 h-1 rounded-full bg-white/20 appearance-none accent-brand cursor-pointer transition-all focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    playbackRate === rate ? "bg-brand text-[#07080f]" : "hover:text-brand text-brand-cream/60"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Custom Fullscreen */}
            <button onClick={toggleFullscreen} className="hover:text-brand transition-colors p-1 cursor-pointer">
              {isFullscreen ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Premium Lock & Upgrade Overlay */}
      {isLocked && (
        <VideoUpgradeOverlay
          isOpen={true}
          onClose={() => {
            setIsLocked(false);
            handleSeek(0);
          }}
        />
      )}
    </div>
  );
}
