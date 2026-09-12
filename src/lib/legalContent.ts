// ================================================================
// PHARMAPAPER — ALL LEGAL & INFORMATIONAL PAGES CONTENT
// Live Domain: https://pharmapaper.dpdns.org
// Official Support Email: pharmapaperofficial@zohomail.in
// Date of Last Update: September 6, 2026
// ================================================================

export interface LegalSection {
  heading: string;
  content: string[];
}

export interface ContactBlock {
  email: string;
  city: string;
  web?: string;
}

export interface LegalPageData {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
  contactBlock?: ContactBlock;
}

// ----------------------------------------------------------------
// PAGE 1 — ABOUT US
// ----------------------------------------------------------------
export const aboutUs: LegalPageData = {
  title: "About Us",
  lastUpdated: "September 6, 2026",
  intro:
    "PharmaPaper is a free, syllabus-aligned study resource built for B.Pharm and D.Pharm students across India. We started PharmaPaper with one simple idea: every pharmacy student deserves easy, free access to clean, well-organized notes — without ads blocking every page, without paywalls, and without hunting across a dozen different websites for one missing unit.",
  sections: [
    {
      heading: "What We Offer",
      content: [
        "• Unit-wise notes for every B.Pharm semester (1st to 8th) and D.Pharm year, mapped to the current PCI syllabus",
        "• Direct, verified downloads with no confusing redirects",
        "• Career updates and exam guides to help you stay on top of opportunities",
        "• A growing, community-driven space where students can discuss and learn together",
      ],
    },
    {
      heading: "Our Mission",
      content: [
        "To make quality pharmacy education material accessible to every student, regardless of where they study or what they can afford. Education shouldn't come with a price tag or a paywall.",
      ],
    },
    {
      heading: "The Team",
      content: [
        "• **Priyanshu Nayak** — Founder",
        "• **Aayan Verma** — Co-Founder",
        "• **Parmashwar Devaangan** — Chief Operating Officer (COO)",
        "We're a small team that genuinely cares about pharmacy education in India, and we're building PharmaPaper one semester at a time.",
      ],
    },
    {
      heading: "Get In Touch",
      content: [
        "Have a suggestion, found an error in a note, or just want to say hi? Reach out at **pharmapaperofficial@zohomail.in** — we read every message.",
      ],
    },
  ],
  contactBlock: {
    email: "pharmapaperofficial@zohomail.in",
    city: "India",
    web: "pharmapaper.dpdns.org",
  },
};

// ----------------------------------------------------------------
// PAGE 2 — CONTACT US
// ----------------------------------------------------------------
export const contactUs: LegalPageData = {
  title: "Contact Us",
  lastUpdated: "September 6, 2026",
  intro:
    "We'd love to hear from you — whether it's a question about a specific unit, a correction to a note, a partnership idea, or just feedback on the site.",
  sections: [
    {
      heading: "Get in Touch",
      content: [
        "**Email:** pharmapaperofficial@zohomail.in",
        "We typically reply within 24–48 hours.",
      ],
    },
    {
      heading: "What to contact us about",
      content: [
        "• Reporting a broken download link or missing PDF",
        "• Suggesting a subject, unit, or correction",
        "• Career or exam guide submissions",
        "• Partnership or collaboration inquiries",
        "• General feedback",
      ],
    },
    {
      heading: "Community Channels",
      content: [
        "You can also reach us through the Telegram, WhatsApp, or YouTube links in the sidebar for quicker responses.",
      ],
    },
  ],
  contactBlock: {
    email: "pharmapaperofficial@zohomail.in",
    city: "India",
    web: "pharmapaper.dpdns.org",
  },
};

// ----------------------------------------------------------------
// PAGE 3 — PRIVACY POLICY
// ----------------------------------------------------------------
export const privacyPolicy: LegalPageData = {
  title: "Privacy Policy",
  lastUpdated: "September 6, 2026",
  intro:
    "PharmaPaper (\"we\", \"us\", \"our\") operates https://pharmapaper.dpdns.org. This page explains what information we collect, how we use it, and your rights regarding that information.",
  sections: [
    {
      heading: "Information We Collect",
      content: [
        "• **Comments:** If you leave a comment on a semester, subject, or unit page, we collect the name, email address, and (optionally) website you provide. Your email is never shown publicly.",
        "• **Usage data:** We may collect basic, non-identifying analytics (such as which notes are downloaded most) to help us understand what to improve. This isn't tied to your personal identity.",
        "• **Cookies:** We use only the minimal cookies necessary for the site to function (e.g., keeping an admin logged in). We don't use third-party advertising cookies.",
      ],
    },
    {
      heading: "How We Use Your Information",
      content: [
        "• To display approved comments on the relevant page",
        "• To respond to inquiries sent to pharmapaperofficial@zohomail.in",
        "• To improve the site's content and structure based on usage patterns",
      ],
    },
    {
      heading: "Third-Party Services",
      content: [
        "We use Supabase for our database and file storage. Your comment data is stored securely there and is never sold or shared with any other third party.",
      ],
    },
    {
      heading: "Your Rights",
      content: [
        "You can request that we delete a comment you've posted by emailing us the details. We'll act on reasonable requests promptly.",
      ],
    },
    {
      heading: "Children's Privacy",
      content: [
        "PharmaPaper is intended for pharmacy students, generally 17 years of age or older. We do not knowingly collect information from children under 13.",
      ],
    },
    {
      heading: "Changes to This Policy",
      content: [
        "We may update this policy from time to time. Continued use of the site after changes means you accept the updated policy.",
      ],
    },
    {
      heading: "Contact",
      content: [
        "Questions about this policy? Email us at **pharmapaperofficial@zohomail.in**.",
      ],
    },
  ],
  contactBlock: {
    email: "pharmapaperofficial@zohomail.in",
    city: "India",
    web: "pharmapaper.dpdns.org",
  },
};

