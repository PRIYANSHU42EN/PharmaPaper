"use client";

import { useEffect, useState } from "react";
import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

export default function SystemHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/health");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading && !data) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-brand-light" />
            System Health
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Status of internal and external services</p>
        </div>
        <button 
          onClick={fetchHealth}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-2 border border-white/10 rounded-lg text-white transition-colors font-mono text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.services?.map((service: any, index: number) => (
          <div key={index} className="liquid-glass rounded-xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-medium">{service.name}</h3>
              {service.status === 'operational' ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : service.status === 'degraded' ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Status</span>
                <span className={`capitalize ${
                  service.status === 'operational' ? 'text-success' : 
                  service.status === 'degraded' ? 'text-amber-500' : 'text-red-500'
                }`}>{service.status}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Uptime (30d)</span>
                <span className="text-slate-300">{service.uptime}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Latency</span>
                <span className="text-slate-300">{service.latency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
