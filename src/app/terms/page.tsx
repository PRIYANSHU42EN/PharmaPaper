import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { termsAndConditions } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Terms & Conditions | PharmPaper",
  description:
    "Read the Terms & Conditions for using PharmPaper (pharmapaper.com), an educational platform for B. Pharm and D. Pharm students.",
};

export default function TermsPage() {
  return <LegalPageLayout data={termsAndConditions} />;
}
