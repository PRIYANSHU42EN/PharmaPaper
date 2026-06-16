import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    // Auth is optional for public feed
    const { userId } = await auth();
    const searchParams = req.nextUrl.searchParams;
    
    const course = searchParams.get("course");
    const semester = searchParams.get("semester");
    const subject = searchParams.get("subject");
    const sort = searchParams.get("sort") || "latest"; // latest, viewed, liked
    const cursor = parseInt(searchParams.get("cursor") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const tab = searchParams.get("tab") || "all"; // all, subscriptions

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. If tab is 'subscriptions', fetch subscribed lecturer IDs first
    let subscribedLecturerIds: string[] = [];
    if (tab === "subscriptions") {
      if (!userId) return apiError(401, "Login required to view subscriptions");
      
      const { data: subs } = await supabase
        .from("lecturer_subscriptions")
        .select("lecturer_id")
        .eq("user_id", userId);
        
      if (subs && subs.length > 0) {
        subscribedLecturerIds = subs.map(s => s.lecturer_id);
      } else {
        // User has no subscriptions, return empty
        return success({ videos: [], nextCursor: null });
      }
    }

    // 2. Build the main query
    let query = supabase
      .from("videos")
      .select(`
        *,
        lecturer:lecturers(id, name, avatar_url)
      `)
      .eq("status", "published");

    // Apply filters
    if (course) query = query.eq("course", course);
    if (semester) query = query.eq("semester", parseInt(semester, 10));
    if (subject) query = query.eq("subject", subject);
    
    if (tab === "subscriptions" && subscribedLecturerIds.length > 0) {
      query = query.in("lecturer_id", subscribedLecturerIds);
    }

    // Apply sorting
    if (sort === "viewed") {
      query = query.order("view_count", { ascending: false });
    } else if (sort === "liked") {
      query = query.order("like_count", { ascending: false });
    } else {
      // default: latest
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(cursor, cursor + limit - 1);

    const { data: videos, error: videosErr } = await query;

    if (videosErr) {
      console.error("Error fetching videos:", videosErr);
      return apiError(500, "Failed to fetch videos");
    }

    // 3. If logged in, fetch user progress (views) for these specific videos
    let progressMap: Record<string, number> = {};
    if (userId && videos && videos.length > 0) {
      const videoIds = videos.map(v => v.id);
      const { data: viewsData } = await supabase
        .from("video_views")
        .select("video_id, last_position")
        .eq("user_id", userId)
        .in("video_id", videoIds);
        
      if (viewsData) {
        viewsData.forEach(v => {
          progressMap[v.video_id] = v.last_position;
        });
      }
    }

    // 4. Format response
    const formattedVideos = (videos || []).map(v => ({
      ...v,
      user_progress: progressMap[v.id] || 0
    }));

    const nextCursor = formattedVideos.length === limit ? cursor + limit : null;

    return success({
      videos: formattedVideos,
      nextCursor
    });

  } catch (err) {
    console.error("Error in GET videos:", err);
    return apiError(500, "Internal Server Error");
  }
}
