import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. Secure with cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Expire old trials
    const { data: expiredTrials, error: updateError } = await supabase
      .from("trials")
      .update({ status: "expired" })
      .lt("trial_end", new Date().toISOString())
      .eq("status", "active")
      .eq("converted_to_paid", false)
      .select();

    if (updateError) {
      console.error("Failed to update expired trials in database:", updateError);
      return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
    }

    // 3. Send expiry notifications
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && expiredTrials && expiredTrials.length > 0) {
      for (const trial of expiredTrials) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "PharmPaper <noreply@pharmapaper.com>",
              to: trial.email,
              subject: "⏰ Your PharmPaper Premium trial has ended",
              text: `Your 14-day premium trial has ended.\n\nTo retain full premium access to B.Pharm & D.Pharm study notes and PYQs, you can upgrade to a premium plan:\n- Monthly Pass: ₹99\n- Yearly Vault: ₹499\n\nUpgrade here: https://pharmapaper.com/upgrade\n\nYour saved notes and bookmarks will remain intact. Upgrade anytime to resume study.`,
            }),
          });
        } catch (emailErr) {
          console.error(`Failed to send trial expiry email to ${trial.email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({ expired: expiredTrials?.length ?? 0 });
  } catch (error: any) {
    console.error("Error in expire-trials cron:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