// ----------------------------------------------------------------
// PAGE 4 — TERMS AND CONDITIONS
// ----------------------------------------------------------------
export const termsAndConditions: LegalPageData = {
  title: "Terms and Conditions",
  lastUpdated: "September 6, 2026",
  intro:
    "By accessing or using https://pharmapaper.dpdns.org (\"PharmaPaper\", \"the site\"), you agree to these Terms and Conditions. If you do not agree, please don't use the site.",
  sections: [
    {
      heading: "Use of Content",
      content: [
        "All notes, guides, and materials on PharmaPaper are provided free of charge for personal, educational use only. You may download and use them for your own study purposes. You may not redistribute, resell, or republish our compiled notes elsewhere without written permission from PharmaPaper.",
      ],
    },
    {
      heading: "Accuracy of Content",
      content: [
        "Notes on PharmaPaper are compiled to align with the PCI syllabus as a study aid. While we take care to keep content accurate and up to date, we don't guarantee that every note is error-free or complete. Always cross-check critical information against your official textbooks and university curriculum before an exam.",
      ],
    },
    {
      heading: "User Comments",
      content: [
        "When you post a comment, you agree not to post anything abusive, spammy, unlawful, or infringing on someone else's rights. We reserve the right to remove any comment and, if necessary, block repeat offenders.",
      ],
    },
    {
      heading: "Intellectual Property",
      content: [
        "The PharmaPaper name, logo, and site design are the property of PharmaPaper. Subject and unit names follow the publicly available PCI syllabus structure and are not owned by us.",
      ],
    },
    {
      heading: "Limitation of Liability",
      content: [
        "PharmaPaper is provided \"as is.\" We are not liable for any loss or damage arising from your use of the site, including exam outcomes based on our notes. Use them as a supplement to your official study material, not a replacement.",
      ],
    },
    {
      heading: "Changes to These Terms",
      content: [
        "We may update these terms occasionally. Continued use of the site after an update means you accept the revised terms.",
      ],
    },
    {
      heading: "Governing Law",
      content: [
        "These terms are governed by the laws of India.",
      ],
    },
    {
      heading: "Contact",
      content: [
        "Questions about these terms? Email **pharmapaperofficial@zohomail.in**.",
      ],
    },
  ],
  contactBlock: {
    email: "pharmapaperofficial@zohomail.in",
    city: "India",
    web: "pharmapaper.dpdns.org",
  },
};

// ----------------------------------------------------------------
// PAGE 5 — DISCLAIMER
// ----------------------------------------------------------------
export const disclaimer: LegalPageData = {
  title: "Disclaimer",
  lastUpdated: "September 6, 2026",
  intro:
    "PharmaPaper (https://pharmapaper.dpdns.org) is an independent, student-run educational resource. We are not officially affiliated with, endorsed by, or connected to the Pharmacy Council of India (PCI), any university, or any examination board, unless explicitly stated otherwise.",
  sections: [
    {
      heading: "Educational Purpose Only",
      content: [
        "All notes, guides, and materials on this site are intended for educational reference and exam preparation support only. They are not a substitute for your official textbooks, class lectures, or university-prescribed curriculum.",
      ],
    },
    {
      heading: "No Guarantee of Accuracy",
      content: [
        "While we make a genuine effort to keep our content accurate and aligned with the current syllabus, pharmacy curricula can change, and errors can occur in any compiled study material. PharmaPaper makes no warranty, express or implied, about the completeness, reliability, or accuracy of the information provided.",
      ],
    },
    {
      heading: "Not Medical or Professional Advice",
      content: [
        "Nothing on this site constitutes medical, pharmaceutical, or professional advice. Content here is purely for academic study and should never be used as a basis for clinical or medical decision-making.",
      ],
    },
    {
      heading: "External Links",
      content: [
        "Our site may link to external resources (career updates, exam boards, etc.). We are not responsible for the content or accuracy of external websites.",
      ],
    },
    {
      heading: "Use at Your Own Discretion",
      content: [
        "By using PharmaPaper, you acknowledge that any decisions made based on the content here — academic or otherwise — are your own responsibility.",
      ],
    },
    {
      heading: "Contact",
      content: [
        "Questions about this disclaimer? Email **pharmapaperofficial@zohomail.in**.",
      ],
    },
  ],
  contactBlock: {
    email: "pharmapaperofficial@zohomail.in",
    city: "India",
    web: "pharmapaper.dpdns.org",
  },
};

// ----------------------------------------------------------------
// LEGACY / COMPATIBILITY EXPORTS
// ----------------------------------------------------------------
export const refundPolicy: LegalPageData = {
  title: "Refund & Cancellation Policy",
  lastUpdated: "September 6, 2026",
  intro:
    "All core study notes and materials on PharmaPaper (https://pharmapaper.dpdns.org) are completely free. If you have any inquiries regarding services or sponsorships, please contact us directly.",
  sections: [
    {
      heading: "Free Academic Access",
      content: [
        "All notes and study resources are offered at zero cost to students across India. There are no mandatory subscription fees or hidden download charges.",
      ],
    },
    {
      heading: "Contact for Inquiries",
      content: [
        "For any billing, partnership, or general inquiries, email us at **pharmapaperofficial@zohomail.in**.",
      ],
    },
  ],
  contactBlock: {
    email: "pharmapaperofficial@zohomail.in",
    city: "India",
    web: "pharmapaper.dpdns.org",
  },
};
