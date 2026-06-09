import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { checkRateLimit } from "@/lib/ratelimit";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    // 3. Request Input parsing
    const body = await req.json();
    const { amount, currency = "INR", receipt, plan_type = "premium_onetime" } = body;

    // 4. Validate and Override Amount based on plan_type to prevent price manipulation
    const PLAN_PRICES: Record<string, number> = {
      video_pass: 2000,          // ₹20
      video_monthly: 2000,       // ₹20
      premium_monthly: 19900,    // ₹199
      premium_yearly: 99900,     // ₹999
      yearly: 99900,             // ₹999
      premium_onetime: 99900,    // ₹999
    };

    const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
    let targetAmount: number;

    if (plan_type in PLAN_PRICES) {
      if (plan_type === "premium_onetime" && isTestMode && amount === 100) {
        // Allow ₹1 demo transaction only in test/sandbox mode
        targetAmount = 100;
      } else {
        targetAmount = PLAN_PRICES[plan_type];
      }
    } else {
      return NextResponse.json(
        { error: "Invalid plan type." },
        { status: 400 }
      );
    }

    // 5. Call Razorpay API to create order
    const options = {
      amount: Math.round(targetAmount), // in paise
      currency,
      receipt: receipt || `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 6. Log pending payment in DB
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);
    const { error: dbError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        status: "pending",
        plan_type,
        amount: targetAmount / 100, // paise to INR
        razorpay_order_id: order.id,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Database log failed for pending payment order:", dbError);
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Razorpay API error" },
      { status: 500 }
    );
  }
}
