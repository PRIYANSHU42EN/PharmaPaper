import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit Check
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const { blocked, headers } = await checkRateLimit("payment", ip);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many requests. Try again in 1 minute." },
        { status: 429, headers }
      );
    }

    // 2. Authenticated Clerk Check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 3. Resolve user details from Clerk server-side
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "User email address not found in account profile" }, { status: 400 });
    }

    // 4. Check if user already used a trial
    const { data: existing } = await supabase
      .from("trials")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already used your free trial." },
        { status: 400 }
      );
    }

    // 4.5 Process referrer code if provided
    let referrerId: string | null = null;
    let referrerCodeParsed: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      referrerCodeParsed = body.referrerCode || null;
    } catch {
      // Body might be empty or invalid json
    }

    if (referrerCodeParsed) {
      const { data: referrer } = await supabase
        .from("referrals")
        .select("*")
        .eq("code", referrerCodeParsed)
        .neq("user_id", userId)
        .maybeSingle();

      if (referrer) {
        // Verify this user hasn't already been referred
        const { data: alreadyReferred } = await supabase
          .from("referral_signups")
          .select("id")
          .eq("referred_id", userId)
          .maybeSingle();

        if (!alreadyReferred) {
          referrerId = referrer.user_id;
        }
      }
    }

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 5. Create trial record
    const { error: insertError } = await supabase.from("trials").insert({
      user_id: userId,
      email,
      plan_type: "trial_free",
      status: "active",
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString(),
      converted_to_paid: false,
    });

    if (insertError) {
      console.error("Failed to insert free trial record:", insertError);
      return NextResponse.json(
        { error: "Failed to activate trial record in database." },
        { status: 500 }
      );
    }

    // 5.5 Credit Referrer if applicable
    if (referrerId) {
      try {
        await supabase.from("referral_signups").insert({
          referrer_id: referrerId,
          referred_id: userId,
        });

        const { data: refRecord } = await supabase
          .from("referrals")
          .select("*")
          .eq("user_id", referrerId)
          .maybeSingle();

        if (refRecord) {
          await supabase
            .from("referrals")
            .update({
              total_referrals: refRecord.total_referrals + 1,
              total_days_earned: refRecord.total_days_earned + 7,
            })
            .eq("user_id", referrerId);
        }

        const { data: referrerTrial } = await supabase
          .from("trials")
          .select("*")
          .eq("user_id", referrerId)
          .eq("status", "active")
          .gt("trial_end", new Date().toISOString())
          .maybeSingle();

        if (referrerTrial) {
          const currentEnd = new Date(referrerTrial.trial_end).getTime();
          const newEnd = new Date(currentEnd + 7 * 24 * 60 * 60 * 1000);
          await supabase
            .from("trials")
            .update({ trial_end: newEnd.toISOString() })
            .eq("id", referrerTrial.id);
        }
      } catch (refErr) {
        console.error("Failed to process referral credit:", refErr);
      }
    }

    // 6. Send welcome email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PharmPaper <noreply@pharmapaper.com>",
            to: email,
            subject: "🎉 Your 14-day Premium Trial has started!",
            text: `Welcome to PharmPaper Premium!\n\nYour free trial is now active until ${trialEnd.toDateString()}.\n\nYou now have full access to:\n✅ All study notes & PYQs\n✅ Unlimited PDF reading\n✅ Bookmarks & search\n✅ All semester content\n\nVisit your workspace to start studying!\n\nAfter 14 days, you can upgrade to retain premium access.`,
          }),
        });
      } catch (emailErr) {
        console.error("Resend welcome email delivery failed:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      trial_end: trialEnd.toISOString(),
      message: "14-day trial activated!",
    });
  } catch (error: any) {
    console.error("Error starting free trial:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
