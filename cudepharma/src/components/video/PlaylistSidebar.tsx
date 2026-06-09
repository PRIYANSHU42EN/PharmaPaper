"use client";

import Link from "next/link";

interface PlaylistVideo {
  id: string;
  title: string;
  durationSeconds: number;
  viewCount: number;
  isPremium: boolean;
}

interface PlaylistSidebarProps {
  currentVideoId: string;
  playlistName: string;
  videos: PlaylistVideo[];
}

export default function PlaylistSidebar({ currentVideoId, playlistName, videos }: PlaylistSidebarProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#07080f]/80 backdrop-blur-md rounded-2xl border border-[#0582CA]/15 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-[#0582CA]/10 flex flex-col gap-1">
        <span className="text-[9px] uppercase font-mono tracking-widest text-[#0582CA]">Playlist Context</span>
        <h3 className="text-xs font-bold text-brand-cream truncate uppercase" title={playlistName}>
          {playlistName}
        </h3>
        <span className="text-[9px] font-mono text-brand-cream/40">
          {videos.length} Lectures
        </span>
      </div>

      {/* Videos List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#0582CA]/5 p-2 space-y-1 scrollbar-thin scrollbar-thumb-brand/20">
        {videos.map((vid, idx) => {
          const isActive = vid.id === currentVideoId;
          return (
            <Link
              key={vid.id}
              href={`/videos/${vid.id}`}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-[#0582CA]/10 border border-[#0582CA]/20 text-brand-cream"
                  : "hover:bg-white/5 text-brand-cream/75 hover:text-brand-cream border border-transparent"
              }`}
            >
              {/* Number indicator / Play / Lock status */}
              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-black/40 border border-[#0582CA]/10 flex items-center justify-center text-[10px] font-mono font-bold text-brand-cream/40">
                {isActive ? (
                  <svg className="w-2.5 h-2.5 fill-brand" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : vid.isPremium ? (
                  <svg className="w-2.5 h-2.5 fill-current text-[#0582CA]" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className={`text-[11px] font-semibold leading-snug line-clamp-2 ${isActive ? "text-brand" : ""}`}>
                  {vid.title}
                </span>
                <div className="flex items-center gap-2 text-[9px] text-brand-cream/35 font-mono">
                  <span>⏱ {formatDuration(vid.durationSeconds)}</span>
                  <span>•</span>
                  <span>👁 {vid.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
