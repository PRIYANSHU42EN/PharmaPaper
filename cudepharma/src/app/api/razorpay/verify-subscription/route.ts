import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/ratelimit";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const { blocked, headers } = await checkRateLimit("payment", ip);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many requests. Try again in 1 minute." },
        { status: 429, headers }
      );
    }

    // 2. Auth Check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse and Validate Fields
    const body = await req.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required subscription payment fields" },
        { status: 400 }
      );
    }

    // 4. Generate & Compare Signature
    // For subscriptions, the signature is verified by hashing:
    // razorpay_payment_id + '|' + razorpay_subscription_id
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Subscription verification failed. Signature mismatch." },
        { status: 400 }
      );
    }

    // 5. Update database using Service Role client
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);

    // Fetch existing payment to determine plan details
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("razorpay_subscription_id", razorpay_subscription_id)
      .maybeSingle();

    const planType = existingPayment?.plan_type || "premium_monthly";
    const durationDays = planType === "premium_yearly" ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const access_level = "premium";

    // Try updating first
    const { data: updatedData, error: updateError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id,
        access_level,
        expires_at: expiresAt,
      })
      .eq("razorpay_subscription_id", razorpay_subscription_id)
      .select();

    if (updateError || !updatedData || updatedData.length === 0) {
      // If no pending record exists, insert a new paid record
      const { error: insertError } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          status: "paid",
          plan_type: planType,
          access_level,
          amount: planType === "premium_yearly" ? 999 : 199,
          razorpay_subscription_id,
          razorpay_payment_id,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Database insert failed for verified subscription:", insertError);
        return NextResponse.json({ error: "Failed to persist subscription details" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Subscription verified successfully" });
  } catch (error: any) {
    console.error("Subscription verification exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during subscription verification" },
      { status: 500 }
    );
  }
}
