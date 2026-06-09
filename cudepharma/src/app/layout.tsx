import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { validateEnv } from "@/lib/env";
import TrialBanner from "@/components/TrialBanner";
import PWALoader from "@/components/PWALoader";
import "./globals.css";

validateEnv();

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PharmPaper | Your Complete Pharmacy Study Vault",
  description: "Access all B Pharm and D Pharm semester notes, previous year question papers, and study materials in one clean, distraction-free platform.",
  keywords: ["PharmPaper", "pharmacy notes", "B Pharm notes", "D Pharm notes", "pharmacy papers", "study vault"],
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${bebasNeue.variable} ${inter.variable} min-h-full bg-[#0f0f0f] text-[#f0ece4] font-sans antialiased overflow-x-hidden`}
        suppressHydrationWarning
      >
        <ClerkProvider afterSignOutUrl="/">
          <PWALoader />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <TrialBanner />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

