import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { aboutUs } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "About Us | PharmaPaper",
  description:
    "PharmaPaper is a free, syllabus-aligned study resource built for B.Pharm and D.Pharm students across India. Learn about our mission and team.",
  alternates: {
    canonical: "https://pharmapaper.dpdns.org/about",
  },
  openGraph: {
    title: "About Us | PharmaPaper",
    description:
      "PharmaPaper is a free, syllabus-aligned study resource built for B.Pharm and D.Pharm students across India.",
    url: "https://pharmapaper.dpdns.org/about",
    siteName: "PharmaPaper",
    type: "website",
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About PharmaPaper",
    description:
      "PharmaPaper is a free, syllabus-aligned study resource built for B.Pharm and D.Pharm students across India.",
    url: "https://pharmapaper.dpdns.org/about",
    mainEntity: {
      "@type": "Organization",
      name: "PharmaPaper",
      url: "https://pharmapaper.dpdns.org",
      email: "pharmapaperofficial@zohomail.in",
      founder: [
        { "@type": "Person", name: "Priyanshu Nayak", jobTitle: "Founder" },
        { "@type": "Person", name: "Aayan Verma", jobTitle: "Co-Founder" },
        { "@type": "Person", name: "Parmashwar Devaangan", jobTitle: "Chief Operating Officer" },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageLayout data={aboutUs} />
    </>
  );
}
