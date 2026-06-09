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

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    // Fetch lecturer's videos sorted by created_at DESC
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("lecturer_id", lecturer.id)
      .order("created_at", { ascending: false });

    if (videosError) {
      console.error("Fetch lecturer videos error:", videosError);
      return NextResponse.json({ error: videosError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error("Lecturer videos GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      description,
      course,
      semester,
      subject,
      unit,
      isPremium,
      freePreviewDuration,
      resubmit,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    // Verify ownership of the video
    const { data: video, error: verifyError } = await supabase
      .from("videos")
      .select("id, status")
      .eq("id", id)
      .eq("lecturer_id", lecturer.id)
      .maybeSingle();

    if (verifyError || !video) {
      return NextResponse.json({ error: "Video not found or access denied" }, { status: 403 });
    }

    // Prepare update parameters
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.notes = description;
    if (course) updateData.course = course;
    if (semester !== undefined) updateData.semester = parseInt(semester, 10);
    if (subject) updateData.subject = subject;
    if (unit !== undefined) updateData.unit = parseInt(unit, 10);
    if (isPremium !== undefined) updateData.is_premium = !!isPremium;
    if (freePreviewDuration !== undefined) {
      updateData.free_preview_seconds = isPremium ? parseInt(freePreviewDuration, 10) : 0;
    }

    // If resubmitting a rejected video, update status to pending and clear rejection reason
    if (resubmit) {
      updateData.status = "pending";
      updateData.rejection_reason = null;
    }

    const { data: updatedVideo, error: updateError } = await supabase
      .from("videos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update video error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, video: updatedVideo });
  } catch (error: any) {
    console.error("Lecturer videos PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json({ error: "Lecturer profile not found" }, { status: 404 });
    }

    // Delete the video ensuring ownership check
    const { error: deleteError } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("lecturer_id", lecturer.id);

    if (deleteError) {
      console.error("Delete video error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Lecturer videos DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
