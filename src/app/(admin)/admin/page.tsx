"use client";

import Link from "next/link";
import { FileText, ShieldAlert, LineChart, Layers, ArrowRight } from "lucide-react";

export default function AdminOverview() {
  const DASHBOARD_CARDS = [
    {
      title: "Content Management",
      description: "Manage curriculum hierarchy across semesters, subjects, and study units.",
      href: "/admin/content",
      icon: FileText,
      badge: "CRUD",
    },
    {
      title: "Comment Moderation",
      description: "Review and approve or delete comments left by students on study notes.",
      href: "/admin/moderation",
      icon: ShieldAlert,
      badge: "Queue",
    },
    {
      title: "Downloads Analytics",
      description: "Monitor unit-wise download counts, active material requests, and audit logs.",
      href: "/admin/analytics",
      icon: LineChart,
      badge: "Logs",
    },
  ];
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">Admin Dashboard</h1>
        <p className="text-muted font-mono text-sm mt-1">PharmPaper administrative controls and content hub</p>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DASHBOARD_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="liquid-glass rounded-xl p-6 border border-white/5 hover:border-brand/40 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-brand/10 rounded-lg text-brand-light group-hover:bg-brand/20 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-lg font-display font-medium text-white mb-2 group-hover:text-brand-light transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-400 font-mono leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-mono text-brand-light group-hover:translate-x-1 transition-transform">
                <span>Open Section</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Status Block */}
      <div className="liquid-glass rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <Layers className="w-5 h-5 text-brand-light" />
          <h3 className="text-base font-display text-white">System Configuration</h3>
        </div>
        <p className="text-sm font-mono text-slate-400">
          Curriculum funnel: Home → Semester → Subject → Unit → Download Timer. 100% free gated access with verified rate limiting.
        </p>
      </div>
    </div>
  );
}
