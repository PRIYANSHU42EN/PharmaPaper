import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = requireRole("admin");
    if (authError) return authError;

    const body = await req.json();
    const { action, reason } = body; // action = "approve" | "reject"

    if (action !== "approve" && action !== "reject") {
      return apiError(400, "Invalid action. Must be 'approve' or 'reject'");
    }

    const status = action === "approve" ? "published" : "rejected";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: video, error: updateError } = await supabase
      .from("videos")
      .update({ 
        status,
        rejection_reason: action === "reject" ? reason : null,
        is_published: action === "approve"
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update video:", updateError);
      return apiError(500, "Failed to update video status");
    }

    // Generate Notification for the Lecturer
    if (video && video.lecturer_id) {
      // Find lecturer's user_id
      const { data: lecturer } = await supabase.from("lecturers").select("user_id").eq("id", video.lecturer_id).single();
      
      if (lecturer && lecturer.user_id) {
        await supabase.from("notifications").insert({
          user_id: lecturer.user_id,
          type: action === "approve" ? "video_approved" : "video_rejected",
          title: action === "approve" ? "Video Published" : "Video Rejected",
          message: action === "approve" 
            ? `Your video "${video.title}" has been approved and published.`
            : `Your video "${video.title}" was rejected. Reason: ${reason || 'Not specified'}`,
          link: action === "approve" ? `/videos/${video.id}` : `/lecturer/videos/${video.id}`
        });
      }
    }

    await supabase.from("admin_activity_logs").insert({
      admin_id: "admin",
      action: action === "approve" ? "APPROVE_VIDEO" : "REJECT_VIDEO",
      details: { video_id: params.id, reason }
    });

    return success({ message: `Video ${status} successfully`, video });

  } catch (err) {
    console.error("Error updating video status:", err);
    return apiError(500, "Internal Server Error");
  }
}
