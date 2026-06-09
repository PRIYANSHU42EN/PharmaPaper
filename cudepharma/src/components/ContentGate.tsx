import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";
import UpgradePrompt from "./UpgradePrompt";

interface ContentGateProps {
  children: ReactNode;
  message?: string;
}

export default async function ContentGate({ children, message }: ContentGateProps) {
  const { userId } = await auth();
  const premiumStatus = await checkUserPremiumStatus(userId);

  if (!premiumStatus.isPremium) {
    return <UpgradePrompt message={message} />;
  }

  return <>{children}</>;
}
