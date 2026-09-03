"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Layers, FileText, CheckCircle } from "lucide-react";
import type { Semester } from "@/lib/supabase";

interface SemesterGridProps {
  bpharmSemesters?: Semester[];
  dpharmSemesters?: Semester[];
}

export default function SemesterGrid({
  bpharmSemesters = [],
  dpharmSemesters = [],
}: SemesterGridProps) {
  const [selectedCourse, setSelectedCourse] = useState<"bpharm" | "dpharm">("bpharm");

  const semestersToDisplay = selectedCourse === "bpharm" ? bpharmSemesters : dpharmSemesters;

  return (
    <section className="py-16 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Course Selector Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-blue-600 mb-2">
              Curriculum Notes Library
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              Select Your Semester to Download Notes
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Choose your program and semester to access all unit-wise PDF study materials.
            </p>
          </div>

          {/* Course Switcher Pills */}
          <div className="inline-flex p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner shrink-0 self-start md:self-auto">
            <button
              onClick={() => setSelectedCourse("bpharm")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedCourse === "bpharm"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bachelor of Pharmacy (B.Pharm)
            </button>
            <button
              onClick={() => setSelectedCourse("dpharm")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedCourse === "dpharm"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Diploma in Pharmacy (D.Pharm)
            </button>
          </div>
        </div>

        {/* 4-column desktop / 2-column tablet / 1-column mobile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {semestersToDisplay.map((sem) => {
            const courseCode = sem.course || selectedCourse;
            const targetUrl = `/${courseCode}/${sem.slug}`;

            return (
              <div
                key={sem.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center font-display font-extrabold text-lg group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedCourse === "bpharm" ? `Semester ${sem.number}` : `Year ${sem.number}`}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {sem.title || sem.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-6">
                    Full PCI Syllabus Notes • 5 Units
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={targetUrl}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all group-hover:gap-3"
                  >
                    <span>View Notes</span>
                    <ArrowRight className="w-4 h-4 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
