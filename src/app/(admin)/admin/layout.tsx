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
  LogOut,
  UploadCloud,
  KeyRound,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Content & PDFs", href: "/admin/content", icon: FileText },
  { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { name: "Analytics", href: "/admin/analytics", icon: LineChart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Single Active Session Forced Logout Message
  const [forcedLogoutMsg, setForcedLogoutMsg] = useState<string | null>(null);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  // Initial mount verification
  useEffect(() => {
    const sessionActive = 
      sessionStorage.getItem("pharmdbm_admin_session") === "unlocked" ||
      localStorage.getItem("pharmdbm_admin_session") === "unlocked";

    const localSessionId = 
      sessionStorage.getItem("pharmdbm_admin_session_id") || 
      localStorage.getItem("pharmdbm_admin_session_id");

    // Check if permanent admin password has been set & verify session
    fetch(`/api/v1/admin/auth?sessionId=${encodeURIComponent(localSessionId || "")}`)
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(Boolean(data.isConfigured));

        if (sessionActive && localSessionId) {
          // One-time check on page load: if session differs from active session, force logout
          if (data.isSingleSessionActive === false && data.activeSessionId) {
            triggerForcedLogout("You've been signed out because your account was signed in from another device.");
          } else {
            setIsAdminUnlocked(true);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to check admin auth status:", err);
        setIsConfigured(false);
      });
  }, []);

  // Single Active Session Guard: Supabase Realtime + Heartbeat + Visibility change
  useEffect(() => {
    if (!isAdminUnlocked) return;

    // 1. Supabase Realtime subscription on active session changes
    const channel = supabase.channel("admin-active-session-guard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rate_limit_config",
          filter: "endpoint=eq.__admin_active_session__"
        },
        (payload: any) => {
          const newSessionId = payload.new?.updated_by;
          const mySessionId = 
            sessionStorage.getItem("pharmdbm_admin_session_id") ||
            localStorage.getItem("pharmdbm_admin_session_id");

          if (newSessionId && mySessionId && newSessionId !== mySessionId) {
            triggerForcedLogout("You've been signed out because your account was signed in from another device.");
          }
        }
      )
      .subscribe();

    // 2. Heartbeat polling check (every 3 seconds for instant conflict detection across browsers)
    const interval = setInterval(async () => {
      const mySessionId = 
        sessionStorage.getItem("pharmdbm_admin_session_id") ||
        localStorage.getItem("pharmdbm_admin_session_id");

      if (!mySessionId) return;

      try {
        const res = await fetch("/api/v1/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check-session", clientSessionId: mySessionId }),
        });
        const data = await res.json();
        if (data.isValid === false && data.activeSessionId) {
          triggerForcedLogout("You've been signed out because your account was signed in from another device.");
        }
      } catch (_) {}
    }, 3000);

    // 3. Document visibility change (checks immediately when user switches tabs)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const mySessionId = 
          sessionStorage.getItem("pharmdbm_admin_session_id") ||
          localStorage.getItem("pharmdbm_admin_session_id");

        if (mySessionId) {
          fetch("/api/v1/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "check-session", clientSessionId: mySessionId }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.isValid === false && d.activeSessionId) {
                triggerForcedLogout("You've been signed out because your account was signed in from another device.");
              }
            })
            .catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAdminUnlocked]);

  function triggerForcedLogout(message: string) {
    sessionStorage.removeItem("pharmdbm_admin_session");
    sessionStorage.removeItem("pharmdbm_admin_passcode");
    sessionStorage.removeItem("pharmdbm_admin_session_id");
    localStorage.removeItem("pharmdbm_admin_session");
    localStorage.removeItem("pharmdbm_admin_passcode");
    localStorage.removeItem("pharmdbm_admin_session_id");
    setIsAdminUnlocked(false);
    setPassword("");
    setConfirmPassword("");
    setForcedLogoutMsg(message);
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setForcedLogoutMsg(null);

    if (!password || password.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-type carefully.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", password }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to set password. Please try again.");
        return;
      }

      // Store credentials and session ID
      sessionStorage.setItem("pharmdbm_admin_session", "unlocked");
      sessionStorage.setItem("pharmdbm_admin_passcode", password);
      localStorage.setItem("pharmdbm_admin_session", "unlocked");
      localStorage.setItem("pharmdbm_admin_passcode", password);

      if (data.sessionId) {
        sessionStorage.setItem("pharmdbm_admin_session_id", data.sessionId);
        localStorage.setItem("pharmdbm_admin_session_id", data.sessionId);
      }

      setIsAdminUnlocked(true);
      setIsConfigured(true);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while setting password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setForcedLogoutMsg(null);

    if (!password) {
      setErrorMsg("Please enter your admin password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Incorrect password. Please try again.");
        return;
      }

      // Store credentials and session ID
      sessionStorage.setItem("pharmdbm_admin_session", "unlocked");
      sessionStorage.setItem("pharmdbm_admin_passcode", password);
      localStorage.setItem("pharmdbm_admin_session", "unlocked");
      localStorage.setItem("pharmdbm_admin_passcode", password);

      if (data.sessionId) {
        sessionStorage.setItem("pharmdbm_admin_session_id", data.sessionId);
        localStorage.setItem("pharmdbm_admin_session_id", data.sessionId);
      }

      setIsAdminUnlocked(true);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while verifying password.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/v1/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch (_) {}

    sessionStorage.removeItem("pharmdbm_admin_session");
    sessionStorage.removeItem("pharmdbm_admin_passcode");
    sessionStorage.removeItem("pharmdbm_admin_session_id");
    localStorage.removeItem("pharmdbm_admin_session");
    localStorage.removeItem("pharmdbm_admin_passcode");
    localStorage.removeItem("pharmdbm_admin_session_id");
    setIsAdminUnlocked(false);
    setPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setForcedLogoutMsg(null);
  };

  // Change Password Handler (Part 3)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    if (!currentPassword) {
      setPasswordChangeError("Current password is required.");
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setPasswordChangeError("New password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New password and confirm password do not match.");
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const res = await fetch("/api/v1/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setPasswordChangeError(data.error || "Failed to update password. Please check your credentials.");
        return;
      }

      setPasswordChangeSuccess("Password updated successfully! Signing you out to re-authenticate with the new password...");

      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordChangeSuccess(null);
        handleAdminLogout();
      }, 1500);
    } catch (err: any) {
      setPasswordChangeError(err.message || "Network error while changing password.");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  if (isConfigured === null && !isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-[#051923] flex flex-col items-center justify-center text-white font-mono gap-3">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading Admin Console...</span>
      </div>
    );
  }

  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-[#051923] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-14 h-14 bg-amber-400/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(251,192,45,0.2)]">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            {isConfigured ? "PharmaPaper Admin Console" : "Set Master Admin Password"}
          </h2>
          <p className="text-slate-400 font-sans text-xs mt-1.5 mb-6">
            {isConfigured
              ? "Enter your permanent master password to unlock your administration session."
              : "Welcome! On this initial setup, create your permanent master admin password to secure the platform."}
          </p>

          {/* Forced Logout Conflict Banner (Part 2) */}
          {forcedLogoutMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-mono text-left flex items-start gap-2.5 animate-in fade-in duration-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-rose-300">Session Ended</p>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">{forcedLogoutMsg}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 text-left">
            {isConfigured ? (
              /* Ongoing Login Form */
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 text-center">
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your master password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setForcedLogoutMsg(null);
                      }}
                      disabled={loading}
                      autoFocus
                      className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono text-center focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-white uppercase tracking-wider"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Unlock Admin Session"}
                </button>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono text-center">
                    {errorMsg}
                  </div>
                )}
              </form>
            ) : (
              /* First-Time Setup Form */
              <form onSubmit={handleSetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Choose Master Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Confirm Master Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password to confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>Keep this password secure</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-white uppercase tracking-wider text-[10px]"
                  >
                    {showPassword ? "Hide text" : "Show text"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Setting Password..." : "Set Permanent Password & Enter"}
                </button>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono text-center">
                    {errorMsg}
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-mono">
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

        {/* Bottom Sidebar Settings & Account (Part 3) */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Quick PDF Upload Link */}
          <Link
            href="/admin/content"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <UploadCloud className="w-4 h-4" />
            Upload PDF Notes
          </Link>

          {/* Change Password Button (Part 3) */}
          <button
            type="button"
            onClick={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmNewPassword("");
              setPasswordChangeError(null);
              setPasswordChangeSuccess(null);
              setIsPasswordModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium font-mono"
            title="Change Master Admin Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>

          {/* View Public Site Link */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Sign Out Button */}
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
            <span className="text-xs font-mono text-slate-400">Active Admin:</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Single Session Guard Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Realtime Synced
            </span>
          </div>
        </header>

        <div className="p-8 pb-20">
          {children}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: CHANGE PASSWORD (PART 3)                           */}
      {/* ========================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-left">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">
                  Change Admin Password
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Re-verify your current password and assign a new master password
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 font-mono text-xs">
              {/* Field 1: Current Password */}
              <div>
                <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                  1. Current Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    placeholder="Enter your existing password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={passwordChangeLoading}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white pr-10 focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div>
                <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                  2. New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Create a strong new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordChangeLoading}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white pr-10 focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 3: Confirm New Password */}
              <div>
                <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                  3. Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password to confirm"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={passwordChangeLoading}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none disabled:opacity-50"
                />
                {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p className="text-[11px] text-rose-400 mt-1 font-sans">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Error Box */}
              {passwordChangeError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {/* Success Box */}
              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={passwordChangeLoading}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    passwordChangeLoading ||
                    !currentPassword ||
                    !newPassword ||
                    newPassword !== confirmNewPassword
                  }
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordChangeLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
