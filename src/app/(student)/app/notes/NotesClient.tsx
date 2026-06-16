"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FloatingCard from "@/components/FloatingCard";
import { SyllabusData } from "@/lib/db";
import { getSettings } from "@/lib/supabase";

interface NotesClientProps {
  syllabusData: SyllabusData;
}

export default function NotesClient({ syllabusData }: NotesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySem = searchParams.get("sem");
  const queryType = searchParams.get("type") as "bpharm" | "dpharm";

  const [courseType, setCourseType] = useState<"bpharm" | "dpharm">("bpharm");
  const [activeSemId, setActiveSemId] = useState<string | null>("sem1");
  const [searchQuery, setSearchQuery] = useState("");
  const [siteName, setSiteName] = useState("Pharma Paper");

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.sitename) {
        setSiteName(settings.sitename);
      }
    });
  }, []);

  const renderLogo = (name: string) => {
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

  // Sync initial parameters from search URL params
  useEffect(() => {
    if (queryType === "bpharm" || queryType === "dpharm") {
      setCourseType(queryType);
    }
    if (querySem) {
      setActiveSemId(querySem);
    } else {
      // Default fallback activeSemId based on courseType
      setActiveSemId(queryType === "dpharm" ? "year1" : "sem1");
    }
  }, [querySem, queryType]);

  const semestersList = syllabusData[courseType] || [];
  
  // Find current semester
  const activeSemester = useMemo(() => {
    return semestersList.find(s => s.id === activeSemId) || semestersList[0] || null;
  }, [semestersList, activeSemId]);

  // Filter subjects based on search query
  const filteredSubjects = useMemo(() => {
    if (!activeSemester) return [];
    if (!searchQuery.trim()) return activeSemester.subjects;
    return activeSemester.subjects.filter(subject => 
      subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSemester, searchQuery]);

  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white pb-16">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.06]" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none opacity-[0.03]" />

      {/* Navigation Header */}
      <header className="sticky top-0 w-full h-16 glass-panel border-b border-brand-border flex items-center justify-between px-6 md:px-12 z-50 backdrop-blur-md bg-brand-charcoal/80">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] animate-pulse" />
          <span className="font-bebas text-xl tracking-wider text-brand-cream font-bold">
            {renderLogo(siteName)}
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/upgrade" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand/40 text-[9px] uppercase tracking-widest text-brand bg-brand/5 font-mono hover:bg-brand/15 transition-all duration-200">
            ⭐ Go Premium
          </Link>
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-border text-[9px] uppercase tracking-widest text-brand-cream/50 bg-brand-cream/[0.02] font-mono">
            Workspace
          </span>
          <Link href="/" className="px-4 py-1.5 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand transition-all duration-300">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Semester / Year Selection Card */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-6 glass-panel border border-brand-border rounded-2xl">
            <h1 className="font-bebas text-3xl text-brand-cream uppercase tracking-wide mb-2">
              Syllabus <span className="text-brand">Vault</span>
            </h1>
            <p className="text-xs text-brand-cream/55 leading-relaxed mb-6">
              Browse structured study notes, past years' questions, and video lecture deep-links standardized by the Pharmacy Council of India.
            </p>

            {/* Course Selector Toggle */}
            <div className="flex p-1 rounded-full bg-brand-charcoal border border-brand-border w-full mb-6">
              <button
                onClick={() => {
                  setCourseType("bpharm");
                  setActiveSemId("sem1");
                  setSearchQuery("");
                }}
                className={`flex-1 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                  courseType === "bpharm"
                    ? "bg-brand text-brand-charcoal shadow-lg"
                    : "text-brand-cream/60 hover:text-brand-cream"
                }`}
              >
                B. Pharmacy
              </button>
              <button
                onClick={() => {
                  setCourseType("dpharm");
                  setActiveSemId("year1");
                  setSearchQuery("");
                }}
                className={`flex-1 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                  courseType === "dpharm"
                    ? "bg-brand text-brand-charcoal shadow-lg"
                    : "text-brand-cream/60 hover:text-brand-cream"
                }`}
              >
                D. Pharmacy
              </button>
            </div>

            {/* Tactile Grid List */}
            <div className="grid grid-cols-2 gap-3">
              {semestersList.map((sem) => (
                <FloatingCard
                  key={sem.id}
                  onClick={() => {
                    setActiveSemId(sem.id);
                    setSearchQuery("");
                  }}
                  className={`p-4 flex flex-col justify-between aspect-square border cursor-pointer ${
                    activeSemId === sem.id 
                      ? "border-brand bg-brand/[0.02]" 
                      : "border-brand-border hover:border-brand-cream/20"
                  }`}
                >
                  <div className="flex flex-col h-full justify-between">
                    <span className={`text-[9px] font-mono tracking-wider font-semibold ${
                      activeSemId === sem.id ? "text-brand" : "text-brand-cream/35"
                    }`}>
                      {sem.code}
                    </span>
                    <div>
                      <h3 className="font-bebas text-lg md:text-xl text-brand-cream uppercase leading-none mb-1">
                        {sem.title}
                      </h3>
                      <p className="text-[8px] text-brand-cream/40 uppercase tracking-widest">
                        {sem.subjects.length} Subjects
                      </p>
                    </div>
                  </div>
                </FloatingCard>
              ))}
            </div>
          </div>
        </section>

        {/* Right column: Subjects and Content Explorer */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeSemester ? (
              <motion.div
                key={activeSemester.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 glass-panel border border-brand-border rounded-2xl flex flex-col gap-6"
              >
                {/* Dashboard Title Panel */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border/40 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] text-brand uppercase font-mono tracking-widest font-bold">
                      {courseType === "bpharm" ? "Bachelor of Pharmacy" : "Diploma in Pharmacy"}
                    </span>
                    <h2 className="font-bebas text-3xl md:text-4xl text-brand-cream uppercase tracking-wide leading-none mt-1">
                      {activeSemester.title} <span className="text-brand">Curriculum</span>
                    </h2>
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative w-full md:w-64">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-brand-cream/30 text-xs">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-full bg-brand-charcoal/50 border border-brand-border text-xs text-brand-cream focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-brand-cream/35"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="absolute right-3.5 inset-y-0 flex items-center text-brand-cream/30 hover:text-brand text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Subjects Grid */}
                <div>
                  <h3 className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-semibold mb-3">
                    Select a subject to open unit-wise study vault
                  </h3>
                  
                  {filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSubjects.map((subject, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            router.push(`/subject?name=${encodeURIComponent(subject)}&sem=${activeSemId}&type=${courseType}`);
                          }}
                          className="p-4 rounded-xl text-left text-xs font-semibold leading-relaxed bg-brand-charcoal/30 border border-brand-border hover:border-brand hover:text-brand-cream transition-all duration-200"
                        >
                          <span className="block text-[8px] font-mono uppercase tracking-widest text-brand font-bold mb-1">
                            Subject {idx + 1}
                          </span>
                          {subject}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-brand-cream/30 uppercase tracking-widest font-mono border border-dashed border-brand-border rounded-xl">
                      No subjects match "{searchQuery}"
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center glass-panel border border-brand-border rounded-2xl py-24 text-center">
                <p className="text-sm tracking-widest text-brand-cream/35 uppercase font-mono">
                  Select a semester code to inspect the vault
                </p>
              </div>
            )}
          </AnimatePresence>
        </section>

      </main>
    </div>
  );
}
