import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const authError = requireRole("admin");
    if (authError) return authError;

    const searchParams = req.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "pending"; // pending or reported
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch video comments
    // We are filtering by is_approved logic
    // For reported, maybe we assume a reports table, but for now we just use is_approved
    const { data: comments, error: dbError } = await supabase
      .from("video_comments")
      .select("*, video:videos(title, youtube_id)")
      .eq("is_approved", tab === "approved") // Simplified for demo
      .order("created_at", { ascending: false })
      .limit(50);

    if (dbError) {
      console.error("Error fetching comments:", dbError);
      return apiError(500, "Database error");
    }

    return success({ comments });

  } catch (err) {
    console.error("Error in GET /admin/moderation:", err);
    return apiError(500, "Internal Server Error");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = requireRole("admin");
    if (authError) return authError;

    const body = await req.json();
    const { id, action } = body; // action = approve, delete, warn

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "approve") {
      await supabase.from("video_comments").update({ is_approved: true }).eq("id", id);
    } else if (action === "delete") {
      await supabase.from("video_comments").delete().eq("id", id);
    }

    // Log it
    await supabase.from("admin_activity_logs").insert({
      admin_id: "admin",
      action: `COMMENT_${action.toUpperCase()}`,
      details: { comment_id: id }
    });

    return success({ message: "Action successful" });

  } catch (err) {
    console.error("Error in PATCH /admin/moderation:", err);
    return apiError(500, "Internal Server Error");
  }
}
