import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return apiError(401, "Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, fileName, contentType, avatarUrl } = body;

    // We have two actions here:
    // 1. 'presigned': Get a presigned URL to upload the avatar directly to Supabase storage.
    // 2. 'confirm': Update the user's profile with the new avatar URL.

    if (action === "presigned") {
      if (!fileName || !contentType) {
        return apiError(400, "Missing fileName or contentType");
      }

      // Basic validation for images
      if (!contentType.startsWith("image/")) {
        return apiError(400, "Invalid content type");
      }

      const filePath = `avatars/${userId}/${Date.now()}-${fileName}`;
      
      const { data, error } = await supabase.storage
        .from("public") // Assuming there's a bucket named 'public' or 'avatars'
        .createSignedUploadUrl(filePath);

      if (error) {
        console.error("Presigned URL error:", error);
        return apiError(500, "Failed to generate upload URL");
      }

      return success({
        signedUrl: data.signedUrl,
        path: data.path,
        // Assuming public bucket, construct public URL directly:
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${data.path}`
      });
    }

    if (action === "confirm") {
      if (!avatarUrl) {
        return apiError(400, "Missing avatarUrl");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .is("deleted_at", null)
        .select()
        .single();

      if (error) {
        console.error("Avatar confirm error:", error);
        return apiError(500, "Failed to update avatar");
      }

      return success(data);
    }

    return apiError(400, "Invalid action");
  } catch (err) {
    console.error("Error handling avatar upload:", err);
    return apiError(500, "Internal Server Error");
  }
}
