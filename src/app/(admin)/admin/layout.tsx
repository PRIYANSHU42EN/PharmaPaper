"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  LineChart, 
  ShieldCheck, 
  ExternalLink,
  Lock,
  ArrowRight,
  LogOut,
  UploadCloud
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Content & PDFs", href: "/admin/content", icon: FileText },
  { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { name: "Analytics", href: "/admin/analytics", icon: LineChart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoaded, userId, signOut } = useAuth();
  const [devAdminAllowed, setDevAdminAllowed] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if admin session was previously unlocked
    const saved = localStorage.getItem("pharmdbm_admin_session");
    if (saved === "unlocked") {
      setDevAdminAllowed(true);
    }
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = passcode.trim().toLowerCase();
    if (normalized === "admin123" || normalized === "pharmapaper" || normalized === "pharmdbm") {
      localStorage.setItem("pharmdbm_admin_session", "unlocked");
      setDevAdminAllowed(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect passcode. Try 'admin123' or use Clerk sign-in.");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("pharmdbm_admin_session");
    setDevAdminAllowed(false);
    if (userId && signOut) {
      signOut();
    }
  };

  // Allow access if either Clerk authenticated OR dev admin unlocked
  const isAuthorized = Boolean(userId || devAdminAllowed);

  if (!isLoaded && !devAdminAllowed) {
    return (
      <div className="min-h-screen bg-[#051923] flex flex-col items-center justify-center text-white font-mono gap-3">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Verifying Admin Access...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#051923] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-14 h-14 bg-amber-400/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(251,192,45,0.2)]">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-display font-bold text-white tracking-wide">PharmaPaper Admin Panel</h2>
          <p className="text-slate-400 font-sans text-xs mt-1.5 mb-6">
            Sign in to manage curriculum notes, upload PDFs, and moderate student comments.
          </p>

          <div className="space-y-4">
            {/* Standard Clerk Login */}
            <Link
              href="/app/login?redirect_url=/admin"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl text-sm shadow-md hover:scale-[1.02] transition-transform"
            >
              Sign In via Clerk
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink mx-3 text-slate-500 text-xs font-mono uppercase">or quick access</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            {/* Quick Access Passcode */}
            <form onSubmit={handlePasscodeSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Enter Master Passcode (e.g. admin123)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono text-center focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-mono text-xs rounded-xl transition-colors"
              >
                Unlock Admin Console
              </button>
              {errorMsg && (
                <p className="text-rose-400 text-xs font-mono mt-1">{errorMsg}</p>
              )}
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <span>← Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#051923] overflow-hidden text-slate-200">
      {/* Sidebar - 250px */}
      <aside className="w-[250px] shrink-0 border-r border-white/10 bg-[#002233]/70 backdrop-blur-xl flex flex-col h-full sticky top-0 z-20">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(251,192,45,0.4)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight">Admin</h1>
              <p className="text-[10px] uppercase font-mono text-amber-400 tracking-widest">PharmaPaper</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-amber-400/15 text-amber-300 font-bold border-l-4 border-amber-400 shadow-[inset_2px_0_0_0_#FBC02D]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100 border-l-4 border-transparent"}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Bottom Sidebar info */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/admin/content"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <UploadCloud className="w-4 h-4" />
            Upload PDF Notes
          </Link>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleAdminLogout}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-[#061e2b]">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-[#002233]/80 backdrop-blur-md border-b border-white/10 px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Authenticated Session:</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SuperAdmin
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Database Online
            </span>
          </div>
        </header>

        <div className="p-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
