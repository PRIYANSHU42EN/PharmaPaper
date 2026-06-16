"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, CreditCard, Video, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/admin/overview");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch admin overview", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-red-400 font-mono">Failed to load overview data</div>;

  const STATS = [
    { title: "Total Users", value: data.stats.totalUsers, icon: Users, trend: "+12%", trendUp: true },
    { title: "Active Today", value: data.stats.activeToday, icon: ActivityIcon, trend: "+5%", trendUp: true },
    { title: "New This Week", value: data.stats.newUsersThisWeek, icon: UserPlus, trend: "-2%", trendUp: false },
    { title: "Total Revenue", value: `₹${data.stats.revenue.toLocaleString()}`, icon: CreditCard, trend: "+24%", trendUp: true },
  ];

  const PIE_COLORS = ['#00A6FB', '#0582CA', '#006494', '#003554'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">Overview</h1>
        <p className="text-muted font-mono text-sm mt-1">Real-time metrics and platform health</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className="liquid-glass rounded-xl p-5 border border-white/5 hover:border-brand/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-brand/10 rounded-lg text-brand-light group-hover:bg-brand/20 transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded flex items-center gap-1 ${stat.trendUp ? "bg-success/10 text-success" : "bg-red-500/10 text-red-400"}`}>
                {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-display font-medium text-white mb-1">{stat.value}</h3>
              <p className="text-sm font-mono text-muted uppercase tracking-wider">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 liquid-glass rounded-xl p-6 border border-white/5">
          <div className="mb-6">
            <h3 className="text-lg font-display text-white">Daily Active Users</h3>
            <p className="text-xs font-mono text-muted">Unique sessions over the last 7 days</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.dau} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A6FB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00A6FB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#003554', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Area type="monotone" dataKey="users" stroke="#00A6FB" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Required & Revenue */}
        <div className="space-y-6">
          {/* Action Required */}
          <div className="liquid-glass rounded-xl p-6 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-display text-white">Action Required</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <Video className="w-4 h-4 text-muted" />
                  <span className="text-sm font-mono text-slate-300">Pending Videos</span>
                </div>
                <span className="text-brand-light font-bold font-mono">{data.stats.pendingVideos}</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="liquid-glass rounded-xl p-6 border border-white/5">
            <h3 className="text-lg font-display text-white mb-6">Revenue Breakdown</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.charts.revenueBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#003554', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {data.charts.revenueBreakdown.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                  <span className="text-xs font-mono text-muted">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="liquid-glass rounded-xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-surface/30">
          <h3 className="text-lg font-display text-white">System Activity Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-[#003554]/50 text-muted uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Record</th>
                <th className="px-6 py-4 font-medium">Performed By</th>
                <th className="px-6 py-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.activity.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted">No recent activity</td>
                </tr>
              ) : (
                data.activity.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-brand/10 text-brand-light rounded text-xs border border-brand/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 truncate max-w-[200px]">
                      {log.table_name} {log.record_id ? `(${log.record_id.substring(0,8)})` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.performed_by || 'System'}</td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Icon fallbacks
function ActivityIcon(props: any) {
  return <TrendingUp {...props} />;
}
function TrendingDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}
