import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { contactUs } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Contact Us | PharmaPaper",
  description:
    "Get in touch with PharmaPaper. Reach out at pharmapaperofficial@zohomail.in for note corrections, questions, partnerships, or suggestions.",
  alternates: {
    canonical: "https://pharmapaper.dpdns.org/contact",
  },
  openGraph: {
    title: "Contact Us | PharmaPaper",
    description:
      "Get in touch with the PharmaPaper team. We typically reply within 24–48 hours.",
    url: "https://pharmapaper.dpdns.org/contact",
    siteName: "PharmaPaper",
    type: "website",
  },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact PharmaPaper",
    description: "Get in touch with the PharmaPaper team.",
    url: "https://pharmapaper.dpdns.org/contact",
    mainEntity: {
      "@type": "Organization",
      name: "PharmaPaper",
      url: "https://pharmapaper.dpdns.org",
      email: "pharmapaperofficial@zohomail.in",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageLayout data={contactUs} />
    </>
  );
}
