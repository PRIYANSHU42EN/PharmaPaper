"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Check, Trash2, AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ModerationPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/moderation?tab=${tab}`);
      const json = await res.json();
      if (json.success) setComments(json.data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (id: string, action: string) => {
    if (action === "delete" && !confirm("Delete this comment permanently?")) return;
    
    try {
      const res = await fetch(`/api/v1/admin/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand-light" />
            Comment Moderation
          </h1>
          <p className="text-muted font-mono text-sm mt-1">Review flagged and pending user comments</p>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        {["pending", "reported"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors capitalize ${
              tab === t 
                ? "border-brand-light text-brand-light" 
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {t} Queue
          </button>
        ))}
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="liquid-glass rounded-xl border border-white/5 p-12 text-center text-muted font-mono flex flex-col items-center">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
          Queue is clear. No {tab} comments found.
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="liquid-glass rounded-xl p-5 border border-white/5 flex flex-col md:flex-row gap-6 hover:border-brand/30 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-white">{comment.user_name}</span>
                  <span className="text-xs text-slate-500 font-mono">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 bg-surface/30 p-3 rounded-lg border border-white/5 font-mono text-sm">
                  {comment.content}
                </p>
                <div className="mt-3 text-xs text-muted flex items-center gap-2">
                  <span className="px-2 py-1 bg-brand/10 text-brand-light rounded border border-brand/20">
                    Video: {comment.video?.title || "Unknown"}
                  </span>
                  
                  {/* Auto Mod Simulation */}
                  {comment.content.includes("http") && (
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                      <AlertTriangle className="w-3 h-3" /> Link Detected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex md:flex-col gap-2 shrink-0 md:w-32">
                <button 
                  onClick={() => handleAction(comment.id, "approve")}
                  className="flex-1 py-2 bg-success/10 text-success hover:bg-success/20 rounded font-mono text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button 
                  onClick={() => handleAction(comment.id, "delete")}
                  className="flex-1 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded font-mono text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
