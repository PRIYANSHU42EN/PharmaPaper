"use client";

import { useEffect, useState } from "react";
import { Check, X, PlayCircle, Clock, Video as VideoIcon } from "lucide-react";
import Link from "next/link";

export default function VideoApprovalPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/videos?status=${statusTab}`);
      const json = await res.json();
      if (json.success) {
        setVideos(json.data.videos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [statusTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (id: string, action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      reason = prompt("Reason for rejection:") || "";
      if (!reason) return; // Cancelled
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/v1/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason })
      });
      const json = await res.json();
      if (json.success) {
        // Remove from list
        setVideos(prev => prev.filter(v => v.id !== id));
      } else {
        alert(json.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing action");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <VideoIcon className="w-6 h-6 text-brand-light" />
            Video Approval Workflow
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Review and moderate lecturer submissions</p>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        {["pending", "published", "rejected"].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors capitalize ${
              statusTab === tab 
                ? "border-brand-light text-brand-light" 
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="liquid-glass rounded-xl border border-white/5 p-12 text-center text-muted font-mono">
          No {statusTab} videos found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video.id} className="liquid-glass rounded-xl border border-white/5 overflow-hidden flex flex-col group">
              <div className="relative aspect-video bg-black">
                <img 
                  src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  alt={video.title}
                />
                <a 
                  href={`https://youtube.com/watch?v=${video.youtube_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                >
                  <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                </a>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-medium text-white mb-2 line-clamp-2">{video.title}</h3>
                
                <div className="flex items-center gap-2 mb-4 mt-auto">
                  {video.lecturer?.avatar_url ? (
                    <img src={video.lecturer.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-[10px] text-muted">
                      {video.lecturer?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 font-mono truncate">{video.lecturer?.name || 'Unknown'}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-muted mb-4 pt-4 border-t border-white/5">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(video.created_at).toLocaleDateString()}</span>
                  <span className="uppercase">{video.course} Sem {video.semester}</span>
                </div>

                {statusTab === "pending" && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(video.id, "reject")}
                      disabled={processingId === video.id}
                      className="flex-1 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded font-mono text-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction(video.id, "approve")}
                      disabled={processingId === video.id}
                      className="flex-1 py-2 bg-success/10 text-success hover:bg-success/20 rounded font-mono text-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </div>
                )}

                {statusTab === "rejected" && video.rejection_reason && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono mt-2">
                    <span className="font-bold">Reason:</span> {video.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
