"use client";

import { useEffect, useState } from "react";
import { LineChart as LucideLineChart, Activity, Users, FileText, Search } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/v1/admin/analytics");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-red-400 font-mono">Failed to load analytics</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <LucideLineChart className="w-6 h-6 text-brand-light" />
            Platform Analytics
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Deep insights into user behavior and content performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">Page Views</div>
          <div className="text-2xl font-display text-white">{data.traffic.pageViews.toLocaleString()}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">Unique Visitors</div>
          <div className="text-2xl font-display text-white">{data.traffic.uniqueVisitors.toLocaleString()}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">Avg Session</div>
          <div className="text-2xl font-display text-white">{data.traffic.avgSessionDuration}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">Bounce Rate</div>
          <div className="text-2xl font-display text-white">{data.traffic.bounceRate}</div>
        </div>
      </div>

      <div className="liquid-glass rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-display text-white mb-6">Traffic Overview (14 Days)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.traffic.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00A6FB" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00A6FB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F2A7BE" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F2A7BE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#003554', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#F1F5F9' }}
              />
              <Area type="monotone" dataKey="views" name="Page Views" stroke="#00A6FB" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#F2A7BE" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="liquid-glass rounded-xl p-6 border border-white/5">
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <Video className="w-4 h-4 text-brand-light" /> Top Videos
          </h3>
          <div className="space-y-3">
            {data.content.topVideos.map((v: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-surface/30 rounded border border-white/5">
                <div className="font-medium text-sm text-slate-200">{v.title}</div>
                <div className="text-xs font-mono text-muted">{v.views.toLocaleString()} views</div>
              </div>
            ))}
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-6 border border-white/5">
          <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-light" /> Top Search Terms
          </h3>
          <div className="space-y-3">
            {data.content.topSearches.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-surface/30 rounded border border-white/5">
                <div className="font-mono text-sm text-slate-200">"{s.term}"</div>
                <div className="text-xs font-mono text-muted">{s.count.toLocaleString()} searches</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon fallback
function Video(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
  );
}
