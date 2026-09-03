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
  return {
    level: userId ? 'free' : 'none',
    canWatchVideos: true,
    canReadPDFs: true,
    canAccessPYQs: true,
    canTakeExams: true,
    canComment: !!userId,
    isTrial: false,
  };
}
