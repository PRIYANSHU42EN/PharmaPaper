"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { 
  BookOpen,
  GraduationCap,
  Library,
  Bell,
  CheckCircle,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Video,
  FileSpreadsheet
} from "lucide-react";

import FloatingCard from "@/components/FloatingCard";
import Footer from "@/components/Footer";
import { SyllabusData } from "@/lib/db";
import { getSettings, supabase } from "@/lib/supabase";

// Counter hook utilizing requestAnimationFrame
function useCountUp(target: number, durationMs: number = 2000, trigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    const start = 0;
    const end = target;
    const range = end - start;
    const startTimestamp = performance.now();
    let animationFrameId: number;

    const updateCount = (timestamp: number) => {
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease out quad
      const easedProgress = progress * (2 - progress);
      const currentCount = Math.floor(easedProgress * range + start);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrameId);
  }, [target, durationMs, trigger]);

  return count;
}

interface HomeClientProps {
  syllabusData: SyllabusData;
}

export default function HomeClient({ syllabusData }: HomeClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [courseType, setCourseType] = useState<"bpharm" | "dpharm">("bpharm");
  const semestersList = syllabusData[courseType] || [];

  const [siteName, setSiteName] = useState("PharmPaper");
  const [siteDesc, setSiteDesc] = useState("Your Complete Pharmacy Study Vault");
  
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState("");
  const [lecturers, setLecturers] = useState<any[]>([]);

  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsTriggered, setStatsTriggered] = useState(false);

  // Counter values for statistics
  const studentCount = useCountUp(12000, 2500, statsTriggered);
  const notesCount = useCountUp(850, 2000, statsTriggered);
  const videosCount = useCountUp(200, 1500, statsTriggered);

  useEffect(() => {
    setMounted(true);
    setStatsTriggered(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Site Settings from Supabase
  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.sitename) {
        setSiteName(settings.sitename);
      }
      if (settings?.description) {
        setSiteDesc(settings.description);
      }
    });
  }, []);

  // Fetch Lecturers from Supabase
  useEffect(() => {
    async function fetchLecturers() {
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .limit(3);
      if (!error && data && data.length > 0) {
        setLecturers(data);
      } else {
        // Fallback default high-fidelity lecturers to guarantee premium presentation
        setLecturers([
          {
            id: "1",
            name: "Dr. Amit Sharma",
            specialization: "Pharmacology & Toxicology",
            bio: "Ph.D. in Pharmacology with 15+ years of academic research. Former Dean of Pharmacy Studies.",
            avatar_url: null,
            total_subscribers: 4200,
            videos_count: 85,
          },
          {
            id: "2",
            name: "Prof. Priya Patel",
            specialization: "Pharmaceutics & Biopharmaceutics",
            bio: "Specializes in novel drug delivery systems. M.Pharm gold medalist with high-yield syllabus breakdowns.",
            avatar_url: null,
            total_subscribers: 3100,
            videos_count: 62,
          },
          {
            id: "3",
            name: "Dr. Rajeev Kumar",
            specialization: "Medicinal Chemistry",
            bio: "Author of multiple organic chemistry journals. Breaking down complex reactions for simple learning.",
            avatar_url: null,
            total_subscribers: 2800,
            videos_count: 53,
          }
        ]);
      }
    }
    fetchLecturers();
  }, []);

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailInput.trim() || emailStatus === "loading") return;
    setEmailStatus("loading");
    setEmailError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim().toLowerCase() }),
      });
      if (res.ok) {
        setEmailStatus("success");
        setEmailInput("");
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailError(data.error ?? "Something went wrong. Please try again.");
        setEmailStatus("error");
      }
    } catch {
      setEmailError("Network error. Please try again.");
      setEmailStatus("error");
    }
  };

  const renderLogo = () => (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fafafa] to-[#888888] flex items-center justify-center shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
        <span className="font-syne font-extrabold text-[#171717] text-base">P</span>
      </div>
      <span className="font-syne font-extrabold text-lg tracking-tight text-[#fafafa] inline-flex items-center gap-1.5">
        {siteName}
        <span className="w-1.5 h-1.5 rounded-full bg-[#888888] relative inline-block">
          <span className="absolute inset-0 rounded-full bg-[#888888] animate-ping" />
        </span>
      </span>
    </div>
  );

  return (
    <div className="relative w-full bg-[#171717] text-[#fafafa] selection:bg-[#fafafa] selection:text-[#171717] overflow-x-hidden">

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 w-full h-20 bg-[#171717] flex items-center justify-between px-6 md:px-16 z-50">
        {renderLogo()}

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-white/70">
          <a href="#zone-hero" className="text-white hover:text-white transition-colors duration-200">
            Home
          </a>
          <a href="#zone-workspace" className="hover:text-white transition-colors duration-200">
            Syllabus
          </a>
          <a href="#zone-lecturers" className="hover:text-white transition-colors duration-200">
            Lecturers
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <Link href="/app/login" className="text-white/70 hover:text-white font-medium text-sm transition-colors duration-200 cursor-pointer">
              Login
            </Link>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-3.5">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
          </Show>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 w-full bg-[#171717]/95 border-b border-[#222222] px-6 py-6 flex flex-col gap-4 md:hidden z-40 shadow-2xl backdrop-blur-2xl"
          >
            <a href="#zone-hero" onClick={() => setMobileMenuOpen(false)} className="text-white text-base font-semibold py-1">Home</a>
            <a href="#zone-workspace" onClick={() => setMobileMenuOpen(false)} className="text-white/70 text-base font-medium py-1">Syllabus</a>
            <a href="#zone-lecturers" onClick={() => setMobileMenuOpen(false)} className="text-white/70 text-base font-medium py-1">Lecturers</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONE 1: HERO LANDING (Museum Department inspired) */}
      <section id="zone-hero" className="relative w-full min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-16 pt-32 z-10">

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto w-full">

          {/* Subtle label */}
          <div className="mb-12">
            <span className="text-[#888888] text-xs font-mono uppercase tracking-[0.3em] font-semibold">
              PCI Syllabus Standard 2026 — B.Pharm &amp; D.Pharm
            </span>
          </div>

          {/* Massive all-caps headline using Bebas Neue */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bebas-neue tracking-tight leading-[0.85] text-white mb-8 select-none">
            PHARMACY<br />STUDY VAULT
          </h1>

          {/* Editorial tagline with search hint */}
          <p className="text-white/50 font-body font-light text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            An indexed archive of pharmacy study materials for B.Pharm and D.Pharm courses.
            <br />
            <span className="inline-flex items-center gap-1.5 text-[#888888] font-mono text-xs tracking-wider">
              Press <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white text-[11px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white text-[11px]">K</kbd> to search across notes, papers &amp; videos.
            </span>
          </p>

          {/* Single minimal CTA */}
          <a
            href="#zone-workspace"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("zone-workspace");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-3 text-white/40 hover:text-white transition-all duration-300 font-mono text-xs uppercase tracking-[0.25em] cursor-pointer"
          >
            <span className="w-6 h-[1px] bg-white/20 group-hover:w-10 group-hover:bg-white/60 transition-all duration-300" />
            Enter the Vault
            <span className="w-6 h-[1px] bg-white/20 group-hover:w-10 group-hover:bg-white/60 transition-all duration-300" />
          </a>

        </div>

      </section>

      {/* ZONE 2: THESIS (CINEMATIC BLOCK) */}
      <section className="relative w-full py-32 md:py-48 flex items-center justify-center overflow-hidden border-t border-white/5">
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={mounted ? { opacity: 0, y: 30 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <span className="text-[#888888] text-xs font-mono uppercase tracking-widest font-bold mb-6">
              Our Vision
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading italic tracking-tight leading-tight text-white mb-8">
              "Pharmacy studies shouldn't be about endless rote learning. We construct clear, visual models and structured syllabus guides to make medical sciences intuitive."
            </h3>
            <div className="w-12 h-[1px] bg-white/20 mb-6" />
            <span className="text-white/50 text-xs font-mono uppercase tracking-wider">
              PharmPaper Academic Team
            </span>
          </motion.div>
        </div>
      </section>

      {/* ZONE 3: FEATURES CHESS (Workspace & Lecturers) */}
      <section id="zone-workspace" className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5 space-y-32">
        
        {/* Row 1: Course Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <motion.div
            initial={mounted ? { opacity: 0, x: -40 } : false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col text-left"
          >
            <span className="text-[#888888] text-xs font-mono uppercase tracking-widest font-bold mb-4">
              Interactive Vault
            </span>
            <h2 className="text-4xl md:text-5xl font-heading italic tracking-tight text-white mb-6">
              Navigate your semesters. <br />
              Instantly.
            </h2>
            <p className="text-white/60 font-body font-light text-base leading-relaxed mb-8">
              Pick your course type below to explore structured guides, previous year papers, and curated study bundles specific to your university syllabus requirements.
            </p>

            {/* Course Switch Toggle */}
            <div className="relative flex p-1 bg-white/5 border border-white/10 rounded-full w-fit mb-8">
              <button
                onClick={() => setCourseType("bpharm")}
                className={`relative px-5 py-2.5 rounded-full text-xs font-syne font-bold uppercase tracking-wider transition-all duration-300 z-10 cursor-pointer ${
                  courseType === "bpharm" ? "text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {courseType === "bpharm" && (
                  <motion.div
                    layoutId="activeCourseBg"
                    className="absolute inset-0 rounded-full bg-white z-[-1]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                B. Pharm
              </button>
              <button
                onClick={() => setCourseType("dpharm")}
                className={`relative px-5 py-2.5 rounded-full text-xs font-syne font-bold uppercase tracking-wider transition-all duration-300 z-10 cursor-pointer ${
                  courseType === "dpharm" ? "text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {courseType === "dpharm" && (
                  <motion.div
                    layoutId="activeCourseBg"
                    className="absolute inset-0 rounded-full bg-white z-[-1]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                D. Pharm
              </button>
            </div>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {semestersList.map((sem, idx) => (
              <motion.div
                key={sem.id}
                initial={mounted ? { opacity: 0, y: 20 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
              >
                <Link href={`/notes?sem=${sem.id}&type=${courseType}`} className="block">
                  <FloatingCard
                    badge="FREE"
                    className="p-5 flex flex-col justify-between aspect-square cursor-pointer hover:bg-white/5 transition-colors duration-300 border border-white/5 animate-subtle-float"
                  >
                    <div className="flex flex-col h-full justify-between text-left">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 text-lg mb-2">
                        🧪
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#888888] tracking-wider uppercase font-semibold">
                          {sem.code}
                        </span>
                        <h3 className="font-syne font-extrabold text-base sm:text-lg text-white uppercase leading-none mt-1.5 mb-1.5">
                          {sem.title}
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                          {sem.subjects?.length || 0} Subjects
                        </p>
                      </div>
                    </div>
                  </FloatingCard>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

        {/* Row 2: Expert Lecturers */}
        <div id="zone-lecturers" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:order-2">
            {lecturers.map((lecturer, idx) => (
              <motion.div
                key={lecturer.id}
                initial={mounted ? { opacity: 0, y: 30 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="w-full"
              >
                <Link
                  href={`/lecturer/${lecturer.id}`}
                  className="liquid-glass rounded-2xl p-6 cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[240px] text-left border border-white/5 group block"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-syne font-extrabold text-white mb-4">
                      {lecturer.name.charAt(0)}
                    </div>
                    <h4 className="font-heading italic text-xl text-[#fafafa] mb-1 leading-tight group-hover:text-[#aaaaaa] transition-colors">
                      {lecturer.name}
                    </h4>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block mb-3">
                      {lecturer.specialization}
                    </span>
                    <p className="text-white/60 font-body text-xs font-light line-clamp-3 leading-relaxed">
                      {lecturer.bio}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-[10px] font-mono text-white/40">
                    <span>{lecturer.videos_count || 10} videos</span>
                    <span className="text-[#888888] font-bold">View →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={mounted ? { opacity: 0, x: 40 } : false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col text-left lg:order-1"
          >
            <span className="text-[#888888] text-xs font-mono uppercase tracking-widest font-bold mb-4">
              Expert Faculty
            </span>
            <h2 className="text-4xl md:text-5xl font-heading italic tracking-tight text-white mb-6">
              Learn from Dean-level instructors.
            </h2>
            <p className="text-white/60 font-body font-light text-base leading-relaxed mb-8">
              Our teachers are certified pharmacy lecturers, authors, and industry researchers. They break down complex medicinal structures, pharmacological pathways, and dosage calculations into visual, easily-absorbed modules.
            </p>
            <div>
              <Link
                href="/videos"
                className="bg-white/5 hover:bg-white/10 text-white rounded-full px-6 py-3 font-semibold text-xs uppercase tracking-wider transition-all duration-300 border border-white/10 flex items-center gap-2 cursor-pointer w-fit"
              >
                Browse Video Library
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

        </div>

      </section>

      {/* ZONE 4: FEATURES GRID (FOUR PILLARS) */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5">
        
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={mounted ? { opacity: 0, scale: 0.95 } : false}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="liquid-glass rounded-full px-4 py-1.5 mb-6"
          >
            <span className="text-white text-xs font-mono uppercase tracking-widest font-semibold">
              The Architecture
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic tracking-tight leading-[0.9] text-center text-white">
            Everything you need in one portal.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <BookOpen size={20} />,
              title: "Syllabus Notes",
              desc: "Unit-wise notes aligned strictly to the PCI curriculum. Clear diagrams, simplified tables, and key definitions."
            },
            {
              icon: <FileSpreadsheet size={20} />,
              title: "Previous Papers",
              desc: "10+ years of university question papers sorted by subject and year to map exam trends."
            },
            {
              icon: <Video size={20} />,
              title: "Video Modules",
              desc: "Short, high-yield videos focusing on the toughest pharmaceutical and chemical reaction topics."
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "PCI Standard Compliant",
              desc: "Updated regularly. You learn exactly what is required for your university exams."
            }
          ].map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={mounted ? { opacity: 0, y: 20 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.6 }}
              className="liquid-glass rounded-2xl p-8 hover:-translate-y-1 transition-transform duration-300 border border-white/5"
            >
              <div className="liquid-glass rounded-full w-12 h-12 flex items-center justify-center mb-6 bg-white/5 border border-white/10">
                {pillar.icon}
              </div>
              <h4 className="text-xl font-heading italic tracking-tight text-white mb-3">
                {pillar.title}
              </h4>
              <p className="text-white/60 font-body font-light text-sm leading-relaxed">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </section>

      {/* ZONE 5: STATS */}
      <section className="relative w-full py-32 md:py-48 flex items-center justify-center overflow-hidden border-t border-white/5">
        
        {/* Ambient video poster or CSS gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#171717] via-[#171717]/70 to-[#171717] z-0 pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
          <motion.div 
            initial={mounted ? { opacity: 0, y: 30 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass-strong rounded-3xl p-10 md:p-16 w-full border border-white/5"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 text-center">
              {[
                { value: `${studentCount.toLocaleString()}+`, label: "Active Students" },
                { value: `${notesCount}+`, label: "PCI Chapter Guides" },
                { value: `${videosCount}+`, label: "High Yield Lectures" },
                { value: "98.4%", label: "Syllabus Compliance" }
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center space-y-2">
                  <span className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-white/50 font-mono text-[10px] tracking-widest uppercase font-bold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </section>

      {/* ZONE 6: TESTIMONIALS */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 border-t border-white/5">
        
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={mounted ? { opacity: 0, scale: 0.95 } : false}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="liquid-glass rounded-full px-4 py-1.5 mb-6"
          >
            <span className="text-white text-xs font-mono uppercase tracking-widest font-semibold">
              Student Endorsements
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic tracking-tight leading-[0.9] text-center text-white">
            Engineered for pharmacy results.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <GraduationCap size={20} />,
              eyebrow: "B.Pharm Student · Sem 4",
              title: "Cleared my biochemistry backlog.",
              body: "The organic reaction mechanisms on medicinal chemistry notes saved my semester. The diagrams are clean and match exactly what professors expect in answer sheets."
            },
            {
              icon: <Library size={20} />,
              eyebrow: "D.Pharm Student · Year 1",
              title: "Perfect reference companion.",
              body: "I stopped buying expensive reference books. PharmPaper summarizes all standard books like K.D. Tripathi and Lachman into simple chapter notes."
            },
            {
              icon: <ShieldCheck size={20} />,
              eyebrow: "Pharm.D Candidate",
              title: "Organized and updated.",
              body: "The syllabus guides match the latest PCI standard perfectly. It tells you exactly what is high-yield so you don't waste time on irrelevant topics."
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={mounted ? { opacity: 0, y: 20 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.6 }}
              className="liquid-glass rounded-2xl p-8 flex flex-col justify-between h-full border border-white/5"
            >
              <div className="mb-8">
                <div className="liquid-glass rounded-full w-12 h-12 flex items-center justify-center mb-6 bg-white/5 border border-white/10">
                  {item.icon}
                </div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono mb-3">{item.eyebrow}</div>
                <h4 className="text-2xl font-heading italic tracking-tight text-white mb-4 leading-tight">
                  {item.title}
                </h4>
                <p className="text-white/70 font-body font-light text-sm leading-relaxed">
                  "{item.body}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </section>

      {/* ZONE 7: CTA + NEWSLETTER + FOOTER */}
      <section className="relative w-full flex flex-col items-center justify-end overflow-hidden pt-32 border-t border-white/5">
        
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full mb-20">
          
          <motion.div 
            initial={mounted ? { opacity: 0, scale: 0.95 } : false}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="liquid-glass rounded-full px-4 py-1.5 mb-6"
          >
            <span className="text-white text-xs font-mono uppercase tracking-widest font-semibold">
              Get Started
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading italic tracking-tight leading-[0.85] text-center text-white mb-6">
            Join the vault.
          </h2>

          <motion.p
            initial={mounted ? { opacity: 0, y: 20 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white/60 font-body font-light text-base md:text-lg mb-12 max-w-xl mx-auto"
          >
            Sign up to our newsletter to receive the latest syllabus updates, chapter notes, and mock question sheets directly in your inbox.
          </motion.p>

          {/* Onboarding steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
            {[
              { num: "01", title: "Select Sem", desc: "Choose B.Pharm or D.Pharm semester workspace." },
              { num: "02", title: "Read Notes", desc: "Check visual syllabus guides and standard question packs." },
              { num: "03", title: "Ace Exams", desc: "Test your skills with previous year university papers." }
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={mounted ? { opacity: 0, y: 20 } : false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="liquid-glass rounded-2xl p-6 text-left border border-white/5"
              >
                <div className="text-[#888888] text-xs font-mono tracking-widest mb-3">STEP {step.num}</div>
                <h5 className="text-lg font-heading italic text-white mb-2 tracking-tight">{step.title}</h5>
                <p className="text-white/60 font-body font-light text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Box */}
          <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden mb-12 text-center">
            {emailStatus === "success" ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4 text-white"
              >
                <CheckCircle size={44} className="text-[#888888]" />
                <span className="font-syne font-bold text-base">You&apos;re on the list!</span>
                <p className="text-xs text-white/40">Check your inbox for updates shortly.</p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleEmailSignup}
                className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full"
              >
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your college email"
                  className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-300"
                  disabled={emailStatus === "loading"}
                />
                <button
                  type="submit"
                  disabled={emailStatus === "loading"}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-white/95 transition-all duration-200 cursor-pointer"
                >
                  {emailStatus === "loading" ? "Saving..." : "Notify Me"}
                  <Bell size={13} />
                </button>
              </form>
            )}

            {emailStatus === "error" && emailError && (
              <p className="text-red-400 text-xs font-mono mt-3">{emailError}</p>
            )}
          </div>

        </div>

        <Footer />

      </section>

    </div>
  );
}
