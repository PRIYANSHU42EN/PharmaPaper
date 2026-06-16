import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";
import VideoCard from "@/components/video/VideoCard";

// Set ISR Revalidation limit to 5 minutes
export const revalidate = 300;

// Setup server-side Supabase client with bypass key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function SubjectVideosPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const subjectId = resolvedParams.subjectId;
  const typeFilter = resolvedSearchParams.type || "all";

  // 1. Fetch Subject info
  const { data: subjectData } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .maybeSingle();

  if (!subjectData) {
    return notFound();
  }

  // 2. Fetch all published videos belonging to this subject
  const { data: videosData } = await supabase
    .from("videos")
    .select(`
      *,
      lecturer:lecturers (
        id,
        name,
        avatar_url
      )
    `)
    .eq("subject", subjectData.name)
    .eq("is_published", true)
    .order("playlist_order", { ascending: true });

  const allVideos = videosData || [];

  // 3. Get User auth & premium status
  const { userId } = await auth();
  const { canWatchVideos: hasVideoAccess } = await checkUserPremiumStatus(userId);

  // 4. Fetch User watch progress for these videos
  const videoIds = allVideos.map((v: any) => v.id);
  const userProgress: Record<string, { last_position: number; completed: boolean }> = {};

  if (userId && videoIds.length > 0) {
    const { data: views } = await supabase
      .from("video_views")
      .select("video_id, last_position, completed")
      .eq("user_id", userId)
      .in("video_id", videoIds);

    (views || []).forEach((v: any) => {
      userProgress[v.video_id] = {
        last_position: v.last_position,
        completed: v.completed,
      };
    });
  }

  // 5. Group videos and calculate progress per unit (Units 1 to 5)
  const units = [1, 2, 3, 4, 5];
  const unitStats = units.map((unitNum) => {
    // Filter videos for this unit
    const unitVideos = allVideos.filter((v: any) => (v.unit || 1) === unitNum);
    
    // Filtered videos based on the free/all option
    const displayedVideos = typeFilter === "free" 
      ? unitVideos.filter((v: any) => !v.is_premium)
      : unitVideos;

    // Calculate watched percentages
    let totalDuration = 0;
    let totalWatched = 0;

    unitVideos.forEach((v: any) => {
      totalDuration += v.duration_seconds || 0;
      const prog = userProgress[v.id];
      if (prog) {
        if (prog.completed) {
          totalWatched += v.duration_seconds || 0;
        } else {
          totalWatched += prog.last_position || 0;
        }
      }
    });

    const percentWatched = totalDuration > 0 
      ? Math.min(Math.round((totalWatched / totalDuration) * 100), 100) 
      : 0;

    return {
      number: unitNum,
      videos: displayedVideos,
      totalCount: unitVideos.length,
      percentWatched,
      totalDuration,
      totalWatched,
    };
  });

  // Format helper for duration text (e.g. "45m watched")
  const formatDurationText = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0f0f0f] text-brand-cream pb-20 px-4 md:px-8 lg:px-16 pt-8">
      {/* Ambients */}
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] ambient-brand-glow pointer-events-none opacity-[0.03]" />
      <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] ambient-brand-glow pointer-events-none opacity-[0.01]" />

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Navigation Breadcrumb */}
        <Link 
          href="/videos" 
          className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-cream/50 hover:text-brand transition-colors w-fit"
        >
          ← Back to Vault
        </Link>

        {/* Header Metadata */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-border/20 pb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-brand/10 border border-brand/20 text-brand px-2.5 py-0.5 rounded">
                Sem {subjectData.semester_number} Subject
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-white leading-tight">
              {subjectData.name}
            </h1>
          </div>

          {/* Filtering Controls */}
          <div className="flex items-center bg-brand-charcoal border border-brand-border/40 rounded-xl p-1 shrink-0 self-start md:self-auto shadow-md">
            <Link
              href="?type=all"
              replace
              className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
                typeFilter === "all"
                  ? "bg-brand text-black"
                  : "text-brand-cream/60 hover:text-brand-cream"
              }`}
            >
              All Lectures
            </Link>
            <Link
              href="?type=free"
              replace
              className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
                typeFilter === "free"
                  ? "bg-brand text-black"
                  : "text-brand-cream/60 hover:text-brand-cream"
              }`}
            >
              Free Previews
            </Link>
          </div>
        </div>

        {/* Units Syllabus Map */}
        <div className="flex flex-col gap-8">
          {unitStats.map((unit) => {
            // Skip rendering units with no videos in general
            if (unit.totalCount === 0) return null;

            return (
              <div 
                key={unit.number} 
                className="p-6 glass-panel border border-brand-border/30 rounded-2xl flex flex-col gap-6 shadow-md"
              >
                {/* Unit Header with Progress Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/15 pb-4">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Unit {unit.number} Lectures
                    </h2>
                    <span className="text-[9px] font-mono text-brand-cream/40 uppercase tracking-widest">
                      Syllabus core topic series
                    </span>
                  </div>

                  {/* Watched Progress Indicator */}
                  {userId && unit.totalDuration > 0 && (
                    <div className="flex items-center gap-4 shrink-0 min-w-[200px] bg-brand-gray/30 border border-brand-border/30 rounded-xl px-4 py-2">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-brand-cream/55 uppercase tracking-wider">Watch Progress</span>
                          <span className="text-brand font-bold">{unit.percentWatched}%</span>
                        </div>
                        {/* Progress line */}
                        <div className="h-1 bg-brand-charcoal rounded-full overflow-hidden w-full">
                          <div 
                            className="h-full bg-brand transition-all duration-500"
                            style={{ width: `${unit.percentWatched}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-brand-cream/35">
                          {formatDurationText(unit.totalWatched)} / {formatDurationText(unit.totalDuration)} watched
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Videos Grid */}
                {unit.videos.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[10px] font-mono uppercase text-brand-cream/35 tracking-wider">
                      No matching lectures listed in this unit
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {unit.videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        progress={userProgress[video.id]}
                        hasVideoAccess={hasVideoAccess}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Fallback if no lectures exist at all */}
          {allVideos.length === 0 && (
            <div className="py-24 text-center glass-panel border border-brand-border/40 rounded-2xl flex flex-col items-center gap-3">
              <span className="text-3xl">📭</span>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">No lectures available</h3>
              <p className="text-xs font-mono uppercase text-brand-cream/35 tracking-wider max-w-xs leading-relaxed">
                Lecturers haven't published video lectures for this subject yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
