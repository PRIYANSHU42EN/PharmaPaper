import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { privacyPolicy } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Privacy Policy | PharmaPaper",
  description:
    "Learn how PharmaPaper (pharmapaper.com) collects, uses, and protects your personal data. Read our full Privacy Policy.",
};

export default function PrivacyPage() {
  return <LegalPageLayout data={privacyPolicy} />;
}
