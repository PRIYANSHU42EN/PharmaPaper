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
    const { plan_type } = body;

    if (!plan_type || (plan_type !== "premium_monthly" && plan_type !== "premium_yearly")) {
      return NextResponse.json(
        { error: "Invalid plan type. Must be premium_monthly or premium_yearly." },
        { status: 400 }
      );
    }

    // 4. Determine Razorpay plan parameters
    const period = plan_type === "premium_yearly" ? "yearly" : "monthly";
    const amount = plan_type === "premium_yearly" ? 99900 : 19900; // in paise
    const planName = plan_type === "premium_yearly" ? "PharmPaper Pro Yearly" : "PharmPaper Pro Monthly";

    // 5. Query existing plans to avoid duplicate creations
    const plansList = await razorpay.plans.all();
    let plan = plansList.items?.find(
      (p: any) => p.period === period && p.item.amount === amount && p.item.active
    );

    if (!plan) {
      plan = await razorpay.plans.create({
        period,
        interval: 1,
        item: {
          name: planName,
          amount,
          currency: "INR",
          description: `${planName} subscription plan`
        }
      });
    }

    // 6. Create Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      total_count: plan_type === "premium_yearly" ? 5 : 60, // 5 cycles (years) or 60 cycles (months)
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId,
        plan_type: plan_type
      }
    });

    // 7. Log pending subscription in DB
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);
    const { error: dbError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        status: "pending",
        plan_type,
        amount: amount / 100, // paise to INR
        razorpay_subscription_id: subscription.id,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Database log failed for pending subscription:", dbError);
    }

    return NextResponse.json({
      subscription_id: subscription.id,
      plan_id: plan.id,
    });
  } catch (error: any) {
    console.error("Razorpay subscription creation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Razorpay API error" },
      { status: 500 }
    );
  }
}
