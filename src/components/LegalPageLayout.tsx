"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { LegalPageData } from "@/lib/legalContent";
import { getSettings } from "@/lib/supabase";

interface LegalPageLayoutProps {
  data: LegalPageData;
}

// Animation presets
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const legalNav = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
  { href: "/contact", label: "Contact" },
];

export default function LegalPageLayout({ data }: LegalPageLayoutProps) {
  const [siteName, setSiteName] = useState("PharmPaper");
  const [siteEmail, setSiteEmail] = useState(data.contactBlock?.email || "admin@pharmapaper.com");

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.sitename) {
        setSiteName(settings.sitename);
      }
      if (settings?.email) {
        setSiteEmail(settings.email);
      }
    });
  }, [data.contactBlock?.email]);

  const renderLogo = (name: string) => {
    if (name.toLowerCase() === "pharmpaper" || name.toLowerCase() === "pharma paper") {
      return (
        <>
          PHARM
          <span className="text-brand">PAPER</span>
        </>
      );
    }
    const parts = name.split(" ");
    if (parts.length <= 1) {
      return <span>{name.toUpperCase()}</span>;
    }
    return (
      <>
        {parts[0].toUpperCase()}
        <span className="text-brand"> {parts.slice(1).join(" ").toUpperCase()}</span>
      </>
    );
  };

  return (
    <div className="relative min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white">
      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] ambient-brand-glow pointer-events-none opacity-40" />

      {/* ─── Floating Glass Header ─── */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl h-16 glass-panel border-brand-border rounded-full flex items-center justify-between px-8 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-3 h-3 rounded-full bg-brand shadow-[0_0_10px_rgba(142,146,144,0.8)] group-hover:shadow-[0_0_18px_rgba(142,146,144,1)] transition-shadow animate-pulse" />
          <span className="font-bebas text-2xl tracking-wider text-brand-cream font-bold">
            {renderLogo(siteName)}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-[11px] font-semibold tracking-wider uppercase text-brand-cream/50">
          {legalNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-brand transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="px-5 py-2 rounded-full glass-panel border border-brand-border hover:border-brand text-brand-cream/80 hover:text-brand-cream font-semibold text-[11px] tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          ← Home
        </Link>
      </header>

      {/* ─── Main Content ─── */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Page Title */}
          <motion.div variants={itemVariants} className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-brand-border text-brand text-[10px] uppercase font-bold tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              Legal
            </div>
            <h1 className="font-bebas text-5xl md:text-7xl text-brand-cream uppercase tracking-tight leading-[0.95] mb-4">
              {data.title.split(" ").map((word, i) => (
                <span key={i}>
                  {i === data.title.split(" ").length - 1 ? (
                    <span className="text-brand">{word}</span>
                  ) : (
                    word
                  )}{" "}
                </span>
              ))}
            </h1>
            <p className="text-brand-cream/30 text-xs tracking-widest uppercase font-mono">
              Last Updated: {data.lastUpdated}
            </p>
          </motion.div>

          {/* Intro paragraph */}
          {data.intro && (
            <motion.div
              variants={itemVariants}
              className="glass-panel rounded-2xl p-6 md:p-8 border border-brand-border mb-10"
            >
              <p className="text-brand-cream/70 text-sm md:text-base leading-relaxed">
                {data.intro}
              </p>
            </motion.div>
          )}

          {/* Sections */}
          {data.sections.map((section, idx) => (
            <motion.section
              key={idx}
              variants={itemVariants}
              className="mb-8"
            >
              {/* Section heading with left accent bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full bg-brand" />
                <h2 className="font-bebas text-2xl md:text-3xl text-brand-cream uppercase tracking-wide">
                  {section.heading}
                </h2>
              </div>

              {/* Section content */}
              <div className="pl-5 border-l border-brand-border/30 ml-[2px]">
                {section.content.map((line, lineIdx) => {
                  const isBullet = line.startsWith("• ");
                  const isCheckItem = line.startsWith("• ✅");
                  return (
                    <div
                      key={lineIdx}
                      className={`${
                        isBullet
                          ? "flex items-start gap-2.5 mb-2"
                          : "mb-3"
                      }`}
                    >
                      {isBullet ? (
                        <>
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand/60 shrink-0" />
                          <p className="text-brand-cream/60 text-sm leading-relaxed">
                            {isCheckItem
                              ? line.replace("• ✅ ", "")
                              : line.replace("• ", "")}
                            {isCheckItem && (
                              <span className="ml-1 text-green-400/60">✓</span>
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="text-brand-cream/60 text-sm leading-relaxed">
                          {line}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}

          {/* Contact block */}
          {data.contactBlock && (
            <motion.div
              variants={itemVariants}
              className="glass-panel rounded-2xl p-6 md:p-8 border border-brand/20 mt-12"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-subtle border border-brand/25 flex items-center justify-center text-brand text-lg">
                  📧
                </div>
                <h3 className="font-bebas text-2xl text-brand-cream uppercase tracking-wide">
                  Get In Touch
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-brand-cream/70">
                  <span className="text-brand-cream/40 uppercase tracking-wider text-[10px] font-semibold mr-2">
                    Email
                  </span>
                  <a
                    href={`mailto:${siteEmail}`}
                    className="text-brand hover:text-brand-dark transition-colors underline underline-offset-4"
                  >
                    {siteEmail}
                  </a>
                </p>
                <p className="text-brand-cream/70">
                  <span className="text-brand-cream/40 uppercase tracking-wider text-[10px] font-semibold mr-2">
                    Location
                  </span>
                  {data.contactBlock.city}
                </p>
                {data.contactBlock.web && (
                  <p className="text-brand-cream/70">
                    <span className="text-brand-cream/40 uppercase tracking-wider text-[10px] font-semibold mr-2">
                      Web
                    </span>
                    <a
                      href={`https://${data.contactBlock.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:text-brand-dark transition-colors underline underline-offset-4"
                    >
                      {data.contactBlock.web}
                    </a>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* ─── Legal Cross-Nav Footer ─── */}
      <footer className="relative z-10 border-t border-brand-border/30">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Quick links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {legalNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="glass-panel glass-panel-hover rounded-xl p-4 text-center border border-brand-border text-brand-cream/60 hover:text-brand text-xs font-semibold tracking-wider uppercase transition-all duration-300"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center space-y-2">
            <p className="text-[10px] text-brand-cream/30 uppercase tracking-widest">
              © 2026 {siteName} | pharmapaper.com
            </p>
            <p className="text-[10px] text-brand-cream/20 uppercase tracking-widest">
              Owner: Priyansh Nayak & Aayan Verma
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
