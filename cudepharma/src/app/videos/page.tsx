import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";
import FilterBar from "@/components/video/FilterBar";
import VideoCard from "@/components/video/VideoCard";

// Set ISR Revalidation limit to 5 minutes
export const revalidate = 300;

// Setup server-side Supabase client with bypass key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function VideoVaultPage({
  searchParams,
}: {
  searchParams: Promise<{
    course?: string;
    semester?: string;
    subject?: string;
    duration?: string;
    type?: string;
    sort?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const course = resolvedParams.course || "All";
  const semester = resolvedParams.semester || "All";
  const subject = resolvedParams.subject || "All";
  const duration = resolvedParams.duration || "All";
  const type = resolvedParams.type || "All";
  const sort = resolvedParams.sort || "latest";

  // Check if any filters are active
  const isFiltered =
    course !== "All" ||
    semester !== "All" ||
    subject !== "All" ||
    duration !== "All" ||
    type !== "All" ||
    sort !== "latest";

  // 1. Get Clerk user details & premium status
  const { userId } = await auth();
  const { canWatchVideos: hasVideoAccess } = await checkUserPremiumStatus(userId);

  // 2. Fetch all subjects for FilterBar dropdown
  const { data: subjectsData } = await supabase
    .from("subjects")
    .select(`
      id,
      name,
      semester_number,
      course:courses (
        code
      )
    `);

  const subjectsList = (subjectsData || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    course_code: s.course?.code || "",
    semester_number: s.semester_number,
  }));

  // 3. Fetch Continue Watching progress if logged in
  let continueWatching: any[] = [];
  if (userId) {
    const { data: progressData } = await supabase
      .from("video_views")
      .select(`
        last_position,
        completed,
        updated_at,
        video:videos (
          id,
          title,
          youtube_id,
          is_premium,
          course,
          semester,
          subject,
          duration_seconds,
          view_count,
          created_at,
          lecturer:lecturers (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq("user_id", userId)
      .eq("completed", false)
      .order("updated_at", { ascending: false })
      .limit(6);

    continueWatching = (progressData || [])
      .filter((pv: any) => pv.video)
      .map((pv: any) => ({
        ...pv.video,
        progress: {
          last_position: pv.last_position,
          completed: pv.completed,
        },
      }));
  }

  // 4. Fetch playlists list for default dashboard
  const { data: playlistsData } = await supabase
    .from("playlists")
    .select(`
      *,
      lecturer:lecturers (
        id,
        name,
        avatar_url
      )
    `)
    .eq("is_published", true)
    .limit(6);

  // 5. Gather playlist video metadata (first videos & video count mapping)
  const { data: playlistVideos } = await supabase
    .from("videos")
    .select("id, playlist_id, youtube_id, playlist_order")
    .eq("is_published", true)
    .order("playlist_order", { ascending: true });

  const firstVideoMap: Record<string, string> = {};
  const firstVideoYtIdMap: Record<string, string> = {};
  const videoCountMap: Record<string, number> = {};

  (playlistVideos || []).forEach((v: any) => {
    if (v.playlist_id) {
      videoCountMap[v.playlist_id] = (videoCountMap[v.playlist_id] || 0) + 1;
      if (!firstVideoMap[v.playlist_id]) {
        firstVideoMap[v.playlist_id] = v.id;
        firstVideoYtIdMap[v.playlist_id] = v.youtube_id;
      }
    }
  });

  // Hydrate playlists with first video link & counts
  const playlists = (playlistsData || []).map((pl: any) => ({
    ...pl,
    firstVideoId: firstVideoMap[pl.id] || null,
    firstVideoYtId: firstVideoYtIdMap[pl.id] || "",
    videoCount: videoCountMap[pl.id] || 0,
  }));

  // 6. Fetch default tracks: B.Pharm Sem 1 & D.Pharm Year 1
  const { data: bpharmData } = await supabase
    .from("videos")
    .select(`
      *,
      lecturer:lecturers (
        id,
        name,
        avatar_url
      )
    `)
    .eq("is_published", true)
    .eq("course", "B.Pharm")
    .eq("semester", 1)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: dpharmData } = await supabase
    .from("videos")
    .select(`
      *,
      lecturer:lecturers (
        id,
        name,
        avatar_url
      )
    `)
    .eq("is_published", true)
    .eq("course", "D.Pharm")
    .order("created_at", { ascending: false })
    .limit(6);

  // 7. If filtered, fetch filtered results
  let filteredVideos: any[] = [];
  if (isFiltered) {
    let q = supabase
      .from("videos")
      .select(`
        *,
        lecturer:lecturers (
          id,
          name,
          avatar_url
        )
      `)
      .eq("is_published", true);

    if (course !== "All") q = q.eq("course", course);
    if (semester !== "All") q = q.eq("semester", parseInt(semester));
    if (subject !== "All") q = q.eq("subject", subject);
    if (type === "free") q = q.eq("is_premium", false);

    if (duration === "short") {
      q = q.lt("duration_seconds", 600);
    } else if (duration === "medium") {
      q = q.gte("duration_seconds", 600).lte("duration_seconds", 1800);
    } else if (duration === "long") {
      q = q.gt("duration_seconds", 1800);
    }

    if (sort === "views") {
      q = q.order("view_count", { ascending: false });
    } else if (sort === "likes") {
      q = q.order("like_count", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    const { data: fVideos } = await q;
    filteredVideos = fVideos || [];
  }

  return (
    <div className="relative w-full min-h-screen bg-[#0f0f0f] text-brand-cream pb-20 px-4 md:px-8 lg:px-16 pt-8">
      {/* Background ambient branding glows */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none opacity-[0.03]" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] ambient-brand-glow pointer-events-none opacity-[0.02]" />

      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-bold font-bebas tracking-widest uppercase text-white">
            Video <span className="text-brand">Lectures</span>
          </h1>
          <p className="text-[10px] md:text-xs font-mono text-brand-cream/40 uppercase tracking-widest">
            Distraction-free pharmacy visual syllabus vault
          </p>
        </div>

        {/* Dynamic Filter Section */}
        <FilterBar subjects={subjectsList} />

        {/* ═══ CASE A: FILTERS ARE ACTIVE ═══ */}
        {isFiltered ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-brand-border/20 pb-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Search Results ({filteredVideos.length})
              </h2>
            </div>
            {filteredVideos.length === 0 ? (
              <div className="py-20 glass-panel border border-brand-border/40 rounded-2xl text-center flex flex-col items-center gap-3">
                <span className="text-3xl">🔍</span>
                <p className="text-xs font-mono uppercase text-brand-cream/40 tracking-wider">
                  No lectures found matching your criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    hasVideoAccess={hasVideoAccess}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ═══ CASE B: DEFAULT HOMEPAGE LAYOUT ═══ */
          <div className="flex flex-col gap-10">
            {/* 1. Continue Watching Section */}
            {continueWatching.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-cream/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  Continue Watching
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {continueWatching.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      progress={video.progress}
                      hasVideoAccess={hasVideoAccess}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Featured Playlists Section */}
            {playlists.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-cream/60">
                  Featured Playlist series
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist) => {
                    const firstVideoLink = playlist.firstVideoId
                      ? `/videos/${playlist.firstVideoId}`
                      : "#";
                    
                    const playlistThumbnail = playlist.thumbnail_url || 
                      (playlist.firstVideoYtId ? `https://img.youtube.com/vi/${playlist.firstVideoYtId}/mqdefault.jpg` : "");

                    return (
                      <div 
                        key={playlist.id} 
                        className="group relative glass-panel border border-brand-border/40 hover:border-brand/30 rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
                      >
                        {/* Thumbnail overlay link */}
                        <Link href={firstVideoLink} className="relative aspect-video w-full bg-brand-charcoal overflow-hidden block">
                          {playlistThumbnail ? (
                            <img
                              src={playlistThumbnail}
                              alt={playlist.title}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-brand-gray">
                              📚
                            </div>
                          )}
                          
                          {/* Play Badge */}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[1px] transition-opacity duration-300">
                            <div className="w-12 h-12 rounded-full bg-brand text-black flex items-center justify-center shadow-lg font-bold text-lg">
                              ▶
                            </div>
                          </div>

                          {/* Playlist total count sidebar indicator */}
                          <div className="absolute top-0 right-0 bottom-0 w-20 bg-black/85 backdrop-blur-[3px] flex flex-col items-center justify-center gap-1.5 z-10 border-l border-brand-border/20">
                            <span className="text-xl">📹</span>
                            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                              {playlist.videoCount}
                            </span>
                            <span className="text-[7px] font-mono text-brand-cream/40 uppercase tracking-widest">
                              Videos
                            </span>
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="p-4 flex flex-col gap-2">
                          <h3 className="text-xs font-bold text-white font-mono leading-snug line-clamp-1">
                            {playlist.title}
                          </h3>
                          <div className="flex gap-2 items-center">
                            <span className="text-[8px] bg-brand/10 border border-brand/20 text-brand px-1.5 py-0.5 rounded font-mono uppercase">
                              {playlist.course} - Sem {playlist.semester}
                            </span>
                            <span className="text-[8px] bg-brand-gray/60 text-brand-cream/60 px-1.5 py-0.5 rounded font-mono">
                              {playlist.subject}
                            </span>
                          </div>
                          
                          {playlist.lecturer && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-brand-border/10">
                              {playlist.lecturer.avatar_url ? (
                                <img
                                  src={playlist.lecturer.avatar_url}
                                  alt={playlist.lecturer.name}
                                  className="w-4.5 h-4.5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-4.5 h-4.5 rounded-full bg-brand-gray border border-brand-border/40 flex items-center justify-center text-[8px] font-mono text-brand uppercase">
                                  {playlist.lecturer.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-[9px] font-mono text-brand-cream/50">
                                {playlist.lecturer.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. B.Pharm Sem 1 Track */}
            {bpharmData && bpharmData.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-brand-border/20 pb-1.5">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-cream/60">
                    B.Pharm — Semester 1 Vault
                  </h2>
                  <Link
                    href="?course=B.Pharm&semester=1"
                    className="text-[9px] font-mono font-bold uppercase text-brand hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {bpharmData.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      hasVideoAccess={hasVideoAccess}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. D.Pharm Year 1 Track */}
            {dpharmData && dpharmData.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-brand-border/20 pb-1.5">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-cream/60">
                    D.Pharm — Year 1 Vault
                  </h2>
                  <Link
                    href="?course=D.Pharm"
                    className="text-[9px] font-mono font-bold uppercase text-brand hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {dpharmData.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      hasVideoAccess={hasVideoAccess}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
