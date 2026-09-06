import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { privacyPolicy } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Privacy Policy | PharmaPaper",
  description:
    "Learn what information PharmaPaper (https://pharmapaper.dpdns.org) collects, how we use it, and your rights regarding that information.",
  alternates: {
    canonical: "https://pharmapaper.dpdns.org/privacy",
  },
  openGraph: {
    title: "Privacy Policy | PharmaPaper",
    description:
      "Privacy Policy for PharmaPaper (https://pharmapaper.dpdns.org) — transparent data practices for pharmacy students.",
    url: "https://pharmapaper.dpdns.org/privacy",
    siteName: "PharmaPaper",
    type: "website",
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy — PharmaPaper",
    description:
      "Official privacy policy for PharmaPaper, explaining data collection, comment storage, and user rights.",
    url: "https://pharmapaper.dpdns.org/privacy",
    isPartOf: {
      "@type": "WebSite",
      name: "PharmaPaper",
      url: "https://pharmapaper.dpdns.org",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageLayout data={privacyPolicy} />
    </>
  );
}
