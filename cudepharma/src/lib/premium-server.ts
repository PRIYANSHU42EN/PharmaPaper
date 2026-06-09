import { getUserAccess } from "./access";

export async function checkUserPremiumStatus(userId: string | null) {
  const access = await getUserAccess(userId);
  return {
    isPremium: access.canReadPDFs,
    isTrial: access.isTrial,
    daysLeft: access.daysLeft,
    trialEnd: access.expiresAt,
    level: access.level,
    canWatchVideos: access.canWatchVideos,
  };
}
