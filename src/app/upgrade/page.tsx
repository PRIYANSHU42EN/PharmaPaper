"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pricing");
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest">
      Redirecting to pricing plans...
    </div>
  );
}
