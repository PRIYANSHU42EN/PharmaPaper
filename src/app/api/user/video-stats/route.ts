import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch count of completed videos
    const { count: completedCount, error: countErr } = await supabase
      .from("video_views")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);

    if (countErr) {
      console.error("Error fetching completed videos count:", countErr);
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }

    // 2. Fetch subscribed lecturers joining lecturer details
    const { data: subsData, error: subsErr } = await supabase
      .from("lecturer_subscriptions")
      .select(`
        id,
        lecturer_id,
        created_at,
        lecturer:lecturers (
          id,
          name,
          avatar_url,
          bio,
          specialization,
          total_subscribers
        )
      `)
      .eq("user_id", userId);

    if (subsErr) {
      console.error("Error fetching lecturer subscriptions:", subsErr);
      return NextResponse.json({ error: subsErr.message }, { status: 500 });
    }

    // Extract lecturers correctly
    const subscriptions = (subsData || [])
      .filter((s: any) => s.lecturer)
      .map((s: any) => ({
        subscriptionId: s.id,
        subscribedAt: s.created_at,
        ...s.lecturer,
      }));

    return NextResponse.json({
      success: true,
      completedCount: completedCount || 0,
      subscriptions,
    });
  } catch (error: any) {
    console.error("User video stats route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
