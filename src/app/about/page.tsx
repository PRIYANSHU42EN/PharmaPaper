import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { aboutUs } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "About Us | Pharmdbm",
  description: "Learn about Pharmdbm, our mission to support pharmacy students, and our curriculum-aligned study materials.",
};

export default function AboutPage() {
  return <LegalPageLayout data={aboutUs} />;
}
