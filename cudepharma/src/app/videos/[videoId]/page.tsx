"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";
import VideoInfo from "@/components/video/VideoInfo";
import PlaylistSidebar from "@/components/video/PlaylistSidebar";
import VideoTabs from "@/components/video/VideoTabs";

export default function VideoWatchPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = use(params);
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // Page States
  const [videoData, setVideoData] = useState<any>(null);
  const [lecturerData, setLecturerData] = useState<any>(null);
  const [playlistData, setPlaylistData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [userHasAccess, setUserHasAccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync state between components
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTrigger, setSeekTrigger] = useState<{ time: number } | null>(null);

  // Fetch video details on mount or ID change
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const fetchVideoDetails = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Lecture video not found");
          }
          throw new Error("Failed to load lecture details");
        }
        const data = await res.json();

        if (active) {
          setVideoData(data.video);
          setLecturerData(data.lecturer);
          setPlaylistData(data.playlist || []);
          setProgressData(data.progress);
          setHasLiked(data.hasLiked);
          setUserHasAccess(data.userHasAccess);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "An error occurred");
          setLoading(false);
        }
      }
    };

    fetchVideoDetails();

    return () => {
      active = false;
    };
  }, [videoId]);

  // Handle Playback progress saving
  const handleProgress = async (seconds: number) => {
    setCurrentTime(seconds);
    if (!isSignedIn) return;

    try {
      await fetch("/api/videos/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          positionSeconds: Math.floor(seconds),
          completed: false,
        }),
      });
    } catch (e) {
      // ignore network errors for progress tracking background tasks
    }
  };

  // Handle Playback completion
  const handleComplete = async () => {
    if (!isSignedIn) return;

    try {
      await fetch("/api/videos/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          positionSeconds: videoData?.durationSeconds || 0,
          completed: true,
        }),
      });
    } catch (e) {
      // ignore
    }
  };

  // Handle Seek triggering from tabs
  const handleSeek = (seconds: number) => {
    setSeekTrigger({ time: seconds });
  };

  if (loading) {
    return <VideoWatchSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-brand-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-4 text-red-500">
          ⚠️
        </div>
        <h2 className="font-bebas text-3xl uppercase tracking-wider mb-2">Error Loading Lecture</h2>
        <p className="text-xs text-brand-cream/50 max-w-xs mb-6 font-mono">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-full border border-brand-border text-brand-cream/80 hover:text-brand transition-colors text-xs font-mono"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const backUrl = `/subject?name=${encodeURIComponent(videoData.subject)}&sem=sem${videoData.semester}&type=${videoData.course.toLowerCase() === "d.pharm" ? "dpharm" : "bpharm"}`;

  return (
    <div className="relative w-full min-h-screen bg-[#0f0f0f] text-brand-cream selection:bg-brand selection:text-white pb-16">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.04]" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none opacity-[0.02]" />

      {/* Navbar with back link to subject syllabus */}
      <header className="sticky top-0 w-full h-16 glass-panel border-b border-brand-border/40 flex items-center justify-between px-6 md:px-12 z-50 backdrop-blur-md bg-brand-charcoal/80">
        <Link href={backUrl} className="flex items-center gap-2 group text-brand-cream/70 hover:text-brand transition-colors">
          <span className="text-base group-hover:-translate-x-0.5 transition-transform">←</span>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">
            Back to {videoData.subject} Syllabus
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <span className="text-[9px] uppercase tracking-widest text-brand bg-brand/5 border border-brand/20 rounded-full px-3 py-1 font-mono">
            {videoData.course} • Sem {videoData.semester}
          </span>
        </div>
      </header>

      {/* Theater Mode Default Player Row */}
      <div className="w-full bg-black py-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SecureVideoPlayer
            videoId={videoId}
            youtubeId={videoData.youtubeId}
            isPremium={videoData.isPremium}
            freePreviewSeconds={videoData.freePreviewSeconds}
            userHasAccess={userHasAccess}
            lastPosition={progressData?.last_position || 0}
            onProgress={handleProgress}
            onComplete={handleComplete}
            seekTrigger={seekTrigger}
          />
        </div>
      </div>

      {/* Content Columns: Title, Tabs and Playlist */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Info & Lecture Study Tabs */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <VideoInfo
            videoId={videoId}
            title={videoData.title}
            subject={videoData.subject}
            course={videoData.course}
            semester={videoData.semester}
            viewCount={videoData.viewCount}
            likeCount={videoData.likeCount}
            hasLiked={hasLiked}
            createdAt={videoData.createdAt}
            lecturer={lecturerData}
          />

          <VideoTabs
            videoId={videoId}
            notesMarkdown={videoData.notes || ""}
            subject={videoData.subject}
            course={videoData.course}
            semester={videoData.semester}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
        </section>

        {/* Right Column: Playlist Navigation */}
        <section className="lg:col-span-4 h-fit lg:sticky lg:top-24">
          <PlaylistSidebar
            currentVideoId={videoId}
            playlistName={videoData.playlistName}
            videos={playlistData}
          />
        </section>
      </main>
    </div>
  );
}

// Sleek Shimmer Skeleton Loader matching brand aesthetic
function VideoWatchSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-16 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-white/5 bg-white/20 flex items-center justify-between px-6 md:px-12" />

      {/* Player Skeleton */}
      <div className="w-full bg-black/60 py-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-2xl" />
        </div>
      </div>

      {/* Grid Content Skeletons */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Info skeleton */}
          <div className="h-32 bg-white/5 border border-white/10 rounded-2xl" />
          {/* Tabs skeleton */}
          <div className="h-96 bg-white/5 border border-white/10 rounded-2xl" />
        </div>
        <div className="lg:col-span-4">
          {/* Sidebar skeleton */}
          <div className="h-80 bg-white/5 border border-white/10 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
