import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { validateEnv } from "@/lib/env";
import PublicShell from "@/components/PublicShell";
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
  title: "PharmaPaper — Your Gateway to Excellence in Pharmacy Education",
  description: "Download verified, syllabus-oriented B.Pharm and D.Pharm lecture notes, unit summaries, and study resources.",
  keywords: ["PharmaPaper", "pharmacy notes", "B.Pharm notes", "D.Pharm notes", "pharmacy lecture notes"],
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
        <ClerkProvider afterSignOutUrl="/">
          <PublicShell>{children}</PublicShell>
        </ClerkProvider>
      </body>
    </html>
  );
}

