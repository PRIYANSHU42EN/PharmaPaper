import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";
import SubscribeButton from "@/components/video/SubscribeButton";
import VideoCard from "@/components/video/VideoCard";

// Set ISR Revalidation limit to 5 minutes
export const revalidate = 300;

// Setup server-side Supabase client with bypass key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function LecturerProfilePage({
  params,
}: {
  params: Promise<{ lecturerId: string }>;
}) {
  const resolvedParams = await params;
  const lecturerId = resolvedParams.lecturerId;

  // 1. Fetch Lecturer details
  const { data: lecturer } = await supabase
    .from("lecturers")
    .select("*")
    .eq("id", lecturerId)
    .maybeSingle();

  if (!lecturer) {
    return notFound();
  }

  // 2. Fetch User auth & premium status
  const { userId } = await auth();
  const { canWatchVideos: hasVideoAccess } = await checkUserPremiumStatus(userId);

  // 3. Check if user is currently subscribed
  let isSubscribed = false;
  if (userId) {
    const { data: sub } = await supabase
      .from("lecturer_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("lecturer_id", lecturerId)
      .maybeSingle();
    isSubscribed = !!sub;
  }

  // 4. Fetch playlists created by this lecturer
  const { data: playlistsData } = await supabase
    .from("playlists")
    .select("*")
    .eq("lecturer_id", lecturerId)
    .eq("is_published", true);

  const playlists = playlistsData || [];

  // 5. Fetch all published videos of this lecturer (for grid & stats calculations)
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
    .eq("lecturer_id", lecturerId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const videos = videosData || [];

  // 6. Calculate channel stats
  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum: number, v: any) => sum + (v.view_count || 0), 0);

  // 7. Map first video of each playlist for direct launch link
  const playlistIds = playlists.map((p) => p.id);
  const playlistFirstVideoMap: Record<string, string> = {};
  const playlistVideoCountMap: Record<string, number> = {};

  if (playlistIds.length > 0) {
    const { data: plVideos } = await supabase
      .from("videos")
      .select("id, playlist_id, playlist_order")
      .eq("is_published", true)
      .in("playlist_id", playlistIds)
      .order("playlist_order", { ascending: true });

    (plVideos || []).forEach((v: any) => {
      if (v.playlist_id) {
        playlistVideoCountMap[v.playlist_id] = (playlistVideoCountMap[v.playlist_id] || 0) + 1;
        if (!playlistFirstVideoMap[v.playlist_id]) {
          playlistFirstVideoMap[v.playlist_id] = v.id;
        }
      }
    });
  }

  // Fallback metallic/charcoal linear gradient for banner background
  const bannerBackgroundStyle = lecturer.banner_url
    ? { backgroundImage: `url(${lecturer.banner_url})` }
    : { backgroundImage: "linear-gradient(135deg, #262626 0%, #171717 100%)" };

  return (
    <div className="relative w-full min-h-screen bg-[#0f0f0f] text-brand-cream pb-20">
      {/* ═══ BANNER SECTION ═══ */}
      <div 
        className="w-full h-48 md:h-64 bg-cover bg-center border-b border-brand-border/40 relative flex items-end justify-center"
        style={bannerBackgroundStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* ═══ LECTURER DETAILS PANEL ═══ */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative -mt-16 z-10 flex flex-col gap-8">
        <div className="p-6 glass-panel border border-brand-border rounded-3xl flex flex-col md:flex-row justify-between gap-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
            {/* Avatar */}
            {lecturer.avatar_url ? (
              <img
                src={lecturer.avatar_url}
                alt={lecturer.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-brand-border shadow-md shrink-0 bg-brand-charcoal"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-gray border-2 border-brand-border flex items-center justify-center text-3xl font-mono font-bold text-brand uppercase shrink-0 shadow-md">
                {lecturer.name.charAt(0)}
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-xl font-bold text-white font-mono leading-none">
                  {lecturer.name}
                </h1>
                {lecturer.specialization && (
                  <span className="text-[8px] bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold max-w-fit mx-auto md:mx-0">
                    {lecturer.specialization}
                  </span>
                )}
              </div>
              
              <p className="text-[10px] text-brand-cream/60 max-w-xl leading-relaxed font-sans">
                {lecturer.bio || "No biography provided by the lecturer."}
              </p>
            </div>
          </div>

          {/* Interactive Subscribe Section */}
          <div className="flex flex-col items-center md:items-end justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-brand-border/20 pt-4 md:pt-0 md:pl-6">
            <SubscribeButton
              lecturerId={lecturer.id}
              initialIsSubscribed={isSubscribed}
              initialSubscriberCount={lecturer.total_subscribers || 0}
            />

            {/* Channel Statistics */}
            <div className="flex items-center gap-5 mt-1 border-t border-brand-border/10 pt-3 w-full justify-center md:justify-end">
              <div className="flex flex-col font-mono text-center md:text-right">
                <span className="text-xs font-bold text-white leading-none">
                  {totalVideos}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-brand-cream/35 mt-0.5">
                  Lectures
                </span>
              </div>
              <div className="w-px h-6 bg-brand-border/20" />
              <div className="flex flex-col font-mono text-center md:text-right">
                <span className="text-xs font-bold text-white leading-none">
                  {totalViews.toLocaleString()}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-brand-cream/35 mt-0.5">
                  Total Views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ PLAYLISTS SECTION ═══ */}
        {playlists.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-cream/60 border-b border-brand-border/20 pb-2">
              Lecturer Playlists
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => {
                const firstVideoId = playlistFirstVideoMap[playlist.id];
                const firstVideoLink = firstVideoId ? `/videos/${firstVideoId}` : "#";
                const videoCount = playlistVideoCountMap[playlist.id] || 0;

                return (
                  <div 
                    key={playlist.id} 
                    className="group relative glass-panel border border-brand-border/40 hover:border-brand/30 rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
                  >
                    <Link href={firstVideoLink} className="relative aspect-video w-full bg-brand-charcoal overflow-hidden block">
                      {playlist.thumbnail_url ? (
                        <img
                          src={playlist.thumbnail_url}
                          alt={playlist.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-brand-gray">
                          📚
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[1px] transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-brand text-black flex items-center justify-center shadow-lg font-bold text-lg">
                          ▶
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 bottom-0 w-20 bg-black/85 backdrop-blur-[3px] flex flex-col items-center justify-center gap-1.5 z-10 border-l border-brand-border/20">
                        <span className="text-xl">📹</span>
                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                          {videoCount}
                        </span>
                        <span className="text-[7px] font-mono text-brand-cream/40 uppercase tracking-widest">
                          Videos
                        </span>
                      </div>
                    </Link>

                    <div className="p-4 flex flex-col gap-2">
                      <h3 className="text-xs font-bold text-white font-mono leading-snug line-clamp-1">
                        {playlist.title}
                      </h3>
                      <div className="flex gap-2 items-center">
                        <span className="text-[8px] bg-brand/10 border border-brand/20 text-brand px-1.5 py-0.5 rounded font-mono uppercase">
                          {playlist.course} - Sem {playlist.semester}
                        </span>
                        <span className="text-[8px] bg-brand-gray/60 text-brand-cream/60 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                          {playlist.subject}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ VIDEOS GRID SECTION ═══ */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-brand-cream/60 border-b border-brand-border/20 pb-2">
            All Video Lectures ({totalVideos})
          </h2>
          
          {videos.length === 0 ? (
            <div className="py-16 text-center glass-panel border border-brand-border/30 rounded-2xl">
              <p className="text-xs font-mono uppercase text-brand-cream/35 tracking-wider">
                This lecturer hasn't published any lectures yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  hasVideoAccess={hasVideoAccess}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
