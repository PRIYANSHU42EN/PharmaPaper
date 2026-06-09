import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit check (10 per minute per user)
    const { blocked, headers } = await checkRateLimit("like", userId);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many actions. Please wait a minute." },
        { status: 429, headers }
      );
    }

    const body = await req.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    // Check if user already liked this video
    const { data: existingLike } = await supabase
      .from("video_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("video_likes")
        .delete()
        .eq("user_id", userId)
        .eq("video_id", videoId);

      if (deleteError) {
        console.error("Unlike delete error:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      // Decrement like count
      try {
        await supabase.rpc("decrement_video_likes", { video_row_id: videoId });
      } catch (rpcErr) {
        console.error("Decrement RPC failed:", rpcErr);
      }

      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      const { error: insertError } = await supabase
        .from("video_likes")
        .insert({ user_id: userId, video_id: videoId });

      if (insertError) {
        console.error("Like insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Increment like count
      try {
        await supabase.rpc("increment_video_likes", { video_row_id: videoId });
      } catch (rpcErr) {
        console.error("Increment RPC failed:", rpcErr);
      }

      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error: any) {
    console.error("Like toggle POST route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
