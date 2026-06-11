"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import FloatingCard from "@/components/FloatingCard";
import NavbarBadge from "@/components/NavbarBadge";
import { SyllabusData } from "@/lib/db";
import { getSettings, supabase } from "@/lib/supabase";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const HeroCanvas = dynamic(() => import("@/components/HeroCanvas"), {
  ssr: false,
  loading: () => <HeroCanvasSkeleton />,
});

function HeroCanvasSkeleton() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <div className="w-48 h-64 rounded-3xl bg-gradient-to-br from-brand/5 to-brand-charcoal animate-pulse border border-brand-border/20" />
    </div>
  );
}

interface HomeClientProps {
  syllabusData: SyllabusData;
}

export default function HomeClient({ syllabusData }: HomeClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [courseType, setCourseType] = useState<"bpharm" | "dpharm">("bpharm");
  const semestersList = syllabusData[courseType];

  const [siteName, setSiteName] = useState("Pharma Paper");
  const [siteDesc, setSiteDesc] = useState("Your Complete Pharmacy Study Vault");
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState("");
  const [lecturers, setLecturers] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        .limit(4);
      if (!error && data) {
        setLecturers(data);
      }
    }
    fetchLecturers();
  }, []);

  // GSAP ScrollTrigger for Lecturer grid cards stagger animation
  useEffect(() => {
    if (lecturers.length === 0) return;
    if (typeof window !== "undefined") {
      const { gsap } = require("gsap");
      const { ScrollTrigger } = require("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      gsap.fromTo(
        ".lecturer-card-animate",
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#lecturers-section",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }, [lecturers]);

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

  return (
    <div id="scroll-container" className="relative w-full min-h-[500vh] bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white">
      {/* 3D WebGL Canvas Layer */}
      <HeroCanvas />

      {/* Premium Ambient Glows */}
      <div className="absolute top-[10vh] left-[5%] w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none" />
      <div className="absolute top-[120vh] right-[10%] w-[35vw] h-[35vw] ambient-brand-glow pointer-events-none" style={{ background: "radial-gradient(circle, rgba(5, 130, 202, 0.08) 0%, rgba(5, 25, 35, 0) 70%)" }} />
      <div className="absolute top-[240vh] left-[20%] w-[40vw] h-[40vw] ambient-brand-glow pointer-events-none" />

      {/* Floating Glass Navigation Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl h-16 glass-panel border-brand-border rounded-full flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-brand shadow-[0_0_10px_rgba(5,130,202,0.8)] animate-pulse" />
          <span className="font-bebas text-2xl tracking-wider text-brand-cream font-bold">
            {renderLogo(siteName)}
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-brand-cream/70">
          <a href="#notes" className="hover:text-brand transition-colors duration-200">Semester Notes</a>
          <a href="/pyq" className="hover:text-brand transition-colors duration-200">Question Papers</a>
          <a href="/videos" className="hover:text-brand transition-colors duration-200">Video Lectures</a>
          <a href="#vault" className="hover:text-brand transition-colors duration-200">Study Vault</a>
          <a href="/pricing" className="text-brand hover:text-brand/80 font-semibold transition-colors duration-200">Go Premium</a>
          <a href="/notes" className="hover:text-brand transition-colors duration-200 font-semibold">Workspace</a>
        </nav>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-full text-brand-cream/80 hover:text-brand-cream border border-brand-border hover:border-brand font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-5 py-2 rounded-full bg-brand hover:bg-brand/90 text-brand-charcoal font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(5,130,202,0.25)] cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-2">
              <NavbarBadge />
              <UserButton />
            </div>
          </Show>
        </div>
      </header>

      {/* Section 1: Hero Landing Page (0vh - 100vh) */}
      <section className="relative w-full h-screen flex items-center justify-center max-w-7xl mx-auto px-6 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* Y-axis floating content block */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left pt-16 lg:pt-0"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-brand-border text-brand text-[10px] uppercase font-bold tracking-widest self-center lg:self-start mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              PCI Syllabus Standardized Portal
            </div>
            
            <h1 className="font-bebas text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-brand-cream mb-6 tracking-tight uppercase">
              YOUR COMPLETE <br />
              <span className="text-brand">PHARMACY</span> <br />
              STUDY VAULT.
            </h1>
            
            <p className="max-w-xl text-brand-cream/60 text-sm md:text-base leading-relaxed mb-8 self-center lg:self-start">
              {siteDesc}. Access all your B Pharm and D Pharm semester notes, previous year question papers, and study materials in one clean, distraction-free platform. Read directly on the site or download for later—no distractions, just pure focus.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a href="#notes" className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full bg-brand hover:bg-brand/90 text-brand-charcoal font-semibold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_4px_25px_rgba(5,130,202,0.3)]">
                Launch Notes
              </a>
              <a href="#papers" className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full glass-panel glass-panel-hover border-brand-border text-brand-cream font-semibold text-xs tracking-widest uppercase transition-all duration-300">
                View Latest Papers
              </a>
            </div>
          </motion.div>
          
          {/* Spacer column reserved for the 3D book model */}
          {/* Bounded drag zone for the 3D book model */}
          <div className="lg:col-span-5 h-[40vh] lg:h-auto relative select-none">
            <div 
              id="hero-drag-zone" 
              className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing touch-pan-y pointer-events-auto"
            />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity select-none cursor-pointer">
          <span className="text-[10px] tracking-widest uppercase text-brand-cream/60">Scroll to Explore</span>
          <div className="w-5 h-9 rounded-full border-2 border-brand-cream/30 flex justify-center p-1">
            <div className="w-1.5 h-2 bg-brand rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Section 2: Learn from Expert Lecturers (100vh - 200vh) */}
      <section id="lecturers" className="relative w-full h-screen flex items-center justify-center max-w-7xl mx-auto px-6 z-20">
        <div id="lecturers-section" className="w-full flex flex-col justify-center">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-brand-border text-brand text-[10px] uppercase font-bold tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                Expert Guided Video Modules
              </div>
              <h2 className="font-bebas text-4xl md:text-5xl text-brand-cream uppercase tracking-wide leading-none">
                LEARN FROM <span className="text-brand">EXPERT LECTURERS</span>
              </h2>
              <p className="text-brand-cream/60 text-xs md:text-sm mt-3 max-w-2xl leading-relaxed">
                Deep dive into pharmaceutical sciences with lessons curated by experienced professionals. High-yield video lectures aligned with the PCI syllabus.
              </p>
            </div>
            <a href="/videos" className="px-6 py-2.5 rounded-full border border-brand-border hover:border-brand text-brand hover:text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300">
              View All Lectures →
            </a>
          </div>

          {/* Lecturer Mini Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {lecturers.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-panel border-brand-border p-6 rounded-2xl h-52 animate-pulse flex flex-col justify-between" />
              ))
            ) : (
              lecturers.map((lecturer) => (
                <a
                  key={lecturer.id}
                  href={`/lecturer/${lecturer.id}`}
                  className="lecturer-card-animate group p-6 rounded-2xl border border-brand-border/40 hover:border-brand/40 glass-panel hover:bg-brand/5 transition-all duration-300 flex flex-col justify-between h-52 text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {lecturer.avatar_url ? (
                      <img
                        src={lecturer.avatar_url}
                        alt={lecturer.name}
                        className="w-12 h-12 rounded-full object-cover border border-brand-border group-hover:border-brand transition-colors duration-300 shrink-0 bg-brand-charcoal"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center font-mono font-bold text-brand uppercase shrink-0">
                        {lecturer.name.charAt(0)}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-bold text-white font-mono leading-none group-hover:text-brand transition-colors duration-300">
                        {lecturer.name}
                      </h3>
                      {lecturer.specialization && (
                        <span className="text-[8px] text-brand font-mono font-bold uppercase tracking-wider">
                          {lecturer.specialization}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-brand-cream/50 line-clamp-3 leading-relaxed mt-3 flex-grow font-sans">
                    {lecturer.bio || "Providing premium video lectures and resource materials to pharmacy students."}
                  </p>

                  <div className="border-t border-brand-border/20 pt-3 flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-brand-cream/40">
                    <span>👥 {lecturer.total_subscribers || 0} Subscribed</span>
                    <span className="text-brand font-bold group-hover:translate-x-1 transition-transform">Profile →</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Core Experience - Semester/Year Selector (200vh - 300vh) */}
      <section id="notes" className="relative w-full h-screen flex items-center justify-center max-w-7xl mx-auto px-6 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
          {/* Left spacer column for the Three.js model flying in */}
          <div className="lg:col-span-5 h-[20vh] lg:h-auto pointer-events-none select-none order-2 lg:order-1" />

          {/* Right side content: Responsive grid with Anti-Gravity hover cards */}
          <div className="lg:col-span-7 flex flex-col justify-center order-1 lg:order-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-bebas text-4xl md:text-5xl text-brand-cream uppercase tracking-wide">
                SEMESTER <span className="text-brand">NOTES</span>
              </h2>
              
              {/* Toggle switch B. Pharm / D. Pharm */}
              <div className="flex p-1 rounded-full glass-panel border-brand-border w-fit">
                <button
                  onClick={() => { setCourseType("bpharm"); }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                    courseType === "bpharm"
                      ? "bg-brand text-brand-charcoal"
                      : "text-brand-cream/60 hover:text-brand-cream"
                  }`}
                >
                  B. Pharm
                </button>
                <button
                  onClick={() => { setCourseType("dpharm"); }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                    courseType === "dpharm"
                      ? "bg-brand text-brand-charcoal"
                      : "text-brand-cream/60 hover:text-brand-cream"
                  }`}
                >
                  D. Pharm
                </button>
              </div>
            </div>

            {/* Anti-Gravity Grid Layout for Semesters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {semestersList.map((sem) => (
                <FloatingCard
                  key={sem.id}
                  onClick={() => {
                    // Redirect directly to the dedicated note details dashboard page with parameters
                    router.push(`/notes?sem=${sem.id}&type=${courseType}`);
                  }}
                  className="p-5 flex flex-col justify-between aspect-square border border-brand-border cursor-pointer hover:border-brand transition-colors duration-300"
                >
                  <div className="flex flex-col h-full justify-between">
                    <span className="text-[10px] font-mono text-brand/80 tracking-wider font-semibold">
                      {sem.code}
                    </span>
                    <div>
                      <h3 className="font-bebas text-xl md:text-2xl text-brand-cream uppercase leading-none mb-1">
                        {sem.title}
                      </h3>
                      <p className="text-[9px] text-brand-cream/40 uppercase tracking-widest">
                        {sem.subjects.length} Core Subjects
                      </p>
                    </div>
                  </div>
                </FloatingCard>
              ))}
            </div>
            
            {/* Quick Helper hint */}
            <div className="mt-4 text-center text-[10px] text-brand-cream/30 uppercase tracking-widest font-mono">
              ⚡ Click any semester to launch the interactive workspace
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Question Papers & Vault Resources (200vh - 300vh) */}
      <section id="papers" className="relative w-full h-screen flex items-center justify-center max-w-7xl mx-auto px-6 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
          {/* Left side resources info */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h2 className="font-bebas text-4xl md:text-5xl text-brand-cream mb-6 uppercase tracking-wide">
              QUESTION PAPERS & <span className="text-brand">VAULT</span>
            </h2>
            
            <p className="text-brand-cream/60 text-sm leading-relaxed mb-8 max-w-xl">
              An organized repository of past years' question papers, PCI syllabus guides, and reference books. All resources are cataloged by year, semester, and individual subjects for effortless search.
            </p>

            {/* Anti-Gravity Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FloatingCard onClick={() => router.push('/pyq')} className="p-6 flex flex-col h-44 justify-between cursor-pointer">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand font-bold text-lg mb-4">
                    PYQ
                  </div>
                  <h3 className="text-sm font-semibold text-brand-cream uppercase mb-1">Previous Year Papers</h3>
                  <p className="text-[10px] text-brand-cream/40 leading-normal">
                    Organized question paper library from university examinations.
                  </p>
                </div>
              </FloatingCard>

              <FloatingCard className="p-6 flex flex-col h-44 justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand font-bold text-lg mb-4">
                    SYL
                  </div>
                  <h3 className="text-sm font-semibold text-brand-cream uppercase mb-1">Syllabus Guides</h3>
                  <p className="text-[10px] text-brand-cream/40 leading-normal">
                    PCI regulations & university syllabus roadmaps for B Pharm.
                  </p>
                </div>
              </FloatingCard>

              <FloatingCard className="p-6 flex flex-col h-44 justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center text-brand font-bold text-lg mb-4">
                    REF
                  </div>
                  <h3 className="text-sm font-semibold text-brand-cream uppercase mb-1">Reference Books</h3>
                  <p className="text-[10px] text-brand-cream/40 leading-normal">
                    Essential reference e-books and reading lists for studies.
                  </p>
                </div>
              </FloatingCard>
            </div>
          </div>

          {/* Right spacer column for the Three.js model flying in */}
          <div className="lg:col-span-5 h-[30vh] lg:h-auto pointer-events-none select-none" />
        </div>
      </section>

      {/* Section 4: Portal CTA & Footer (300vh - 400vh) */}
      <section id="vault" className="relative w-full h-screen flex flex-col items-center justify-center max-w-7xl mx-auto px-6 z-20">
        <div className="glass-panel border-brand-border w-full max-w-4xl p-8 md:p-12 rounded-3xl text-center relative overflow-hidden">
          {/* Subtle inside ambient light */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand/15 filter blur-3xl pointer-events-none" />

          <h2 className="font-bebas text-4xl md:text-7xl text-brand-cream mb-4 uppercase tracking-wide leading-none">
            Join the Pharma Paper <span className="text-brand">Vault</span>
          </h2>
          
          <p className="text-brand-cream/60 text-xs md:text-sm max-w-xl mx-auto mb-10 leading-relaxed">
            Register your email to receive updates on the latest notes upload, PCI updates, and study resources.
          </p>

          {emailStatus === "success" ? (
            <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-green-400 text-sm font-semibold">
              <span>✓</span> You're on the list! We'll be in touch soon.
            </div>
          ) : (
            <form
              id="newsletter-signup-form"
              className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-center justify-center"
              onSubmit={handleEmailSignup}
            >
              <input
                id="newsletter-email-input"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-5 py-3 rounded-full bg-brand-charcoal border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-300 placeholder:text-brand-cream/20"
                required
                aria-label="Email address for newsletter"
                disabled={emailStatus === "loading"}
              />
              <button
                type="submit"
                disabled={emailStatus === "loading"}
                className="w-full sm:w-auto shrink-0 px-8 py-3 rounded-full bg-brand hover:bg-brand/90 disabled:opacity-60 text-brand-charcoal font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform active:scale-95 shadow-[0_4px_20px_rgba(5,130,202,0.3)]"
              >
                {emailStatus === "loading" ? "Saving..." : "Get Access"}
              </button>
            </form>
          )}
          {emailStatus === "error" && emailError && (
            <p className="text-red-400 text-[11px] text-center mt-2 font-mono">{emailError}</p>
          )}

          <div className="mt-8 flex justify-center items-center gap-6 text-[10px] text-brand-cream/40 uppercase tracking-widest font-semibold">
            <span>📚 Distraction-Free Portal</span>
            <span>⚡ Weightless Render Engine</span>
          </div>
        </div>

      </section>
      <Footer />
    </div>
  );
}
