import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { termsAndConditions } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Terms and Conditions | PharmaPaper",
  description:
    "Read the Terms and Conditions for accessing and using PharmaPaper (https://pharmapaper.dpdns.org), a free study platform for pharmacy students.",
  alternates: {
    canonical: "https://pharmapaper.dpdns.org/terms",
  },
  openGraph: {
    title: "Terms and Conditions | PharmaPaper",
    description:
      "Terms and Conditions governing personal, educational use of study notes and materials on PharmaPaper.",
    url: "https://pharmapaper.dpdns.org/terms",
    siteName: "PharmaPaper",
    type: "website",
  },
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms and Conditions — PharmaPaper",
    description:
      "Terms and Conditions for using PharmaPaper, detailing educational content use, intellectual property, and guidelines.",
    url: "https://pharmapaper.dpdns.org/terms",
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
      <LegalPageLayout data={termsAndConditions} />
    </>
  );
}
