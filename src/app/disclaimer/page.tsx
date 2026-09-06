import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { disclaimer } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Disclaimer | PharmaPaper",
  description: "Educational disclaimer regarding notes and resources provided on PharmaPaper.",
};

export default function DisclaimerPage() {
  return <LegalPageLayout data={disclaimer} />;
}
