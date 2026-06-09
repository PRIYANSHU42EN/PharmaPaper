"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Subject {
  id: string;
  name: string;
  course_code: string; // 'bpharm' | 'dpharm'
  semester_number: number;
}

interface FilterBarProps {
  subjects: Subject[];
}

export default function FilterBar({ subjects }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for mobile sheet visibility
  const [isOpen, setIsOpen] = useState(false);

  // Active query param states
  const activeCourse = searchParams.get("course") || "All";
  const activeSemester = searchParams.get("semester") || "All";
  const activeSubject = searchParams.get("subject") || "All";
  const activeDuration = searchParams.get("duration") || "All";
  const activeType = searchParams.get("type") || "All";
  const activeSort = searchParams.get("sort") || "latest";

  // Filter subjects based on course and semester selection
  const filteredSubjects = subjects.filter((subj) => {
    const courseMatch =
      activeCourse === "All" ||
      (activeCourse === "B.Pharm" && subj.course_code === "bpharm") ||
      (activeCourse === "D.Pharm" && subj.course_code === "dpharm");
    
    const semMatch =
      activeSemester === "All" ||
      subj.semester_number === parseInt(activeSemester);

    return courseMatch && semMatch;
  });

  // Calculate active filter count
  const getFilterCount = () => {
    let count = 0;
    if (activeCourse !== "All") count++;
    if (activeSemester !== "All") count++;
    if (activeSubject !== "All") count++;
    if (activeDuration !== "All") count++;
    if (activeType !== "All") count++;
    if (activeSort !== "latest") count++;
    return count;
  };

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "All" || (key === "sort" && value === "latest")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset page if filters change
    params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
    setIsOpen(false);
  };

  const courseOptions = ["All", "B.Pharm", "D.Pharm"];
  const semesterOptions = ["All", "1", "2", "3", "4", "5", "6", "7", "8"];
  const durationOptions = [
    { label: "Any Length", value: "All" },
    { label: "Short (<10m)", value: "short" },
    { label: "Medium (10m - 30m)", value: "medium" },
    { label: "Long (>30m)", value: "long" },
  ];
  const typeOptions = [
    { label: "All Lectures", value: "All" },
    { label: "Free Only", value: "free" },
  ];
  const sortOptions = [
    { label: "Latest Uploads", value: "latest" },
    { label: "Most Viewed", value: "views" },
    { label: "Most Liked", value: "likes" },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mobile Filter Trigger Button */}
      <div className="flex md:hidden items-center justify-between gap-3 w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="flex-grow flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass-panel border border-brand-border text-xs font-mono font-bold uppercase tracking-wider text-brand-cream hover:bg-brand-gray/30 transition-colors"
        >
          <span>🔍 Filter & Sort</span>
          {getFilterCount() > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand text-black flex items-center justify-center text-[10px] font-bold">
              {getFilterCount()}
            </span>
          )}
        </button>
        {getFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-3 rounded-xl border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/5 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Desktop Filter Panel Grid */}
      <div className="hidden md:flex flex-col gap-4 p-5 glass-panel border border-brand-border/40 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Course */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Course</label>
            <select
              value={activeCourse}
              onChange={(e) => {
                updateQueryParams({ 
                  course: e.target.value,
                  semester: "All", // reset sem & subject when course changes
                  subject: "All"
                });
              }}
              className="w-full px-3 py-2 rounded-xl bg-brand-gray/60 border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all cursor-pointer font-mono"
            >
              {courseOptions.map(opt => (
                <option key={opt} value={opt} className="bg-brand-charcoal text-brand-cream">{opt}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Semester</label>
            <select
              value={activeSemester}
              onChange={(e) => {
                updateQueryParams({ 
                  semester: e.target.value,
                  subject: "All"
                });
              }}
              disabled={activeCourse === "D.Pharm"} // D.Pharm uses years, we handle it gracefully or limit semesters
              className="w-full px-3 py-2 rounded-xl bg-brand-gray/60 border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all cursor-pointer font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {semesterOptions.map(opt => (
                <option key={opt} value={opt} className="bg-brand-charcoal text-brand-cream">{opt === "All" ? "All Semesters" : `Semester ${opt}`}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Subject</label>
            <select
              value={activeSubject}
              onChange={(e) => updateQueryParams({ subject: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-brand-gray/60 border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all cursor-pointer font-mono"
            >
              <option value="All" className="bg-brand-charcoal text-brand-cream">All Subjects</option>
              {filteredSubjects.map(subj => (
                <option key={subj.id} value={subj.name} className="bg-brand-charcoal text-brand-cream">{subj.name}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Duration</label>
            <select
              value={activeDuration}
              onChange={(e) => updateQueryParams({ duration: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-brand-gray/60 border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all cursor-pointer font-mono"
            >
              {durationOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-brand-charcoal text-brand-cream">{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Pricing Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Access Type</label>
            <select
              value={activeType}
              onChange={(e) => updateQueryParams({ type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-brand-gray/60 border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all cursor-pointer font-mono"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-brand-charcoal text-brand-cream">{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Sort By</label>
            <select
              value={activeSort}
              onChange={(e) => updateQueryParams({ sort: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-brand-gray/60 border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all cursor-pointer font-mono"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-brand-charcoal text-brand-cream">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {getFilterCount() > 0 && (
          <div className="flex justify-end pt-2 border-t border-brand-border/20">
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
            >
              Clear Active Filters ({getFilterCount()})
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full bg-brand-charcoal border-t border-brand-border rounded-t-3xl max-h-[85vh] overflow-y-auto relative z-10 p-6 flex flex-col gap-6"
            >
              {/* Drag Handle indicator */}
              <div className="w-12 h-1 bg-brand-border/60 rounded-full mx-auto" />

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Filters & Sorting</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center text-brand-cream text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Filters Form */}
              <div className="flex flex-col gap-4">
                {/* Course */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Course</label>
                  <div className="flex gap-2">
                    {courseOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateQueryParams({ course: opt, semester: "All", subject: "All" })}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                          activeCourse === opt
                            ? "bg-brand text-black border border-brand"
                            : "bg-brand-gray border border-brand-border text-brand-cream/70"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Semester */}
                {activeCourse !== "D.Pharm" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Semester</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        onClick={() => updateQueryParams({ semester: "All", subject: "All" })}
                        className={`py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                          activeSemester === "All"
                            ? "bg-brand text-black border border-brand"
                            : "bg-brand-gray border border-brand-border text-brand-cream/70"
                        }`}
                      >
                        All
                      </button>
                      {["1", "2", "3", "4", "5", "6", "7", "8"].map((sem) => (
                        <button
                          key={sem}
                          onClick={() => updateQueryParams({ semester: sem, subject: "All" })}
                          className={`py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                            activeSemester === sem
                              ? "bg-brand text-black border border-brand"
                              : "bg-brand-gray border border-brand-border text-brand-cream/70"
                          }`}
                        >
                          S{sem}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Subject</label>
                  <select
                    value={activeSubject}
                    onChange={(e) => updateQueryParams({ subject: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-xs focus:outline-none"
                  >
                    <option value="All">All Subjects</option>
                    {filteredSubjects.map((subj) => (
                      <option key={subj.id} value={subj.name}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {durationOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateQueryParams({ duration: opt.value })}
                        className={`py-2 rounded-xl text-[10px] font-mono transition-all ${
                          activeDuration === opt.value
                            ? "bg-brand text-black border border-brand"
                            : "bg-brand-gray border border-brand-border text-brand-cream/70"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Access Type</label>
                  <div className="flex gap-2">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateQueryParams({ type: opt.value })}
                        className={`flex-grow py-2 rounded-xl text-xs font-mono transition-all ${
                          activeType === opt.value
                            ? "bg-brand text-black border border-brand"
                            : "bg-brand-gray border border-brand-border text-brand-cream/70"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono font-semibold uppercase tracking-widest text-brand-cream/40">Sort By</label>
                  <div className="grid grid-cols-3 gap-2">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateQueryParams({ sort: opt.value })}
                        className={`py-2 rounded-xl text-[10px] font-mono transition-all ${
                          activeSort === opt.value
                            ? "bg-brand text-black border border-brand"
                            : "bg-brand-gray border border-brand-border text-brand-cream/70"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-brand-border/30">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-gray text-[10px] font-mono font-bold uppercase tracking-wider text-brand-cream"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-black text-[10px] font-mono font-bold uppercase tracking-wider shadow-md"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
