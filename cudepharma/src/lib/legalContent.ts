// ================================================================
// PHARMPAPER — ALL LEGAL PAGES CONTENT
// Website: pharmapaper.com
//
// ✏️  TO EDIT ANY LEGAL PAGE:
//     Modify the text variables in this file.
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

// PAGE 1 — TERMS & CONDITIONS
export const termsAndConditions: LegalPageData = {
  title: "Terms & Conditions",
  lastUpdated: "June 2026",
  intro: "Welcome to PharmPaper (pharmapaper.com). By accessing or using our platform, you agree to be bound by the following Terms & Conditions.",
  sections: [
    {
      heading: "1. Acceptance",
      content: [
        "By accessing PharmPaper, you agree to these terms. PharmPaper provides study materials for B.Pharm and D.Pharm students for educational purposes only."
      ]
    },
    {
      heading: "2. Premium Access",
      content: [
        "Premium plans grant access to all study materials. Monthly plans renew automatically unless cancelled. Yearly plans are valid for 365 days from purchase."
      ]
    },
    {
      heading: "3. Content",
      content: [
        "All study materials are for personal educational use only. Redistribution is prohibited."
      ]
    },
    {
      heading: "4. Contact",
      content: [
        "Email: support@pharmapaper.com"
      ]
    }
  ],
  contactBlock: {
    email: "support@pharmapaper.com",
    city: "India",
    web: "pharmapaper.com"
  }
};

// PAGE 2 — PRIVACY POLICY
export const privacyPolicy: LegalPageData = {
  title: "Privacy Policy",
  lastUpdated: "June 2026",
  intro: "PharmPaper (pharmapaper.com) is committed to protecting your privacy. This policy explains what data we collect, how we use it, and how we protect it.",
  sections: [
    {
      heading: "1. Data We Collect",
      content: [
        "We collect your email, name, and payment information when you register or purchase a plan."
      ]
    },
    {
      heading: "2. How We Use It",
      content: [
        "Your data is used only to manage your account and provide access to study materials. We never sell your data."
      ]
    },
    {
      heading: "3. Payments",
      content: [
        "Payments are processed securely by Razorpay. We do not store your card details."
      ]
    },
    {
      heading: "4. Contact",
      content: [
        "Email: support@pharmapaper.com"
      ]
    }
  ],
  contactBlock: {
    email: "support@pharmapaper.com",
    city: "India",
    web: "pharmapaper.com"
  }
};

// PAGE 3 — REFUND & CANCELLATION POLICY
export const refundPolicy: LegalPageData = {
  title: "Refund & Cancellation Policy",
  lastUpdated: "June 2026",
  intro: "At PharmPaper (pharmapaper.com), we want you to be fully satisfied with your purchase. Please read our refund policy carefully before making a payment.",
  sections: [
    {
      heading: "Monthly Plans",
      content: [
        "You may cancel your monthly subscription anytime. No refund is issued for the current billing period. Access continues until the period ends."
      ]
    },
    {
      heading: "Yearly Plans",
      content: [
        "Refund requests within 7 days of purchase will be reviewed. After 7 days, no refunds are issued."
      ]
    },
    {
      heading: "How to Cancel",
      content: [
        "Email us at support@pharmapaper.com with your registered email and order ID."
      ]
    },
    {
      heading: "Processing Time",
      content: [
        "Approved refunds are processed within 5–7 business days to your original payment method."
      ]
    }
  ],
  contactBlock: {
    email: "support@pharmapaper.com",
    city: "India",
    web: "pharmapaper.com"
  }
};

// PAGE 4 — CONTACT US
export const contactUs: LegalPageData = {
  title: "Contact Us",
  lastUpdated: "June 2026",
  intro: "We'd love to hear from you! If you have any questions about our study materials, need help with your account, or want to report an issue — we're here to help.",
  sections: [
    {
      heading: "Contact Information",
      content: [
        "📧 Email: support@pharmapaper.com",
        "📍 India",
        "⏰ Response time: Within 24 hours"
      ]
    }
  ],
  contactBlock: {
    email: "support@pharmapaper.com",
    city: "India"
  }
};
