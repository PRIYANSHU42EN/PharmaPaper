import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { success, error } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the user profile
    const { data: profile, error: dbError } = await supabase
      .from("profiles")
      .select("id, user_id, name, avatar_url, course, semester, bio, is_public, created_at")
      .eq("user_id", id)
      .is("deleted_at", null)
      .single();

    if (dbError || !profile) {
      return error(404, "User profile not found");
    }

    // If profile is not public, ensure the requester is the owner
    if (!profile.is_public) {
      const { userId: requesterId } = auth();
      if (requesterId !== id) {
        return error(403, "This profile is private");
      }
    }

    // Additional statistics can be fetched here (e.g., videos watched)
    // For now, return the profile
    return success(profile);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return error(500, "Internal Server Error");
  }
}
