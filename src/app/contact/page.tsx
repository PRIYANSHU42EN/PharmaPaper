import type { Metadata } from "next";
import LegalPageLayout from "@/components/LegalPageLayout";
import { contactUs } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: "Contact Us | PharmPaper",
  description:
    "Get in touch with PharmPaper support. We help with accounts, payments, refunds, technical issues, and more.",
};

export default function ContactPage() {
  return <LegalPageLayout data={contactUs} />;
}
