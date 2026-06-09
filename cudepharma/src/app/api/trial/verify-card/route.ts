import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
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

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await req.json();

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required verification parameters." },
        { status: 400 }
      );
    }

    // 3. Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay configuration error." },
        { status: 500 }
      );
    }

    const body = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Signature verification failed. Invalid transaction source." },
        { status: 400 }
      );
    }

    // 4. Update trial record to active
    const { data: trial, error: updateError } = await supabase
      .from("trials")
      .update({
        status: "active",
        razorpay_subscription_id,
      })
      .eq("user_id", userId)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (updateError || !trial) {
      console.error("Failed to update trial status on verification:", updateError);
      return NextResponse.json(
        { error: "No pending trial record matches this transaction." },
        { status: 404 }
      );
    }

    // 4.5 Credit Referrer if applicable
    if (trial && trial.referrer_id) {
      const referrerId = trial.referrer_id;
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

    // 5. Send welcome email using Resend
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
            to: trial.email,
            subject: "🎉 Your 14-day Premium Trial has started!",
            text: `Welcome to PharmPaper Premium!\n\nYour card-verified trial is now active.\n\nYou will have full premium access for 14 days. After 14 days, your subscription will renew automatically at ₹50/month. You can cancel at any time to prevent charges.\n\nStart studying now!`,
          }),
        });
      } catch (emailErr) {
        console.error("Welcome email delivery failed:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Signature verified and card trial activated!",
    });
  } catch (error: any) {
    console.error("Error verifying card trial:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
