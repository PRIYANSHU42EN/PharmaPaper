import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { disclaimer } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Disclaimer | Pharmdbm",
  description: "Educational disclaimer regarding notes and resources provided on Pharmdbm.",
};

export default function DisclaimerPage() {
  return <LegalPageLayout data={disclaimer} />;
}
