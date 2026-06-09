import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";
import SubjectClient from "./SubjectClient";

export const dynamic = "force-dynamic";

export default async function SubjectPage() {
  const { userId } = await auth();
  const initialPremiumStatus = await checkUserPremiumStatus(userId);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest">
          Loading Subject Units...
        </div>
      }
    >
      <SubjectClient initialPremiumStatus={initialPremiumStatus} />
    </Suspense>
  );
}
