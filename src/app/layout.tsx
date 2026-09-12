import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { validateEnv } from "@/lib/env";
import PublicShell from "@/components/PublicShell";
import "./globals.css";

validateEnv();

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const siteUrl = (() => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }
  return "https://pharmapaper.dpdns.org";
})();

const productionDomain = "https://pharmapaper.dpdns.org";
const ogImageUrl = `${productionDomain}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PharmaPaper — Your Gateway to Excellence in Pharmacy Education",
    template: "%s | PharmaPaper",
  },
  description: "Free B.Pharm and D.Pharm study notes, syllabus-aligned lecture notes, unit summaries, and study resources.",
  keywords: ["PharmaPaper", "pharmacy notes", "B.Pharm notes", "D.Pharm notes", "pharmacy lecture notes", "PCI syllabus"],
  alternates: {
    canonical: productionDomain,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "PharmaPaper",
    description: "Free B.Pharm and D.Pharm study notes, syllabus-aligned lecture notes, unit summaries, and study resources.",
    url: productionDomain,
    siteName: "PharmaPaper",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "PharmaPaper — Free B.Pharm and D.Pharm Study Notes",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PharmaPaper",
    description: "Free B.Pharm and D.Pharm study notes, syllabus-aligned lecture notes, unit summaries, and study resources.",
    images: [ogImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${bebasNeue.variable} ${inter.variable} min-h-full bg-[#F9FAFB] text-slate-900 font-sans antialiased`}
        suppressHydrationWarning
      >
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}

