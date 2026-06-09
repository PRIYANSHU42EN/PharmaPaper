import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { refundPolicy } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | PharmPaper",
  description:
    "Understand PharmPaper's refund eligibility, cancellation process, and processing timelines for premium plans.",
};

export default function RefundPage() {
  return <LegalPageLayout data={refundPolicy} />;
}
