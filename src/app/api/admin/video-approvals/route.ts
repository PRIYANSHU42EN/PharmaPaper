import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims as any)?.metadata?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pending videos joined with lecturer details
    const { data: videos, error } = await supabase
      .from("videos")
      .select(`
        *,
        lecturer:lecturers(id, name, user_id)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch pending videos error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error("Admin approvals GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims as any)?.metadata?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const { videoId, action, rejectionReason } = body;

    if (!videoId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch video details to retrieve lecturer user_id
    const { data: video, error: fetchErr } = await supabase
      .from("videos")
      .select(`
        *,
        lecturer:lecturers(id, name, user_id)
      `)
      .eq("id", videoId)
      .maybeSingle();

    if (fetchErr || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const targetStatus = action === "approve" ? "approved" : "rejected";
    const updatePayload: any = {
      status: targetStatus,
      rejection_reason: action === "reject" ? rejectionReason || "Does not meet curriculum guidelines." : null,
      is_published: action === "approve",
    };

    const { data: updatedVideo, error: updateErr } = await supabase
      .from("videos")
      .update(updatePayload)
      .eq("id", videoId)
      .select()
      .single();

    if (updateErr) {
      console.error("Update approval status error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Try to email the lecturer using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && video.lecturer?.user_id) {
      try {
        const clerk = await clerkClient();
        const lecturerClerkUser = await clerk.users.getUser(video.lecturer.user_id);
        const lecturerEmail = lecturerClerkUser.emailAddresses[0]?.emailAddress;

        if (lecturerEmail) {
          const escapeHtml = (str: string): string => {
            return str
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
          };

          const safeLecturerName = escapeHtml(video.lecturer.name || "Lecturer");
          const safeVideoTitle = escapeHtml(video.title || "Video Lecture");
          const safeRejectionReason = escapeHtml(rejectionReason || "Does not meet curriculum guidelines.");

          const subject = action === "approve" 
            ? `Lecture Approved & Published: ${safeVideoTitle}` 
            : `Feedback on Lecture Submission: ${safeVideoTitle}`;

          const htmlContent = action === "approve"
            ? `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>Good news, ${safeLecturerName}!</h2>
                <p>Your video lecture <strong>"${safeVideoTitle}"</strong> has been approved by the editorial team.</p>
                <p>It has been published and is now available for students on the PharmPaper platform.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pharmapaper.com"}/videos/${video.id}" 
                   style="display: inline-block; padding: 10px 20px; background: #0582CA; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Live Videowatch Page
                </a>
              </div>
            `
            : `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>Hello ${safeLecturerName},</h2>
                <p>We reviewed your lecture submission: <strong>"${safeVideoTitle}"</strong>.</p>
                <p>Unfortunately, it has been rejected and needs changes before we can publish it.</p>
                <div style="background: #fdf2f2; border: 1px solid #fde8e8; border-radius: 8px; padding: 15px; color: #9b1c1c; margin: 15px 0;">
                  <strong>Reviewer Feedback:</strong><br />
                  ${safeRejectionReason}
                </div>
                <p>You can edit the details and resubmit this lecture for approval directly through your management dashboard.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pharmapaper.com"}/lecturer/videos" 
                   style="display: inline-block; padding: 10px 20px; background: #0582CA; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Go to Video Manager
                </a>
              </div>
            `;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "PharmPaper Team <noreply@pharmapaper.com>",
              to: lecturerEmail,
              subject: subject,
              html: htmlContent,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Resend notification email to lecturer failed:", emailErr);
      }
    }

    return NextResponse.json({ success: true, video: updatedVideo });
  } catch (error: any) {
    console.error("Admin approvals POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
