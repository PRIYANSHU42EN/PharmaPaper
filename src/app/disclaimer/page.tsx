import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { disclaimer } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Disclaimer | PharmaPaper",
  description:
    "PharmaPaper is an independent, student-run educational resource. Read our full disclaimer regarding academic accuracy, affiliation, and medical advice.",
  alternates: {
    canonical: "https://pharmapaper.dpdns.org/disclaimer",
  },
  openGraph: {
    title: "Disclaimer | PharmaPaper",
    description:
      "Educational disclaimer regarding notes and study materials provided on PharmaPaper (https://pharmapaper.dpdns.org).",
    url: "https://pharmapaper.dpdns.org/disclaimer",
    siteName: "PharmaPaper",
    type: "website",
  },
};

export default function DisclaimerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Disclaimer — PharmaPaper",
    description:
      "Educational disclaimer regarding notes and study materials provided on PharmaPaper.",
    url: "https://pharmapaper.dpdns.org/disclaimer",
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
      <LegalPageLayout data={disclaimer} />
    </>
  );
}
