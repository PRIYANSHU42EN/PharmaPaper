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
    const { videoId, timestampSeconds, noteText } = body;

    if (!videoId || typeof timestampSeconds !== "number" || !noteText || typeof noteText !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check notes count for this user & video
    const { count, error: countError } = await supabase
      .from("video_notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("video_id", videoId);

    if (countError) {
      console.error("Notes count error:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count !== null && count >= 100) {
      return NextResponse.json(
        { error: "You have reached the limit of 100 notes for this video" },
        { status: 400 }
      );
    }

    // Insert note
    const { data: newNote, error: insertError } = await supabase
      .from("video_notes")
      .insert({
        video_id: videoId,
        user_id: userId,
        timestamp_seconds: Math.floor(timestampSeconds),
        note_text: noteText.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Note insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, note: newNote });
  } catch (error: any) {
    console.error("Personal note POST route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
