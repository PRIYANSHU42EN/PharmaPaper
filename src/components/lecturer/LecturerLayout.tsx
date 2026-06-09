"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";

interface LecturerLayoutProps {
  children: React.ReactNode;
}

export default function LecturerLayout({ children }: LecturerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded, userId } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lecturerName, setLecturerName] = useState("Lecturer");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (isLoaded && userId) {
      fetch("/api/lecturer/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.lecturer) {
            setLecturerName(data.lecturer.name);
            setAvatarUrl(data.lecturer.avatar_url);
          }
        })
        .catch((err) => console.error("Error loading lecturer profile for layout:", err));
    }
  }, [isLoaded, userId]);

  const navItems = [
    { href: "/lecturer", label: "Overview", icon: "📊" },
    { href: "/lecturer/upload", label: "Upload Video", icon: "📤" },
    { href: "/lecturer/videos", label: "Manage Videos", icon: "📹" },
    { href: "/lecturer/playlists", label: "Playlists", icon: "📁" },
    { href: "/lecturer/analytics", label: "Analytics", icon: "📈" },
    { href: "/lecturer/profile", label: "Profile Settings", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white flex flex-col md:flex-row">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.04] z-0" />
      <div className="absolute bottom-0 left-0 w-[45vw] h-[45vw] ambient-brand-glow pointer-events-none opacity-[0.02] z-0" />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-brand-border/40 md:sticky md:top-0 md:h-screen flex flex-col justify-between p-6 bg-brand-charcoal/30 backdrop-blur-xl z-40 shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] animate-pulse" />
              <span className="font-bebas text-xl tracking-wider text-brand-cream">
                PHARMA<span className="text-brand"> LECTURER</span>
              </span>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-brand-cream hover:text-brand transition-colors text-lg"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>

          <nav className={`flex-col gap-2 ${isMobileMenuOpen ? "flex" : "hidden md:flex"}`}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-brand text-brand-charcoal shadow-md font-extrabold"
                      : "text-brand-cream/60 hover:text-brand-cream hover:bg-brand-gray/30"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`flex flex-col gap-4 border-t border-brand-border/20 pt-6 mt-6 ${isMobileMenuOpen ? "flex" : "hidden md:flex"}`}>
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={lecturerName} className="w-8 h-8 rounded-full border border-brand-border/40 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center font-bold text-xs">
                {lecturerName[0]?.toUpperCase() || "L"}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-brand-cream/80 truncate font-mono">{lecturerName}</span>
              <span className="text-[7px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold">Faculty portal</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-xl border border-brand-border hover:border-rose-500/40 hover:text-rose-400 text-[9px] font-bold tracking-widest uppercase transition-all duration-300"
          >
            🔌 Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <header className="h-16 border-b border-brand-border/20 px-6 md:px-8 flex items-center justify-between bg-brand-charcoal/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest">
            <span className="text-brand uppercase font-bold">PharmPaper LMS</span>
            <span className="text-brand-cream/35">/</span>
            <span className="text-brand-cream/60 uppercase">Lecturer Portal</span>
          </div>

          <Link href="/" className="px-4 py-1.5 rounded-full border border-brand-border/40 hover:bg-brand-gray/30 text-[9px] font-bold tracking-widest uppercase transition-all">
            ← Student Portal
          </Link>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
