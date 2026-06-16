"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Video, 
  ShieldAlert, 
  LineChart, 
  Activity, 
  ShieldCheck, 
  Database, 
  HeartPulse, 
  Settings 
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Content", href: "/admin/content", icon: FileText },
  { name: "Videos", href: "/admin/content/videos", icon: Video },
  { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { name: "Analytics", href: "/admin/analytics", icon: LineChart },
  { name: "API Monitor", href: "/admin/api-monitor", icon: Activity },
  { name: "Security", href: "/admin/security", icon: ShieldCheck },
  { name: "Database", href: "/admin/database", icon: Database },
  { name: "Health", href: "/admin/health", icon: HeartPulse },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#051923] flex items-center justify-center text-white font-mono">Loading Admin...</div>;
  }

  if (!userId) {
    return <div className="min-h-screen bg-[#051923] flex items-center justify-center text-red-500 font-mono">Unauthorized</div>;
  }

  return (
    <div className="flex h-screen bg-[#051923] overflow-hidden">
      {/* Sidebar - 240px width */}
      <aside className="w-[240px] shrink-0 border-r border-white/5 bg-[#003554]/30 backdrop-blur-xl flex flex-col h-full sticky top-0 z-10">
        <div className="p-6 border-b border-white/5">
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-[0_0_15px_rgba(5,130,202,0.5)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white leading-tight">Admin</h1>
              <p className="text-[10px] uppercase font-mono text-brand-light tracking-widest">PharmPaper</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            // Special exact match for Overview to prevent it highlighting on other routes
            const isReallyActive = item.href === "/admin" ? pathname === "/admin" : isActive;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isReallyActive 
                    ? "bg-brand/15 text-brand-light border-l-2 border-brand-light shadow-[inset_2px_0_0_0_#00A6FB]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent"}
                `}
              >
                <Icon className={`w-4 h-4 ${isReallyActive ? "text-brand-light" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-white/5">
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_10px_#10B981] animate-pulse" />
            <span className="text-xs font-mono text-slate-300">System Nominal</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative">
        <div className="p-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
