"use client";

import { useEffect, useState, useRef } from "react";
import { 
  LineChart as LucideLineChart, 
  Download, 
  FileText, 
  Radio, 
  Zap, 
  Layers, 
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DownloadStat {
  unitId: string;
  unitTitle: string;
  unitNumber: number;
  subjectName: string;
  course: string;
  downloadsCount: number;
  lastDownloadedAt?: string;
  isRecent?: boolean;
}

interface LiveActivity {
  id: string;
  unitTitle: string;
  subjectName: string;
  course: string;
  time: string;
}

export default function AnalyticsPage() {
  const [downloadStats, setDownloadStats] = useState<DownloadStat[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, { title: string; unit_number: number; subject: string; course: string }>>({});
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [recentActivities, setRecentActivities] = useState<LiveActivity[]>([]);
  const [totalDownloads, setTotalDownloads] = useState<number>(0);
  const recentTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  // 1. Initial Data Fetching
  async function loadInitialData() {
    setLoading(true);
    try {
      // Fetch all units with subject and semester info
      const { data: unitsData } = await supabase
        .from("units")
        .select("id, title, unit_number, subjects(name, semesters(name, courses(code)))");

      const uMap: Record<string, { title: string; unit_number: number; subject: string; course: string }> = {};
      (unitsData || []).forEach((u: any) => {
        uMap[u.id] = {
          title: u.title,
          unit_number: u.unit_number || 1,
          subject: u.subjects?.name || "Subject",
          course: (u.subjects?.semesters?.courses?.code || "bpharm").toUpperCase(),
        };
      });
      setUnitsMap(uMap);

      // Fetch download logs
      const { data: logsData, error: logsErr } = await supabase
        .from("download_logs")
        .select("id, unit_id, downloaded_at")
        .order("downloaded_at", { ascending: false });

      if (logsErr) {
        console.error("Error loading download logs:", logsErr);
      }

      const counts: Record<string, { count: number; lastAt: string }> = {};
      let total = 0;

      (logsData || []).forEach((row: any) => {
        if (!row.unit_id) return;
        total++;
        if (!counts[row.unit_id]) {
          counts[row.unit_id] = { count: 1, lastAt: row.downloaded_at };
        } else {
          counts[row.unit_id].count++;
        }
      });

      setTotalDownloads(total);

      // Format stats
      const statsList: DownloadStat[] = Object.entries(counts).map(([uId, c]) => {
        const uInfo = uMap[uId] || { title: `Unit (${uId.slice(0, 8)})`, unit_number: 1, subject: "Syllabus Unit", course: "B.PHARM" };
        return {
          unitId: uId,
          unitTitle: uInfo.title,
          unitNumber: uInfo.unit_number,
          subjectName: uInfo.subject,
          course: uInfo.course,
          downloadsCount: c.count,
          lastDownloadedAt: c.lastAt,
        };
      });

      // Sort by downloads descending
      statsList.sort((a, b) => b.downloadsCount - a.downloadsCount);
      setDownloadStats(statsList);

      // Extract latest 5 activities for ticker
      const initialActivities: LiveActivity[] = (logsData || []).slice(0, 5).map((l: any) => {
        const u = uMap[l.unit_id];
        return {
          id: l.id,
          unitTitle: u ? `Unit ${u.unit_number}: ${u.title}` : "Curriculum Notes",
          subjectName: u?.subject || "Pharmacy Subject",
          course: u?.course || "BPHARM",
          time: new Date(l.downloaded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      });
      setRecentActivities(initialActivities);

    } catch (err) {
      console.error("Failed to initialize analytics data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Realtime Subscription (postgres_changes + broadcast)
  useEffect(() => {
    function handleIncomingDownload(unitId: string) {
      // 1. Increment total downloads counter
      setTotalDownloads((prev) => prev + 1);

      // 2. Update specific unit count in local state without refetching
      setDownloadStats((prevStats) => {
        const existingIdx = prevStats.findIndex((s) => s.unitId === unitId);
        let updated: DownloadStat[];

        if (existingIdx >= 0) {
          updated = [...prevStats];
          updated[existingIdx] = {
            ...updated[existingIdx],
            downloadsCount: updated[existingIdx].downloadsCount + 1,
            lastDownloadedAt: new Date().toISOString(),
            isRecent: true,
          };
        } else {
          // If this unit wasn't in the list yet, insert it
          const uInfo = unitsMap[unitId] || {
            title: `Unit (${unitId.slice(0, 8)})`,
            unit_number: 1,
            subject: "Pharmacy Unit",
            course: "BPHARM",
          };
          updated = [
            {
              unitId,
              unitTitle: uInfo.title,
              unitNumber: uInfo.unit_number,
              subjectName: uInfo.subject,
              course: uInfo.course,
              downloadsCount: 1,
              lastDownloadedAt: new Date().toISOString(),
              isRecent: true,
            },
            ...prevStats,
          ];
        }

        // Re-sort so top downloaded floats up
        updated.sort((a, b) => b.downloadsCount - a.downloadsCount);
        return updated;
      });

      // 3. Add to live activity feed
      const uInfo = unitsMap[unitId];
      const newActivity: LiveActivity = {
        id: `live-${Date.now()}-${Math.random()}`,
        unitTitle: uInfo ? `Unit ${uInfo.unit_number}: ${uInfo.title}` : "Curriculum Notes",
        subjectName: uInfo?.subject || "Pharmacy Subject",
        course: uInfo?.course || "BPHARM",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };

      setRecentActivities((prev) => [newActivity, ...prev.slice(0, 7)]);

      // 4. Remove highlight animation after 3 seconds
      if (recentTimerRef.current[unitId]) clearTimeout(recentTimerRef.current[unitId]);
      recentTimerRef.current[unitId] = setTimeout(() => {
        setDownloadStats((prev) =>
          prev.map((s) => (s.unitId === unitId ? { ...s, isRecent: false } : s))
        );
      }, 3000);
    }

    // Set up Supabase Realtime channel per PART 2
    const channel = supabase
      .channel("download-analytics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "download_logs" },
        (payload: any) => {
          const unitId = payload.new?.unit_id;
          if (unitId) {
            handleIncomingDownload(unitId);
          }
        }
      )
      .on("broadcast", { event: "download" }, (event: any) => {
        const unitId = event.payload?.unit_id;
        if (unitId) {
          handleIncomingDownload(unitId);
        }
      })
      .subscribe((status) => {
        setIsLiveConnected(status === "SUBSCRIBED");
      });

    // Cleanup subscription on unmount per PART 2 rule 5
    return () => {
      supabase.removeChannel(channel);
      Object.values(recentTimerRef.current).forEach(clearTimeout);
    };
  }, [unitsMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
              <LucideLineChart className="w-6 h-6 text-amber-400" />
              Download Analytics
            </h1>

            {/* Pulsing Live Indicator (PART 2 Requirement 4) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-extrabold tracking-wider text-[11px]">LIVE</span>
              <span className="text-slate-400 text-[10px] hidden md:inline">
                {isLiveConnected ? "• Connected" : "• Listening"}
              </span>
            </div>
          </div>
          <p className="text-slate-400 font-mono text-xs sm:text-sm mt-1">
            Real-time telemetry of lecture notes downloaded across all semesters and units
          </p>
        </div>

        <button
          onClick={loadInitialData}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
          title="Manual refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="text-slate-400 font-mono text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total PDF Downloads</span>
            <Download className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-display font-extrabold text-white">
            {totalDownloads.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Updates live automatically</span>
          </div>
        </div>

        <div className="bg-slate-900/70 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="text-slate-400 font-mono text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Units with Downloads</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-display font-extrabold text-white">
            {downloadStats.length}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2">
            Across B.Pharm & D.Pharm
          </div>
        </div>

        <div className="bg-slate-900/70 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="text-slate-400 font-mono text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Realtime Engine</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-display font-bold text-emerald-400 font-mono mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Supabase Realtime</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2">
            Zero polling · Instant WebSocket push
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      {recentActivities.length > 0 && (
        <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-slate-900/60 rounded-2xl border border-blue-500/20 p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-300 font-bold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Latest Download Activity (Stream)</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 shrink-0 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white font-semibold truncate max-w-[160px]">{act.unitTitle}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300/90 text-[11px]">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Breakdown Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              Per-Unit Download Leaderboard
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Updates in real-time as users click "Download Now" on the public site
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Sorted by total volume
          </span>
        </div>

        {loading ? (
          <div className="w-full h-48 flex flex-col items-center justify-center gap-2 font-mono text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading telemetry...</span>
          </div>
        ) : downloadStats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No downloads logged yet. Visit any unit page on the public site and complete a download to see live analytics.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {downloadStats.map((item) => (
              <div
                key={item.unitId}
                className={`p-4 flex items-center justify-between transition-all duration-500 ${
                  item.isRecent
                    ? "bg-emerald-500/15 border-l-4 border-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]"
                    : "hover:bg-white/5 border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    item.isRecent ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-600/15 text-blue-400"
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300">
                        U{item.unitNumber}
                      </span>
                      <h4 className="text-sm font-semibold text-white">
                        {item.unitTitle}
                      </h4>
                      {item.isRecent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold animate-pulse">
                          +1 Just now!
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      {item.subjectName} · <span className="text-amber-400/90">{item.course}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-mono font-black transition-all ${
                    item.isRecent ? "text-emerald-400 scale-110" : "text-white"
                  }`}>
                    {item.downloadsCount.toLocaleString()}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    downloads
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
