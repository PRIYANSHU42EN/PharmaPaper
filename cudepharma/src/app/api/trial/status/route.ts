import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";

export async function GET() {
  try {
    const { userId } = await auth();
    const status = await checkUserPremiumStatus(userId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Error checking premium status:", error);
    return NextResponse.json({ isPremium: false, isTrial: false });
  }
}
