"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

export default function APIMonitorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAPIStats = async () => {
    try {
      const res = await fetch("/api/v1/admin/api-monitor");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAPIStats();
    const interval = setInterval(fetchAPIStats, 10000); // Live update every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-red-400 font-mono">Failed to load API stats</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-light" />
            API Monitor
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Real-time gateway metrics and error logging</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-mono text-success tracking-widest uppercase">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">Requests/Min</div>
          <div className="text-2xl font-display text-white">{data.metrics.rpm}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> Error Rate</div>
          <div className="text-2xl font-display text-white">{data.metrics.errorRate}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1 flex items-center gap-1"><Clock className="w-3 h-3 text-brand-light" /> Avg Response</div>
          <div className="text-2xl font-display text-white">{data.metrics.avgResponseTime}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">P95 Latency</div>
          <div className="text-2xl font-display text-white">{data.metrics.p95}</div>
        </div>
        <div className="liquid-glass rounded-xl p-5 border border-white/5">
          <div className="text-muted font-mono text-xs uppercase mb-1">P99 Latency</div>
          <div className="text-2xl font-display text-white">{data.metrics.p99}</div>
        </div>
      </div>

      <div className="liquid-glass rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-light" />
          <h3 className="font-display text-white">Live Request Log</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-[#003554]/80 text-muted uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Endpoint</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Latency</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">No recent API requests logged</td>
                </tr>
              ) : (
                data.logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] tracking-widest ${
                        log.method === 'GET' ? 'bg-brand/10 text-brand-light' :
                        log.method === 'POST' ? 'bg-success/10 text-success' :
                        log.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-300 truncate max-w-xs">{log.route}</td>
                    <td className="px-6 py-3">
                      <span className={`flex items-center gap-1 ${
                        log.status_code >= 500 ? 'text-red-400' :
                        log.status_code >= 400 ? 'text-amber-400' :
                        'text-success'
                      }`}>
                        {log.status_code >= 400 && <AlertTriangle className="w-3 h-3" />}
                        {log.status_code}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400">{log.response_time_ms}ms</td>
                    <td className="px-6 py-3 text-slate-500">{log.ip || 'Unknown'}</td>
                    <td className="px-6 py-3 text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</td>
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
