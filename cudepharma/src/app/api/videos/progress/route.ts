import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, positionSeconds, completed } = body;

    if (!videoId || typeof positionSeconds !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Upsert into video_views
    const { error } = await supabase
      .from("video_views")
      .upsert(
        {
          user_id: userId,
          video_id: videoId,
          last_position: positionSeconds,
          completed: !!completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,video_id" }
      );

    if (error) {
      console.error("Progress save error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Progress POST route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
