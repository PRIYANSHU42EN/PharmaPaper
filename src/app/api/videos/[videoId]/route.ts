import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { checkUserPremiumStatus } from "@/lib/premium-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { userId } = await auth();

    // 1. Fetch video details
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*, lecturers(*)")
      .eq("id", videoId)
      .maybeSingle();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.is_published) {
      return NextResponse.json({ error: "Video is not published" }, { status: 403 });
    }

    // 2. Check premium access
    const premiumStatus = await checkUserPremiumStatus(userId);
    const userHasAccess = !video.is_premium || !!premiumStatus.canWatchVideos;

    // 3. Security: Do not expose youtubeId for premium videos to users without access
    let youtubeId = video.youtube_id;
    if (video.is_premium && !userHasAccess) {
      youtubeId = "";
    }

    // 4. Fetch playlist (all videos in the same unit/playlist)
    const { data: playlistVideos } = await supabase
      .from("videos")
      .select("id, title, duration_seconds, view_count, is_premium, is_published")
      .eq("playlist_id", video.playlist_id)
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    // 5. Fetch user-specific progress, like status, and lecturer subscription if authenticated
    let userProgress = null;
    let hasLiked = false;
    let isSubscribed = false;

    if (userId) {
      // Fetch progress
      const { data: viewData } = await supabase
        .from("video_views")
        .select("last_position, completed")
        .eq("user_id", userId)
        .eq("video_id", videoId)
        .maybeSingle();
      if (viewData) {
        userProgress = viewData;
      }

      // Fetch like status
      const { data: likeData } = await supabase
        .from("video_likes")
        .select("id")
        .eq("user_id", userId)
        .eq("video_id", videoId)
        .maybeSingle();
      if (likeData) {
        hasLiked = true;
      }

      // Fetch lecturer subscription status
      if (video.lecturer_id) {
        const { data: subData } = await supabase
          .from("lecturer_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("lecturer_id", video.lecturer_id)
          .maybeSingle();
        if (subData) {
          isSubscribed = true;
        }
      }
    }

    // Increment view count
    try {
      await supabase.rpc("increment_video_views", { video_row_id: videoId });
    } catch (rpcErr) {
      console.error("Increment view count RPC failed:", rpcErr);
    }

    return NextResponse.json({
      video: {
        id: video.id,
        title: video.title,
        youtubeId,
        isPremium: video.is_premium,
        freePreviewSeconds: video.free_preview_seconds || 120,
        subject: video.subject,
        course: video.course,
        semester: video.semester,
        notes: video.notes,
        likeCount: video.like_count,
        viewCount: (video.view_count || 0) + 1,
        durationSeconds: video.duration_seconds,
        createdAt: video.created_at,
        playlistId: video.playlist_id,
        playlistName: video.playlist_name,
      },
      lecturer: video.lecturers
        ? {
            id: video.lecturers.id,
            name: video.lecturers.name,
            avatarUrl: video.lecturers.avatar_url,
            totalSubscribers: video.lecturers.total_subscribers,
            isSubscribed,
          }
        : null,
      playlist: (playlistVideos || []).map((v) => ({
        id: v.id,
        title: v.title,
        durationSeconds: v.duration_seconds,
        viewCount: v.view_count,
        isPremium: v.is_premium,
      })),
      progress: userProgress,
      hasLiked,
      userHasAccess,
    });
  } catch (error: any) {
    console.error("GET video details route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
