import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { privacyPolicy } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Privacy Policy | PharmaPaper",
  description: "Privacy policy for PharmaPaper visitors and students.",
};

export default function PrivacyPolicyPage() {
  return <LegalPageLayout data={privacyPolicy} />;
}
