import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Helper to extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // Match standard IDs (11 alphanumeric, dash, underscore)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  // Try direct 11-char ID matching
  const clean = url.trim();
  if (clean.length === 11) {
    return clean;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      course,
      semester,
      subject,
      unit,
      tags,
      thumbnailUrl,
      isPremium,
      freePreviewDuration,
      videoSource, // 'youtube' or 'mux'
      youtubeUrl,
    } = body;

    // Field Validation
    if (!title || title.length > 100) {
      return NextResponse.json({ error: "Title is required (max 100 chars)" }, { status: 400 });
    }
    if (!course || !semester || !subject) {
      return NextResponse.json({ error: "Course, Semester, and Subject are required" }, { status: 400 });
    }

    const parsedUnit = parseInt(unit, 10) || 1;
    if (parsedUnit < 1 || parsedUnit > 5) {
      return NextResponse.json({ error: "Unit must be between 1 and 5" }, { status: 400 });
    }

    let extractedId = "";
    if (videoSource === "youtube") {
      const ytId = extractYouTubeId(youtubeUrl);
      if (!ytId) {
        return NextResponse.json({ error: "Invalid YouTube URL or Video ID" }, { status: 400 });
      }
      extractedId = ytId;
    } else {
      // Mock Mux ID for direct upload tab
      extractedId = "mux_" + Math.random().toString(36).substring(2, 13);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve active lecturer row
    const { data: lecturer, error: lecturerError } = await supabase
      .from("lecturers")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();

    if (lecturerError || !lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found. Please set up your profile first." },
        { status: 404 }
      );
    }

    // Insert new pending video record
    const { data: newVideo, error: insertError } = await supabase
      .from("videos")
      .insert({
        title,
        youtube_id: extractedId,
        is_premium: !!isPremium,
        free_preview_seconds: isPremium ? parseInt(freePreviewDuration, 10) || 120 : 0,
        subject,
        course,
        semester: parseInt(semester, 10) || 1,
        lecturer_id: lecturer.id,
        playlist_id: "default_playlist", // Standard default
        playlist_name: "Course Lectures",
        notes: description || "",
        is_published: false, // Starts unpublished until admin approval
        status: "pending",
        unit: parsedUnit,
        view_count: 0,
        like_count: 0,
        duration_seconds: 0, // Determined post-approval/playback
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert video db error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Dispatch notification email to admin using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "admin@pharmapaper.com";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "PharmPaper LMS <noreply@pharmapaper.com>",
            to: adminEmail,
            subject: `New Video Lecture Awaiting Approval: ${title}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>New Lecture Video Submitted for Review</h2>
                <p><strong>Lecturer:</strong> ${lecturer.name}</p>
                <p><strong>Video Title:</strong> ${title}</p>
                <p><strong>Course & Syllabus:</strong> ${course} - Sem ${semester} - Subject: ${subject} (Unit ${parsedUnit})</p>
                <p><strong>Access Level:</strong> ${isPremium ? "Premium (Gated)" : "Free Lecture"}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>Please log in to the administration portal to review, preview, and approve or reject this submission.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pharmapaper.com"}/admin" 
                   style="display: inline-block; padding: 10px 20px; background: #0582CA; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Go to Approvals Dashboard
                </a>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("Admin upload notification email delivery failed:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      video: newVideo,
      message: "Video submitted for review! Usually approved within 24 hours.",
    });
  } catch (error: any) {
    console.error("Lecturer upload POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
