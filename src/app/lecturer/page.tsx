"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LecturerLayout from "@/components/lecturer/LecturerLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  viewsThisMonth: number;
  viewsLastMonth: number;
}

interface Video {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected" | "published";
  rejection_reason?: string;
  created_at: string;
}

export default function LecturerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/lecturer/analytics").then((res) => res.json()),
      fetch("/api/lecturer/videos").then((res) => res.json()),
    ])
      .then(([analyticsData, videosData]) => {
        if (analyticsData.success) {
          setStats(analyticsData.stats);
          setPerformanceTrend(analyticsData.performanceTrend || []);
        }
        if (videosData.success) {
          setVideos(videosData.videos || []);
        }
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <LecturerLayout>
        <div className="flex justify-center items-center h-48 text-xs font-mono uppercase text-brand-cream/50 tracking-wider">
          Initializing Educator Environment...
        </div>
      </LecturerLayout>
    );
  }

  // Filter pending review items
  const pendingReviews = videos.filter((v) => v.status === "pending" || v.status === "rejected");

  return (
    <LecturerLayout>
      <div className="flex flex-col gap-8 pb-12">
        {/* Welcome title */}
        <div className="flex flex-col gap-1">
          <h1 className="font-bebas text-4xl tracking-wide uppercase text-brand-cream">
            Educator <span className="text-brand">Workspace</span>
          </h1>
          <p className="text-xs text-brand-cream/60 uppercase tracking-wider font-mono">
            Manage your digital classroom and monitor syllabus performance
          </p>
        </div>

        {/* Quick totals cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-xl">
              <span className="text-[9px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Total Views</span>
              <span className="text-3xl font-mono text-white font-extrabold">{stats.totalViews}</span>
              <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                ✓ Active Reach
              </span>
              <span className="absolute right-4 bottom-4 text-4xl opacity-10">👁️</span>
            </div>

            <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-xl">
              <span className="text-[9px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Subscribers</span>
              <span className="text-3xl font-mono text-white font-extrabold">{stats.totalSubscribers}</span>
              <span className="text-[8px] text-brand font-mono font-bold uppercase tracking-wider">
                👥 Subscribed Students
              </span>
              <span className="absolute right-4 bottom-4 text-4xl opacity-10">🎓</span>
            </div>

            <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-xl">
              <span className="text-[9px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Total Lectures</span>
              <span className="text-3xl font-mono text-white font-extrabold">{stats.totalVideos}</span>
              <span className="text-[8px] text-brand-cream/40 uppercase tracking-wider font-mono">
                📹 Syllabus Chapters
              </span>
              <span className="absolute right-4 bottom-4 text-4xl opacity-10">📹</span>
            </div>
          </div>
        )}

        {/* Mid grid: Actions and reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-4 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/lecturer/upload"
                className="w-full py-3.5 rounded-xl border border-brand/40 hover:border-brand hover:bg-brand/5 text-[10px] font-bold text-center uppercase tracking-widest font-mono text-brand transition-all"
              >
                📤 Upload Video
              </Link>
              <Link
                href="/lecturer/playlists"
                className="w-full py-3.5 rounded-xl border border-brand-border/40 hover:border-brand-border/80 hover:bg-brand-gray/10 text-[10px] font-bold text-center uppercase tracking-widest font-mono text-brand-cream transition-all"
              >
                📁 Create Playlist
              </Link>
              <Link
                href="/lecturer/analytics"
                className="w-full py-3.5 rounded-xl border border-brand-border/40 hover:border-brand-border/80 hover:bg-brand-gray/10 text-[10px] font-bold text-center uppercase tracking-widest font-mono text-brand-cream transition-all"
              >
                📈 View Analytics
              </Link>
            </div>
          </div>

          {/* Pending Reviews Notices */}
          <div className="lg:col-span-8 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
              Approvals & Moderation Notices
            </h3>

            {pendingReviews.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 gap-2">
                <span className="text-xl">✨</span>
                <p className="text-[10px] font-mono uppercase text-brand-cream/40">All videos are approved and active</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                {pendingReviews.map((video) => (
                  <div
                    key={video.id}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-4 font-mono ${
                      video.status === "rejected"
                        ? "bg-rose-500/5 border-rose-500/20 text-rose-300"
                        : "bg-amber-500/5 border-amber-500/20 text-amber-300"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white truncate">{video.title}</span>
                      {video.status === "rejected" && video.rejection_reason && (
                        <p className="text-[8px] text-rose-400 mt-1 line-clamp-1">
                          Reason: {video.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[8px] uppercase font-bold tracking-widest">
                        {video.status}
                      </span>
                      {video.status === "rejected" ? (
                        <Link
                          href="/lecturer/videos"
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/35 text-[7px] font-extrabold uppercase tracking-widest text-rose-300 transition-colors"
                        >
                          Resolve
                        </Link>
                      ) : (
                        <span className="text-lg">⏳</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Views chart */}
        <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-brand-border/20 pb-2">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
              Daily Views Performance Trend (Last 30 Days)
            </h3>
            <Link
              href="/lecturer/analytics"
              className="text-[8px] font-bold font-mono uppercase tracking-widest text-brand-cream/60 hover:text-brand transition-colors"
            >
              Full Analytics Report →
            </Link>
          </div>

          <div className="w-full h-64">
            {performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViewsHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0582CA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0582CA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                  <XAxis dataKey="date" stroke="#0582CA" fontSize={8} tickLine={false} />
                  <YAxis stroke="#0582CA" fontSize={8} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b0c10",
                      borderColor: "rgba(5, 130, 202, 0.4)",
                      fontSize: "10px",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#0582CA"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViewsHome)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono uppercase text-brand-cream/35">
                No view metrics available for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </LecturerLayout>
  );
}
