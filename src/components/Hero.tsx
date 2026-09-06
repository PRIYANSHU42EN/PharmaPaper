"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, GraduationCap, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

export default function Hero() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/bpharm/1st-semester?q=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FBC02D]/15 via-white to-[#F9FAFB] py-12 sm:py-20 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FBC02D]/30 border border-amber-400/40 text-slate-900 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>100% Free Pharmacy Lecture Notes & Study Vault</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
              Welcome to <span className="text-[#FBC02D] drop-shadow-sm filter contrast-125">PharmaPaper</span>
            </h1>

            <p className="text-lg sm:text-xl font-medium text-slate-700 max-w-2xl leading-relaxed">
              Your Gateway to Excellence in Pharmacy Education. Access comprehensive, syllabus-mapped study notes, unit guides, and question papers for all B.Pharm and D.Pharm semesters.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={onSearch} className="max-w-xl mx-auto lg:mx-0 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by subject name (e.g. Pharmaceutics, Pharmacognosy)..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm rounded-2xl hover:opacity-95 shadow-md transition-opacity shrink-0"
              >
                Find Notes
              </button>
            </form>

            {/* Feature Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PCI Syllabus Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>All 8 Semesters Covered</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Clean & Distraction-Free</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Vector Graphic */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-amber-100 via-blue-50 to-purple-100 rounded-3xl p-8 border border-white shadow-xl flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-[#FBC02D] text-slate-950 flex items-center justify-center shadow-lg mb-6 transform -rotate-3">
                <GraduationCap className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-display font-extrabold text-slate-900 mb-2">B.Pharm & D.Pharm Vault</h3>
              <p className="text-sm text-slate-600 max-w-xs">
                From 1st Semester Fundamentals to 8th Semester Advanced Formulations, download unit PDFs verified by top faculty.
              </p>

              <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Direct Verified Downloads</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
