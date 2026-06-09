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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type = "premium_onetime", amount } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment fields" },
        { status: 400 }
      );
    }

    // 4. Generate & Compare Signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed. Signature mismatch." },
        { status: 400 }
      );
    }

    // 5. Log verified payment in the DB using Service Role client
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);
    
    // First, map plan_type to access_level and duration
    let access_level = 'premium';
    let durationDays = 365;

    if (plan_type === 'video_pass' || plan_type === 'video_monthly') {
      access_level = 'video_only';
      durationDays = 30;
    } else if (plan_type === 'premium_monthly' || plan_type === 'full_access') {
      access_level = 'premium';
      durationDays = 30;
    } else if (plan_type === 'premium_onetime' || plan_type === 'yearly') {
      access_level = 'premium';
      durationDays = 365;
    }

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // First, try to update existing pending record
    const { data: updatedData, error: updateError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id,
        access_level,
        expires_at: expiresAt,
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .select();

    if (updateError || !updatedData || updatedData.length === 0) {
      // Determine correct log amount to prevent client-side price manipulation on insert fallback
      let mappedAmount = 0;
      if (plan_type === 'video_pass' || plan_type === 'video_monthly') {
        mappedAmount = 20; // ₹20
      } else if (plan_type === 'premium_monthly' || plan_type === 'full_access') {
        mappedAmount = 199; // ₹199
      } else if (plan_type === 'premium_onetime' || plan_type === 'yearly' || plan_type === 'premium_yearly') {
        const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
        if (isTestMode && amount === 100) {
          mappedAmount = 1; // ₹1 demo transaction
        } else {
          mappedAmount = 999; // ₹999
        }
      }

      const { error: dbError } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          status: "paid",
          plan_type,
          access_level,
          amount: mappedAmount,
          razorpay_order_id,
          razorpay_payment_id,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error("Database logging failed for verified payment:", dbError);
      }
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error: any) {
    console.error("Payment verification exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
