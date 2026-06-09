"use client";

import React, { useState, useEffect } from "react";
import LecturerLayout from "@/components/lecturer/LecturerLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

interface Stats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  viewsThisMonth: number;
  viewsLastMonth: number;
}

interface TopVideo {
  id: string;
  title: string;
  subject: string;
  course: string;
  views: number;
  likes: number;
}

export default function LecturerAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [subscriberTrend, setSubscriberTrend] = useState<any[]>([]);
  const [watchRetention, setWatchRetention] = useState<any[]>([]);
  const [geoDistribution, setGeoDistribution] = useState<any[]>([]);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lecturer/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setPerformanceTrend(data.performanceTrend || []);
          setSubscriberTrend(data.subscriberTrend || []);
          setWatchRetention(data.watchRetention || []);
          setGeoDistribution(data.geoDistribution || []);
          setTopVideos(data.topVideos || []);
        }
      })
      .catch((err) => console.error("Error loading analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <LecturerLayout>
        <div className="flex justify-center items-center h-48 text-xs font-mono uppercase text-brand-cream/50 tracking-wider">
          Aggregating Statistics...
        </div>
      </LecturerLayout>
    );
  }

  // Calculate percentages
  const monthlyGrowth = stats
    ? (((stats.viewsThisMonth - stats.viewsLastMonth) / (stats.viewsLastMonth || 1)) * 100).toFixed(1)
    : "0";

  return (
    <LecturerLayout>
      <div className="flex flex-col gap-8 pb-12">
        <div>
          <h1 className="font-bebas text-3xl tracking-wide uppercase text-brand-cream">
            Analytics <span className="text-brand">Center</span>
          </h1>
          <p className="text-xs text-brand-cream/60 uppercase tracking-wider font-mono mt-1">
            Analyze video view stats, subscriber growth, and student retention trajectories
          </p>
        </div>

        {/* Quick totals cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2">
              <span className="text-[8px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Total Lectures</span>
              <span className="text-2xl font-mono text-white font-extrabold">{stats.totalVideos}</span>
              <span className="text-[7px] text-brand uppercase tracking-wider font-mono">Syllabus Covered</span>
            </div>

            <div className="p-5 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2">
              <span className="text-[8px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Total Views</span>
              <span className="text-2xl font-mono text-white font-extrabold">{stats.totalViews}</span>
              <span className="text-[7px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                +{monthlyGrowth}% growth vs last month
              </span>
            </div>

            <div className="p-5 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2">
              <span className="text-[8px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Active Likes</span>
              <span className="text-2xl font-mono text-white font-extrabold">{stats.totalLikes}</span>
              <span className="text-[7px] text-brand-cream/40 uppercase tracking-wider font-mono">Student Hearts</span>
            </div>

            <div className="p-5 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-2">
              <span className="text-[8px] text-brand-cream/40 font-mono uppercase tracking-widest font-bold">Subscribers</span>
              <span className="text-2xl font-mono text-white font-extrabold">{stats.totalSubscribers}</span>
              <span className="text-[7px] text-brand uppercase tracking-wider font-mono">Subscribed students</span>
            </div>
          </div>
        )}

        {/* Charts area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 30-day views area chart */}
          <div className="lg:col-span-8 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
              Daily Video Views (Last 30 Days)
            </h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="views" stroke="#0582CA" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top performing videos */}
          <div className="lg:col-span-4 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
              Top Lectures
            </h3>
            <div className="flex flex-col gap-3.5">
              {topVideos.map((video, idx) => (
                <div key={video.id} className="flex justify-between items-center gap-4 min-w-0 border-b border-brand-border/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-white font-mono truncate">{video.title}</span>
                    <span className="text-[7px] text-brand-cream/40 uppercase tracking-widest font-mono mt-0.5">
                      {video.course} - {video.subject}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-bold font-mono text-brand">{video.views}</span>
                    <span className="text-[6px] text-brand-cream/40 uppercase tracking-widest font-mono">Views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriber Trajectory */}
          <div className="lg:col-span-6 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
              Subscriber Growth Trend
            </h3>
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subscriberTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                  <XAxis dataKey="month" stroke="#0582CA" fontSize={8} tickLine={false} />
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
                  <Line type="monotone" dataKey="subscribers" stroke="#0582CA" strokeWidth={2} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Retention (Dropoff) */}
          <div className="lg:col-span-6 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
              Lecture Watch Retention % (Drop-off Rate)
            </h3>
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={watchRetention} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" />
                  <XAxis dataKey="interval" stroke="#0582CA" fontSize={8} tickLine={false} />
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
                  <Bar dataKey="retention" fill="#0582CA" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geographic student distribution */}
          <div className="lg:col-span-12 p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
              Indian Student Geographic Reach (Views Distribution)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {geoDistribution.map((item, index) => (
                <div key={index} className="p-4 bg-brand-charcoal/40 border border-brand-border/20 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-white font-mono truncate">{item.name}</span>
                  <div className="flex justify-between items-center text-[9px] font-mono mt-1">
                    <span className="text-brand-cream/50 uppercase">Aggregate Views</span>
                    <span className="text-brand font-bold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LecturerLayout>
  );
}
