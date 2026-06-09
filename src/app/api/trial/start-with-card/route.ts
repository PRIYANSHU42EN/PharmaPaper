import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/ratelimit";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    // 4. Check existing trial
    const { data: existing } = await supabase
      .from("trials")
      .select("status, id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.status !== "pending") {
        return NextResponse.json(
          { error: "You have already used or initialized a trial." },
          { status: 400 }
        );
      } else {
        // Delete pending trial to allow creating a new subscription session
        await supabase.from("trials").delete().eq("id", existing.id);
      }
    }

    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID;
    if (!planId) {
      return NextResponse.json(
        { error: "Razorpay Monthly Plan ID is not configured." },
        { status: 500 }
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

    // 5. Create Razorpay subscription starting in 14 days
    const trialDays = 14;
    const startAt = Math.floor(Date.now() / 1000) + trialDays * 24 * 60 * 60;

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      start_at: startAt,
    });

    const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    // 6. Log pending trial record
    const { error: insertError } = await supabase.from("trials").insert({
      user_id: userId,
      email,
      plan_type: "trial_card",
      status: "pending",
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString(),
      razorpay_subscription_id: subscription.id,
      converted_to_paid: false,
      referrer_id: referrerId,
    });

    if (insertError) {
      console.error("Failed to insert pending trial record:", insertError);
      return NextResponse.json(
        { error: "Failed to initialize trial transaction in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      trialDays,
    });
  } catch (error: any) {
    console.error("Error creating card trial:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
