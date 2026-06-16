import Link from "next/link";
import { PlayCircle, Clock, Eye, ShieldAlert } from "lucide-react";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    youtube_id: string;
    is_premium: boolean;
    duration_seconds: number;
    view_count: number;
    user_progress: number;
    lecturer?: {
      id: string;
      name: string;
      avatar_url: string;
    };
  };
}

export function VideoCard({ video }: VideoCardProps) {
  const { id, title, youtube_id, is_premium, duration_seconds, view_count, user_progress, lecturer } = video;
  
  const thumbnailUrl = `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg`;
  
  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Format views
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const progressPercent = duration_seconds > 0 ? Math.min(100, (user_progress / duration_seconds) * 100) : 0;

  return (
    <Link href={`/videos/${id}`} className="group flex flex-col gap-3">
      {/* Thumbnail Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden liquid-glass border border-white/5 group-hover:border-brand/30 transition-colors">
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-brand/90 flex items-center justify-center text-white backdrop-blur-md shadow-[0_0_20px_var(--brand)]">
            <PlayCircle className="w-6 h-6 ml-0.5" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {is_premium ? (
            <div className="px-2 py-1 bg-amber-500/90 backdrop-blur-md rounded text-[10px] font-heading font-bold text-black tracking-wider flex items-center gap-1 shadow-lg">
              <ShieldAlert className="w-3 h-3" />
              PRO
            </div>
          ) : (
            <div className="px-2 py-1 bg-success/90 backdrop-blur-md rounded text-[10px] font-heading font-bold text-white tracking-wider shadow-lg">
              FREE
            </div>
          )}
        </div>
        
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-xs font-mono text-white">
          {formatDuration(duration_seconds)}
        </div>

        {/* Progress Bar */}
        {user_progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-brand-light shadow-[0_0_10px_var(--brand-light)]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex gap-3 px-1">
        {lecturer?.avatar_url ? (
          <img 
            src={lecturer.avatar_url} 
            alt={lecturer.name} 
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-surface shrink-0 border border-white/10 flex items-center justify-center text-xs font-mono text-muted">
            {lecturer?.name?.charAt(0) || '?'}
          </div>
        )}
        
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-medium text-text line-clamp-2 leading-snug group-hover:text-brand-light transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted font-mono">
            <span className="truncate">{lecturer?.name || "Unknown Lecturer"}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1 shrink-0">
              <Eye className="w-3.5 h-3.5" />
              {formatViews(view_count)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
