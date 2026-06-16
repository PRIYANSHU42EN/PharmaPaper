import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(401, "Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch video views that are not completed, ordered by latest updated
    const { data: views, error: viewsErr } = await supabase
      .from("video_views")
      .select(`
        video_id,
        last_position,
        updated_at,
        video:videos (
          *,
          lecturer:lecturers(id, name, avatar_url)
        )
      `)
      .eq("user_id", userId)
      .eq("completed", false)
      .gt("last_position", 0)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (viewsErr) {
      console.error("Error fetching continue watching:", viewsErr);
      return apiError(500, "Failed to fetch continue watching list");
    }

    // Format the response to look like standard videos but with progress attached
    const videos = (views || [])
      .filter(v => v.video && (v.video as any).status === "published") // Ensure video is still published
      .map(v => ({
        ...(v.video as any),
        user_progress: v.last_position,
        last_watched_at: v.updated_at
      }));

    return success(videos);
  } catch (err) {
    console.error("Error in GET continue watching:", err);
    return apiError(500, "Internal Server Error");
  }
}
