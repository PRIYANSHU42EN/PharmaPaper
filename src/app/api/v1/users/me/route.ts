import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(401, "Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    
    // In a real app, use zod for validation. Keeping it simple here.
    const { name, bio, course, semester, is_public, notifications_email } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (course !== undefined) updates.course = course;
    if (semester !== undefined) updates.semester = semester;
    if (is_public !== undefined) updates.is_public = is_public;
    if (notifications_email !== undefined) updates.notifications_email = notifications_email;

    const { data, error: dbError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();

    if (dbError) {
      console.error("Profile update error:", dbError);
      return apiError(500, "Failed to update profile");
    }

    return success(data);
  } catch (err) {
    console.error("Error updating profile:", err);
    return apiError(500, "Internal Server Error");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(401, "Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Soft delete implementation: set deleted_at to current timestamp
    // A separate cron job or service will handle the hard delete after 7 days
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (dbError) {
      console.error("Profile delete error:", dbError);
      return apiError(500, "Failed to delete profile");
    }

    // Note: To completely soft delete from the UI, we should also probably call Clerk API to delete or suspend the user
    // However, since it's a soft delete, we might just keep the Clerk account but sign them out or disable login.
    // For now, updating DB is sufficient for phase 1.

    return success({ message: "Profile scheduled for deletion in 7 days." });
  } catch (err) {
    console.error("Error deleting profile:", err);
    return apiError(500, "Internal Server Error");
  }
}
