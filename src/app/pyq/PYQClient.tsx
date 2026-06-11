"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FloatingCard from "@/components/FloatingCard";
import { SyllabusData } from "@/lib/db";
import { supabase, trackPdfView, getSettings } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import InlinePDFViewer from "@/components/InlinePDFViewer";
import PaywallModal from "@/components/PaywallModal";

type Session = "aug-sep" | "nov-dec";
type CourseType = "bpharm" | "dpharm";

const AVAILABLE_YEARS = ["2029", "2028", "2027", "2026", "2025", "2024", "2023", "2022", "2021"];

interface PYQClientProps {
  syllabusData: SyllabusData;
  initialPremiumStatus?: any;
}

export default function PYQClient({ syllabusData, initialPremiumStatus }: PYQClientProps) {
  const { user } = useUser();
  const [courseType, setCourseType] = useState<CourseType>("bpharm");
  const [session, setSession] = useState<Session>("nov-dec");
  const [activeSemId, setActiveSemId] = useState<string>("sem1");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [searchQuery, setSearchQuery] = useState("");

  const [dbPyqs, setDbPyqs] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = useState<string>("");
  const [siteName, setSiteName] = useState("Pharma Paper");
  const [isPremium, setIsPremium] = useState<boolean | null>(initialPremiumStatus?.isPremium ?? null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [lockedResourceTitle, setLockedResourceTitle] = useState("");

  useEffect(() => {
    if (isPremium !== null) return;
    fetch("/api/trial/status")
      .then((res) => res.json())
      .then((data) => {
        setIsPremium(data.isPremium);
      })
      .catch((err) => {
        console.error("Failed to check trial status:", err);
        setIsPremium(false);
      });
  }, [isPremium]);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.sitename) {
        setSiteName(settings.sitename);
      }
    });
  }, []);

  const checkDocumentAccess = async (urlOrId: string, title: string) => {
    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(urlOrId);
      const queryParam = isUuid ? `id=${urlOrId}` : `url=${encodeURIComponent(urlOrId)}`;
      const checkRes = await fetch(`/api/pdf-proxy?check=true&${queryParam}&title=${encodeURIComponent(title)}`);
      if (checkRes.ok) {
        return true;
      }
      const errData = await checkRes.json();
      if (errData.error === "limit_reached") {
        setLockedResourceTitle(title);
        setIsPaywallOpen(true);
      } else {
        alert(errData.error || "Access denied.");
      }
      return false;
    } catch (err) {
      console.error("Error checking document access:", err);
      alert("Failed to check access limits.");
      return false;
    }
  };

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

  useEffect(() => {
    const fetchPyqs = async () => {
      setLoadingDb(true);
      try {
        const course = courseType === "bpharm" ? "B.Pharm" : "D.Pharm";
        const semNum = parseInt(activeSemId.replace(/(sem|year)/i, ""), 10) || 1;
        
        const { data, error } = await supabase
          .from("study_materials")
          .select("id, title, semester, course, type, subject, created_at")
          .eq("course", course)
          .eq("semester", semNum)
          .eq("type", "pyq");

        if (error) {
          console.error("Error fetching PYQs:", error);
        } else {
          setDbPyqs(data || []);
        }
      } catch (err) {
        console.error("Failed to load PYQs", err);
      } finally {
        setLoadingDb(false);
      }
    };

    fetchPyqs();
  }, [courseType, activeSemId]);

  const getSubjectPyq = (subjectName: string) => {
    const targetSession = session === "aug-sep" ? "Aug-Sep" : "Nov-Dec";
    return dbPyqs.find((item) => {
      const subjectMatch = item.subject?.toLowerCase().trim() === subjectName.toLowerCase().trim();
      const titleLower = (item.title || "").toLowerCase();
      const sessionMatch = titleLower.includes(targetSession.toLowerCase());
      const yearMatch = titleLower.includes(selectedYear);
      return subjectMatch && sessionMatch && yearMatch;
    });
  };

  const semestersList = syllabusData[courseType] || [];

  const activeSemester = useMemo(() => {
    return semestersList.find((s) => s.id === activeSemId) || semestersList[0] || null;
  }, [semestersList, activeSemId]);

  const filteredSubjects = useMemo(() => {
    if (!activeSemester) return [];
    if (!searchQuery.trim()) return activeSemester.subjects;
    return activeSemester.subjects.filter((subject) =>
      subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSemester, searchQuery]);

  const sessionLabel = session === "aug-sep" ? "Aug – Sep" : "Nov – Dec";
  const sessionLabelShort = session === "aug-sep" ? "AUG–SEP" : "NOV–DEC";

  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white pb-16">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.05]" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none opacity-[0.04]" />

      {/* Navigation Header */}
      <header className="sticky top-0 w-full h-16 glass-panel border-b border-brand-border flex items-center justify-between px-6 md:px-12 z-50 backdrop-blur-md bg-brand-charcoal/80">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] animate-pulse" />
          <span className="font-bebas text-xl tracking-wider text-brand-cream font-bold">
            {renderLogo(siteName)}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-border text-[9px] uppercase tracking-widest text-brand bg-brand/5 font-mono">
            Previous Year Questions
          </span>
          <Link
            href="/"
            className="px-4 py-1.5 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand text-xs font-semibold tracking-wider uppercase transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Filters & Semester Selection */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-6 glass-panel border border-brand-border rounded-2xl">
            <h1 className="font-bebas text-3xl text-brand-cream uppercase tracking-wide mb-1">
              Question <span className="text-brand">Papers</span>
            </h1>
            <p className="text-xs text-brand-cream/55 leading-relaxed mb-6">
              Browse previous year question papers organized by exam session, semester, and subject.
            </p>

            {/* Exam Session Toggle */}
            <div className="mb-5">
              <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold block mb-2 ml-1">
                Exam Session
              </span>
              <div className="flex p-1 rounded-full bg-brand-charcoal border border-brand-border w-full">
                <button
                  onClick={() => setSession("aug-sep")}
                  className={`flex-1 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    session === "aug-sep"
                      ? "bg-brand text-brand-charcoal shadow-lg"
                      : "text-brand-cream/60 hover:text-brand-cream"
                  }`}
                >
                  <span className="text-[13px]">☀️</span> Aug – Sep
                </button>
                <button
                  onClick={() => setSession("nov-dec")}
                  className={`flex-1 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    session === "nov-dec"
                      ? "bg-brand text-brand-charcoal shadow-lg"
                      : "text-brand-cream/60 hover:text-brand-cream"
                  }`}
                >
                  <span className="text-[13px]">❄️</span> Nov – Dec
                </button>
              </div>
            </div>

            {/* Course Selector Toggle */}
            <div className="mb-5">
              <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold block mb-2 ml-1">
                Course
              </span>
              <div className="flex p-1 rounded-full bg-brand-charcoal border border-brand-border w-full">
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
            </div>

            {/* Year Selector */}
            <div className="mb-6">
              <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold block mb-2 ml-1">
                Year
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 border ${
                      selectedYear === year
                        ? "bg-brand text-brand-charcoal border-brand shadow-[0_0_12px_rgba(142,146,144,0.2)]"
                        : "border-brand-border text-brand-cream/50 hover:text-brand-cream hover:border-brand-cream/20"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Semester Grid */}
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
                    <span
                      className={`text-[9px] font-mono tracking-wider font-semibold ${
                        activeSemId === sem.id
                          ? "text-brand"
                          : "text-brand-cream/35"
                      }`}
                    >
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

        {/* Right column: Subject-wise Question Papers */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeSemester ? (
              <motion.div
                key={`${activeSemester.id}-${session}-${selectedYear}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8 glass-panel border border-brand-border rounded-2xl flex flex-col gap-6"
              >
                {/* Dashboard Title Panel */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border/40 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] text-brand uppercase font-mono tracking-widest font-bold">
                        {courseType === "bpharm"
                          ? "Bachelor of Pharmacy"
                          : "Diploma in Pharmacy"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-brand/10 border border-brand/25 text-brand">
                        {sessionLabelShort} {selectedYear}
                      </span>
                    </div>
                    <h2 className="font-bebas text-3xl md:text-4xl text-brand-cream uppercase tracking-wide leading-none mt-1">
                      {activeSemester.title}{" "}
                      <span className="text-brand">Papers</span>
                    </h2>
                  </div>

                  {/* Search Bar */}
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

                {/* Session Info Banner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-charcoal/40 border border-brand-border/50">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-lg shrink-0">
                    {session === "aug-sep" ? "☀️" : "❄️"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-cream">
                      {sessionLabel} {selectedYear} Examination
                    </p>
                    <p className="text-[10px] text-brand-cream/40">
                      {session === "aug-sep"
                        ? "Supplementary / Back Paper Examination Session"
                        : "Regular University Examination Session"}
                    </p>
                  </div>
                </div>

                {/* Subjects Grid */}
                <div>
                  <h3 className="text-[10px] text-brand-cream/40 uppercase tracking-widest font-semibold mb-3">
                    Select a subject to view question paper
                  </h3>

                  {filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSubjects.map((subject, idx) => {
                        const dbPyq = getSubjectPyq(subject);
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={async () => {
                              const targetUrlOrId = dbPyq ? dbPyq.id : `/mock-pyq.pdf`;
                              const targetTitle = dbPyq ? dbPyq.title : `${subject} PYQ`;
                              const hasAccess = await checkDocumentAccess(targetUrlOrId, targetTitle);
                              if (hasAccess) {
                                trackPdfView(targetUrlOrId, targetTitle, user?.id || null);
                                setActivePdfUrl(targetUrlOrId);
                                setActivePdfTitle(targetTitle);
                              }
                            }}
                            className={`p-4 rounded-xl text-left bg-brand-charcoal/30 border transition-all duration-200 group ${
                              dbPyq 
                                ? "border-brand/40 hover:border-brand bg-brand/[0.01]" 
                                : "border-brand-border hover:border-brand"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="block text-[8px] font-mono uppercase tracking-widest text-brand font-bold mb-1 font-semibold">
                                  {dbPyq ? "⚡ Uploaded PYQ" : `Subject ${idx + 1}`}
                                </span>
                                <span className="text-xs font-semibold leading-relaxed text-brand-cream group-hover:text-brand-cream">
                                  {subject}
                                </span>
                              </div>
                              <div className="shrink-0 flex flex-col items-center gap-1 mt-1">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] border transition-colors ${
                                  dbPyq 
                                    ? "bg-brand/20 border-brand/40 text-brand" 
                                    : "bg-brand/10 border-brand/20 text-brand group-hover:bg-brand/20"
                                }`}>
                                  📄
                                </span>
                                <span className="text-[7px] text-brand-cream/30 uppercase tracking-wider font-mono">
                                  PDF
                                </span>
                              </div>
                            </div>

                            {/* Session & Year Tag */}
                            <div className="mt-3 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[7px] font-bold tracking-wider uppercase bg-brand-charcoal border border-brand-border text-brand-cream/50">
                                {session === "aug-sep" ? "☀️" : "❄️"}{" "}
                                {sessionLabelShort}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[7px] font-bold tracking-wider uppercase bg-brand-charcoal border border-brand-border text-brand-cream/50">
                                {selectedYear}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-brand-cream/30 uppercase tracking-widest font-mono border border-dashed border-brand-border rounded-xl">
                      No subjects match &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>

                {/* Hint */}
                <div className="mt-2 text-center text-[9px] text-brand-cream/25 uppercase tracking-widest font-mono">
                  ⚡ Papers will be available as downloadable PDFs
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center glass-panel border border-brand-border rounded-2xl py-24 text-center">
                <p className="text-sm tracking-widest text-brand-cream/35 uppercase font-mono">
                  Select a semester to browse question papers
                </p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Supabase PDF Viewer Modal */}
      {activePdfUrl && (
        <div className="fixed inset-0 bg-brand-charcoal/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
          <InlinePDFViewer
            pdfUrl={activePdfUrl}
            title={activePdfTitle}
            onClose={() => setActivePdfUrl(null)}
          />
        </div>
      )}

      {/* Paywall Gate Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        resourceTitle={lockedResourceTitle}
      />
    </div>
  );
}
