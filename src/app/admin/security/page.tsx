"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, Ban, AlertOctagon, Plus, Search } from "lucide-react";

export default function SecurityCenterPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");

  const fetchSecurityData = async () => {
    try {
      const res = await fetch("/api/v1/admin/security");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleBlockIp = async () => {
    if (!newIp) return;
    try {
      const res = await fetch("/api/v1/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block_ip", ip: newIp, reason: newReason })
      });
      if (res.ok) {
        setNewIp("");
        setNewReason("");
        fetchSecurityData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
            <Shield className="w-6 h-6 text-brand-light" />
            Security Center
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Manage platform security, IP blocks, and audit logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IP Blocklist */}
        <div className="lg:col-span-1 space-y-6">
          <div className="liquid-glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Ban className="w-4 h-4" /> Add IP to Blocklist
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="IP Address (e.g., 192.168.1.1)" 
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light font-mono transition-colors"
              />
              <input 
                type="text" 
                placeholder="Reason for blocking..." 
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light font-mono transition-colors"
              />
              <button 
                onClick={handleBlockIp}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg font-mono text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Block IP
              </button>
            </div>
          </div>

          <div className="liquid-glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Active IP Blocks
            </h3>
            {data?.blocklist?.length === 0 ? (
              <p className="text-sm text-slate-500 font-mono">No IPs currently blocked.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {data?.blocklist?.map((block: any) => (
                  <div key={block.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                    <div className="font-mono text-sm text-red-400">{block.ip_address}</div>
                    <div className="text-xs text-slate-400 mt-1">{block.reason}</div>
                    <div className="text-[10px] text-slate-500 mt-2 font-mono">Blocked on {new Date(block.blocked_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="liquid-glass rounded-xl border border-white/5 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-mono text-muted uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" /> System Audit Logs
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted" />
                <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  className="bg-surface/50 border border-white/10 rounded-lg pl-8 pr-4 py-1 text-xs text-text focus:outline-none focus:border-brand-light font-mono transition-colors"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-[#003554]/50 text-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Actor</th>
                    <th className="px-6 py-3 font-medium">Record ID</th>
                    <th className="px-6 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.auditLogs?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted">No audit logs found</td>
                    </tr>
                  ) : (
                    data?.auditLogs?.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="px-6 py-3 text-white">
                          <span className="px-2 py-0.5 bg-surface rounded border border-white/5 text-[10px] tracking-widest">{log.action}</span>
                        </td>
                        <td className="px-6 py-3 text-slate-400 text-xs">{log.actor_id}</td>
                        <td className="px-6 py-3 text-slate-500 text-xs">{log.record_id || '-'}</td>
                        <td className="px-6 py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
