"use client";

import { useEffect, useState } from "react";
import { Database, HardDrive, Cpu, Activity, RefreshCw } from "lucide-react";

export default function DatabaseMonitorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDBStats = async () => {
    try {
      const res = await fetch("/api/v1/admin/database");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDBStats();
    const interval = setInterval(fetchDBStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-red-400 font-mono">Failed to load database stats</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-light" />
            Database Monitor
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Supabase instance health and table metrics</p>
        </div>
        <button 
          onClick={fetchDBStats}
          className="p-2 bg-surface hover:bg-surface-2 border border-white/10 rounded-lg text-muted hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="liquid-glass rounded-xl p-6 border border-white/5 space-y-6">
          <div>
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Connections
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-display text-white">{data.activeConnections}</span>
              <span className="text-sm text-slate-500 mb-1">/ {data.maxConnections} max</span>
            </div>
            <div className="w-full bg-surface h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-brand-light h-full rounded-full transition-all duration-1000"
                style={{ width: `${(data.activeConnections / data.maxConnections) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Hardware Utilization
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">CPU</span>
                  <span className="text-white">{data.cpuUsage}</span>
                </div>
                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: data.cpuUsage }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Memory</span>
                  <span className="text-white">{data.memoryUsage}</span>
                </div>
                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: data.memoryUsage }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 liquid-glass rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Table Sizes & Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead className="text-slate-500 text-xs">
                <tr>
                  <th className="pb-3 font-normal">Table Name</th>
                  <th className="pb-3 font-normal">Row Count</th>
                  <th className="pb-3 font-normal">Storage Size</th>
                  <th className="pb-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.tablesSize.map((t: any) => (
                  <tr key={t.name}>
                    <td className="py-3 text-white">{t.name}</td>
                    <td className="py-3 text-slate-400">{t.rows.toLocaleString()}</td>
                    <td className="py-3 text-slate-400">{t.size}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-success/10 text-success rounded text-[10px] uppercase tracking-wider">Healthy</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
