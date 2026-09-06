"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Mail, Sparkles, ExternalLink, Send, MessageCircle } from "lucide-react";
import type { LegalPageData } from "@/lib/legalContent";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface LegalPageLayoutProps {
  data: LegalPageData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

/**
 * Inline text parser that handles **bold** tokens, emails, and live site URLs
 */
function FormattedInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold text-slate-950">
              {boldText}
            </strong>
          );
        }

        // Split URLs or emails inside normal text
        const subParts = part.split(/(https:\/\/pharmapaper\.dpdns\.org|pharmapaperofficial@zohomail\.in)/g);
        if (subParts.length > 1) {
          return subParts.map((sub, j) => {
            if (sub === "https://pharmapaper.dpdns.org") {
              return (
                <Link
                  key={j}
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition-colors"
                >
                  {sub}
                </Link>
              );
            }
            if (sub === "pharmapaperofficial@zohomail.in") {
              return (
                <a
                  key={j}
                  href={`mailto:${sub}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition-colors"
                >
                  {sub}
                </a>
              );
            }
            return <span key={j}>{sub}</span>;
          });
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function LegalPageLayout({ data }: LegalPageLayoutProps) {
  return (
    <div className="py-8 sm:py-12 bg-[#F9FAFB] min-h-screen text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-blue-600 font-bold">{data.title}</span>
        </nav>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header Card */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Official Information & Guidelines</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
              {data.title}
            </h1>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1">
              <span>Last Updated: {data.lastUpdated}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                PharmaPaper Verified
              </span>
            </div>

            {data.intro && (
              <div className="text-slate-600 text-sm sm:text-base leading-relaxed pt-2 border-t border-slate-100">
                <FormattedInline text={data.intro} />
              </div>
            )}
          </motion.div>

          {/* Policy / Info Sections */}
          <div className="space-y-6">
            {data.sections.map((section, idx) => (
              <motion.section
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-2 h-6 rounded-full bg-gradient-to-b from-[#FBC02D] to-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    {section.heading}
                  </h2>
                </div>

                <div className="space-y-3 text-slate-700 text-sm sm:text-base leading-relaxed pl-1 sm:pl-2">
                  {section.content.map((line, lineIdx) => {
                    const isBullet = line.startsWith("• ") || line.startsWith("- ");
                    const isCheckItem = line.startsWith("• ✅");

                    if (isBullet) {
                      const cleanLine = isCheckItem
                        ? line.replace("• ✅ ", "")
                        : line.replace(/^[•-]\s+/, "");

                      return (
                        <div key={lineIdx} className="flex items-start gap-3 py-0.5">
                          <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            isCheckItem ? "bg-emerald-500" : "bg-blue-600"
                          }`} />
                          <div className="text-slate-700 text-sm leading-relaxed">
                            <FormattedInline text={cleanLine} />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p key={lineIdx} className="text-slate-600 text-sm leading-relaxed">
                        <FormattedInline text={line} />
                      </p>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Contact Block & Quick Channels */}
          {data.contactBlock && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-blue-50/80 to-amber-50/50 rounded-3xl p-6 sm:p-8 border border-blue-200/60 space-y-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      Need Assistance or Have Feedback?
                    </h3>
                    <p className="text-xs text-slate-600">
                      Our team typically replies to students and educators within 24–48 hours
                    </p>
                  </div>
                </div>

                {/* Direct Action Link */}
                <a
                  href={`mailto:${data.contactBlock.email}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-xs rounded-xl hover:opacity-95 transition-opacity shadow-sm self-start sm:self-auto"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-blue-100/80 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase font-bold">
                    Official Email
                  </span>
                  <a
                    href={`mailto:${data.contactBlock.email}`}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 break-all"
                  >
                    {data.contactBlock.email}
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase font-bold">
                    Jurisdiction / Region
                  </span>
                  <span className="text-slate-700 font-medium">
                    {data.contactBlock.city} (PCI Curriculum)
                  </span>
                </div>

                {data.contactBlock.web && (
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px] uppercase font-bold">
                      Live Portal
                    </span>
                    <a
                      href={`https://${data.contactBlock.web}`}
                      className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      <span>https://{data.contactBlock.web}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>

              {/* Community Connect Bar */}
              <div className="pt-3 border-t border-blue-100/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">Connect on Student Channels:</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://t.me/pharmapaper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 font-semibold transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Telegram</span>
                  </a>
                  <a
                    href="https://whatsapp.com/channel/pharmapaper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="https://youtube.com/@pharmapaper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-semibold transition-colors"
                  >
                    <YoutubeIcon className="w-3 h-3" />
                    <span>YouTube</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Legal Cross-Links */}
          <motion.div variants={itemVariants} className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-semibold text-slate-500">
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About Us
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">
              Contact Us
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Terms and Conditions
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="hover:text-blue-600 transition-colors">
              Disclaimer
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
