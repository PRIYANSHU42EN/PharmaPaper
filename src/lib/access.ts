import { createClient } from "@supabase/supabase-js";

export type AccessLevel =
  'none'       |   // not logged in
  'free'       |   // logged in, no plan
  'trial'      |   // 14-day free trial (full access)
  'video_only' |   // ₹20/month video pass
  'premium'    ;   // ₹50/month or yearly (full access)

export interface AccessResult {
  level: AccessLevel;
  canWatchVideos: boolean;   // video_only, trial, premium
  canReadPDFs: boolean;      // trial, premium only
  canAccessPYQs: boolean;    // trial, premium only
  canTakeExams: boolean;     // trial, premium only
  canComment: boolean;       // video_only, trial, premium
  isTrial: boolean;
  daysLeft?: number;
  expiresAt?: string;
}

export async function getUserAccess(userId: string | null | undefined): Promise<AccessResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  // 1. Not logged in
  if (!userId) {
    return {
      level: 'none',
      canWatchVideos: false,
      canReadPDFs: false,
      canAccessPYQs: false,
      canTakeExams: false,
      canComment: false,
      isTrial: false,
    };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration in access.ts");
    return {
      level: 'free',
      canWatchVideos: false,
      canReadPDFs: false,
      canAccessPYQs: false,
      canTakeExams: false,
      canComment: false,
      isTrial: false,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 2. Check active free trial status (Full Access)
  const { data: trial } = await supabase
    .from("trials")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (trial) {
    const trialEndTime = new Date(trial.trial_end).getTime();
    const now = Date.now();
    if (trialEndTime > now) {
      const daysLeft = Math.ceil((trialEndTime - now) / (1000 * 60 * 60 * 24));
      return {
        level: 'trial',
        canWatchVideos: true,
        canReadPDFs: true,
        canAccessPYQs: true,
        canTakeExams: true,
        canComment: true,
        isTrial: true,
        daysLeft,
        expiresAt: trial.trial_end,
      };
    }
  }

  // 3. Check paid access status
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payment) {
    const expiresAtMs = payment.expires_at ? new Date(payment.expires_at).getTime() : null;
    if (!expiresAtMs || expiresAtMs > Date.now()) {
      // Determine access level (backwards-compatible check)
      let level: AccessLevel = 'premium';
      if (payment.access_level === 'video_only' || payment.plan_type === 'video_monthly') {
        level = 'video_only';
      }

      return {
        level,
        canWatchVideos: true,
        canReadPDFs: level === 'premium',
        canAccessPYQs: level === 'premium',
        canTakeExams: level === 'premium',
        canComment: true,
        isTrial: false,
        expiresAt: payment.expires_at,
      };
    }
  }

  // 4. Logged in, but no active subscription/trial
  return {
    level: 'free',
    canWatchVideos: false,
    canReadPDFs: false,
    canAccessPYQs: false,
    canTakeExams: false,
    canComment: false,
    isTrial: false,
  };
}
