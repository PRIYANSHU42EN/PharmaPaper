"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Mail, Sparkles } from "lucide-react";
import type { LegalPageData } from "@/lib/legalContent";

interface LegalPageLayoutProps {
  data: LegalPageData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

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
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed pt-2 border-t border-slate-100">
                {data.intro}
              </p>
            )}
          </motion.div>

          {/* Policy Sections */}
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

                <div className="space-y-2.5 text-slate-700 text-sm sm:text-base leading-relaxed pl-2">
                  {section.content.map((line, lineIdx) => {
                    const isBullet = line.startsWith("• ");
                    const isCheckItem = line.startsWith("• ✅");

                    if (isBullet) {
                      const cleanLine = isCheckItem
                        ? line.replace("• ✅ ", "")
                        : line.replace("• ", "");

                      return (
                        <div key={lineIdx} className="flex items-start gap-3 py-0.5">
                          <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                            isCheckItem ? "bg-emerald-500" : "bg-blue-600"
                          }`} />
                          <p className="text-slate-700 text-sm leading-relaxed">
                            {cleanLine}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <p key={lineIdx} className="text-slate-600 text-sm leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Contact Block */}
          {data.contactBlock && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-6 sm:p-8 border border-blue-200/60 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    Have Questions or Feedback?
                  </h3>
                  <p className="text-xs text-slate-600">
                    Our team is here to assist pharmacy students and educators
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-blue-100/80 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase font-bold">
                    Email
                  </span>
                  <a
                    href={`mailto:${data.contactBlock.email}`}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                  >
                    {data.contactBlock.email}
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 block font-mono text-[10px] uppercase font-bold">
                    Campus / Location
                  </span>
                  <span className="text-slate-700 font-medium">
                    {data.contactBlock.city}
                  </span>
                </div>

                {data.contactBlock.web && (
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px] uppercase font-bold">
                      Website
                    </span>
                    <a
                      href={`https://${data.contactBlock.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                    >
                      {data.contactBlock.web}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick Legal Cross-Links */}
          <motion.div variants={itemVariants} className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <Link href="/terms" className="hover:text-blue-600 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="hover:text-blue-600 transition-colors">
              Disclaimer
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About Us
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
