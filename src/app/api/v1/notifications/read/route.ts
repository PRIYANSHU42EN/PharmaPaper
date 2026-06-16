import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return apiError(401, "Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications read:", error);
      return apiError(500, "Failed to mark notifications read");
    }

    return success({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error in PATCH notifications/read:", err);
    return apiError(500, "Internal Server Error");
  }
}
