import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch existing referral
    const { data: existingReferral, error: fetchError } = await supabase
      .from("referrals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingReferral) {
      return NextResponse.json({
        referral: {
          referral_code: existingReferral.code,
          total_referrals: existingReferral.total_referrals,
          total_days_earned: existingReferral.total_days_earned,
        },
      });
    }

    // 2. Generate referral code
    const user = await currentUser();
    let prefix = "REF";
    if (user?.firstName) {
      prefix = user.firstName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    } else if (user?.emailAddresses?.[0]?.emailAddress) {
      prefix = user.emailAddresses[0].emailAddress.split("@")[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
    }
    
    // Fallback if empty prefix
    if (!prefix) prefix = "REF";
    prefix = prefix.slice(0, 6);
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `${prefix}-${randomSuffix}`;

    // 3. Save to database
    const { data: newReferral, error: insertError } = await supabase
      .from("referrals")
      .insert({
        user_id: userId,
        code: referralCode,
        total_referrals: 0,
        total_days_earned: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert new referral:", insertError);
      return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
    }

    return NextResponse.json({
      referral: {
        referral_code: newReferral.code,
        total_referrals: newReferral.total_referrals,
        total_days_earned: newReferral.total_days_earned,
      },
    });
  } catch (error: any) {
    console.error("Error in referral generation route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
