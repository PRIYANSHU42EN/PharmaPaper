"use client";

import React from "react";
import Link from "next/link";

interface Lecturer {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  is_premium: boolean;
  duration_seconds: number;
  view_count: number;
  created_at: string;
  course: string;
  semester: number;
  subject: string;
  lecturer?: Lecturer | null;
}

interface VideoCardProps {
  video: Video;
  progress?: {
    last_position: number;
    completed: boolean;
  } | null;
  hasVideoAccess?: boolean;
}

export default function VideoCard({ video, progress, hasVideoAccess = false }: VideoCardProps) {
  const isLocked = video.is_premium && !hasVideoAccess;
  const thumbnail = `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`;

  // Format helper for duration (e.g., 3600 -> "1:00:00", 125 -> "02:05")
  const formatDuration = (secs: number) => {
    if (!secs) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const mStr = String(m).padStart(2, "0");
    const sStr = String(s).padStart(2, "0");
    
    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  };

  // Format helper for relative time (e.g., "3 days ago")
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    if (diffMins > 0) {
      return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  // Calculate watch percentage
  const watchPercent = progress && video.duration_seconds
    ? Math.min(Math.round((progress.last_position / video.duration_seconds) * 100), 100)
    : 0;

  return (
    <div className="group flex flex-col glass-panel border border-brand-border/40 hover:border-brand/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-brand/5 transition-all duration-350 select-none">
      {/* Thumbnail Container */}
      <Link href={`/videos/${video.id}`} className="relative aspect-video w-full bg-brand-charcoal overflow-hidden block">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {video.is_premium ? (
            <span className="text-[8px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-amber-500/90 text-black shadow-md flex items-center gap-1">
              👑 Premium
            </span>
          ) : (
            <span className="text-[8px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-emerald-500/90 text-white shadow-md">
              Free
            </span>
          )}
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-[2px] text-[9px] font-bold font-mono text-brand-cream/90 shadow">
          {formatDuration(video.duration_seconds)}
        </div>

        {/* Lock Overlay for Premium Gating */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2.5px] flex flex-col items-center justify-center gap-2 z-20 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-brand-charcoal/80 border border-brand-border flex items-center justify-center text-amber-400 shadow-lg group-hover:scale-105 transition-transform duration-300">
              🔒
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-amber-400">
              Subscribe to unlock
            </span>
          </div>
        )}

        {/* Watch Progress Bar */}
        {watchPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-charcoal/60 z-10">
            <div 
              className="h-full bg-brand"
              style={{ width: `${watchPercent}%` }}
            />
          </div>
        )}
      </Link>

      {/* Meta Content */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        {/* Title */}
        <Link href={`/videos/${video.id}`} className="block group/title">
          <h3 className="text-xs font-bold text-white font-mono leading-snug line-clamp-2 group-hover/title:text-brand transition-colors">
            {video.title}
          </h3>
        </Link>

        {/* Author & Stats footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-brand-border/20">
          {video.lecturer ? (
            <Link 
              href={`/lecturer/${video.lecturer.id}`}
              className="flex items-center gap-2 max-w-[60%] hover:text-brand transition-colors group/lecturer"
            >
              {video.lecturer.avatar_url ? (
                <img
                  src={video.lecturer.avatar_url}
                  alt={video.lecturer.name}
                  className="w-5 h-5 rounded-full object-cover border border-brand-border/50 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-brand-gray border border-brand-border/50 flex items-center justify-center text-[9px] font-mono font-bold text-brand uppercase shrink-0">
                  {video.lecturer.name.charAt(0)}
                </div>
              )}
              <span className="text-[10px] font-mono text-brand-cream/70 truncate group-hover/lecturer:text-brand">
                {video.lecturer.name}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-brand-gray border border-brand-border/50 flex items-center justify-center text-[9px] font-mono text-brand-cream/40">
                👤
              </div>
              <span className="text-[10px] font-mono text-brand-cream/40">PharmPaper</span>
            </div>
          )}

          {/* Stats details */}
          <div className="flex items-center gap-1.5 text-[9px] text-brand-cream/45 font-mono">
            <span>{video.view_count.toLocaleString()} views</span>
            <span>•</span>
            <span>{formatTimeAgo(video.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
