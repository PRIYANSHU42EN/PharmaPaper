import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lecturerId } = body;
    if (!lecturerId) {
      return NextResponse.json({ error: "Lecturer ID is required" }, { status: 400 });
    }

    // 1. Check if lecturer exists
    const { data: lecturer, error: lectErr } = await supabase
      .from("lecturers")
      .select("id")
      .eq("id", lecturerId)
      .maybeSingle();

    if (lectErr || !lecturer) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // 2. Check if user is already subscribed
    const { data: sub } = await supabase
      .from("lecturer_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("lecturer_id", lecturerId)
      .maybeSingle();

    let isSubscribed = false;

    if (sub) {
      // Unsubscribe (deleting the row triggers trg_sync_lecturer_subscribers to decrement count)
      const { error: delErr } = await supabase
        .from("lecturer_subscriptions")
        .delete()
        .eq("id", sub.id);

      if (delErr) throw delErr;
      isSubscribed = false;
    } else {
      // Subscribe (inserting the row triggers trg_sync_lecturer_subscribers to increment count)
      const { error: insErr } = await supabase
        .from("lecturer_subscriptions")
        .insert({
          user_id: userId,
          lecturer_id: lecturerId,
        });

      if (insErr) throw insErr;
      isSubscribed = true;
    }

    // 3. Fetch the updated total_subscribers count calculated atomically by the trigger
    const { data: updatedLecturer, error: countErr } = await supabase
      .from("lecturers")
      .select("total_subscribers")
      .eq("id", lecturerId)
      .maybeSingle();

    if (countErr || !updatedLecturer) {
      throw countErr || new Error("Failed to retrieve updated subscriber count");
    }

    return NextResponse.json({
      success: true,
      subscribed: isSubscribed,
      subscriberCount: updatedLecturer.total_subscribers || 0,
    });
  } catch (err: any) {
    console.error("Subscription toggle error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
