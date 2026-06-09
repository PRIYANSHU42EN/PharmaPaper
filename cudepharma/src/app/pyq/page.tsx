import { Suspense } from "react";
import { fetchSyllabusData } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { checkUserPremiumStatus } from "@/lib/premium-server";
import PYQClient from "./PYQClient";

export const dynamic = "force-dynamic";

export default async function PYQPage() {
  const syllabusData = await fetchSyllabusData();
  const { userId } = await auth();
  const initialPremiumStatus = await checkUserPremiumStatus(userId);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest">
          Loading Question Papers...
        </div>
      }
    >
      <PYQClient syllabusData={syllabusData} initialPremiumStatus={initialPremiumStatus} />
    </Suspense>
  );
}
