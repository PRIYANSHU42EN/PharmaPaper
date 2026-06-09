"use client";

import React, { useState, useEffect } from "react";
import LecturerLayout from "@/components/lecturer/LecturerLayout";
import { motion, AnimatePresence } from "framer-motion";

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  is_premium: boolean;
  free_preview_seconds: number;
  subject: string;
  course: string;
  semester: number;
  unit: number;
  status: "pending" | "approved" | "rejected" | "published";
  rejection_reason?: string;
  notes?: string;
  view_count: number;
  like_count: number;
  created_at: string;
}

export default function LecturerVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit states
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editFreePreview, setEditFreePreview] = useState(120);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVideos = () => {
    setLoading(true);
    fetch("/api/lecturer/videos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVideos(data.videos || []);
        } else {
          showToast(data.error || "Failed to load videos", "error");
        }
      })
      .catch((err) => {
        console.error("Load videos error:", err);
        showToast("Error retrieving lecture videos list", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/lecturer/videos?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Video deleted successfully");
        setVideos(videos.filter((v) => v.id !== id));
      } else {
        showToast(data.error || "Failed to delete video", "error");
      }
    } catch (err) {
      console.error("Delete video error:", err);
      showToast("Error deleting video", "error");
    }
  };

  const handleOpenEdit = (video: Video) => {
    setEditingVideo(video);
    setEditTitle(video.title || "");
    setEditDescription(video.notes || "");
    setEditIsPremium(video.is_premium || false);
    setEditFreePreview(video.free_preview_seconds || 120);
  };

  const handleSaveEdit = async (resubmit = false) => {
    if (!editTitle.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/lecturer/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVideo?.id,
          title: editTitle.trim(),
          description: editDescription.trim(),
          isPremium: editIsPremium,
          freePreviewDuration: editFreePreview,
          resubmit: resubmit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(resubmit ? "Video resubmitted for admin review!" : "Video updated successfully");
        setEditingVideo(null);
        fetchVideos(); // Reload list
      } else {
        showToast(data.error || "Failed to save edits", "error");
      }
    } catch (err) {
      console.error("Save edit error:", err);
      showToast("Error saving video details", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getStatusColor = (status: Video["status"]) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "rejected":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "published":
        return "bg-sky-500/10 border-sky-500/20 text-sky-400";
      case "pending":
      default:
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    }
  };

  return (
    <LecturerLayout>
      <div className="flex flex-col gap-8 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bebas text-3xl tracking-wide uppercase text-brand-cream">
              Manage <span className="text-brand">Lectures</span>
            </h1>
            <p className="text-xs text-brand-cream/60 uppercase tracking-wider font-mono mt-1">
              Track approval statuses, view engagement metrics, and edit video details
            </p>
          </div>
          <button
            onClick={fetchVideos}
            className="px-4 py-2 border border-brand-border/40 hover:bg-brand-gray/30 rounded-xl text-[10px] uppercase font-mono tracking-widest font-bold text-brand-cream transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-xs font-mono uppercase text-brand-cream/50 tracking-wider">
            Loading Lecture Directory...
          </div>
        ) : videos.length === 0 ? (
          <div className="glass-panel border-brand-border/40 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <span className="text-3xl">📹</span>
            <div>
              <p className="text-xs font-bold text-white font-mono uppercase">No videos found</p>
              <p className="text-[9px] text-brand-cream/40 uppercase tracking-widest mt-1">
                Get started by uploading your first syllabus lecture
              </p>
            </div>
            <a
              href="/lecturer/upload"
              className="mt-2 px-6 py-2.5 rounded-xl bg-brand text-brand-charcoal text-[9px] uppercase font-mono tracking-widest font-extrabold shadow-lg transition-all"
            >
              Upload Video
            </a>
          </div>
        ) : (
          <div className="glass-panel border-brand-border/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border/20 bg-brand-charcoal/30 text-[9px] font-mono uppercase tracking-wider text-brand-cream/60">
                    <th className="py-4 px-6">Video Details</th>
                    <th className="py-4 px-4">Category / Subject</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-center">Engagement</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/10">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-brand-gray/10 transition-colors">
                      <td className="py-4 px-6 min-w-[280px]">
                        <div className="flex gap-4">
                          <div className="w-24 aspect-video rounded-lg overflow-hidden border border-brand-border/40 shrink-0 bg-brand-charcoal">
                            <img
                              src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80";
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate font-mono">{video.title}</span>
                            <span className="text-[8px] text-brand-cream/40 font-mono tracking-wide">
                              ID: {video.youtube_id} | Added {new Date(video.created_at).toLocaleDateString("en-IN")}
                            </span>
                            {video.is_premium && (
                              <span className="w-fit px-1.5 py-0.5 rounded bg-brand/20 border border-brand/40 text-[7px] font-bold uppercase tracking-widest text-brand font-mono">
                                💎 Premium ({video.free_preview_seconds}s preview)
                              </span>
                            )}
                          </div>
                        </div>

                        {video.status === "rejected" && video.rejection_reason && (
                          <div className="mt-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[9px] text-rose-300 font-mono flex flex-col gap-1.5 max-w-[500px]">
                            <span className="font-bold uppercase tracking-widest text-[8px] text-rose-400">⚠️ Rejection Feedback:</span>
                            <p>{video.rejection_reason}</p>
                            <button
                              onClick={() => handleOpenEdit(video)}
                              className="w-fit text-[8px] font-bold text-brand uppercase tracking-widest hover:underline"
                            >
                              ⚙️ Edit & Resubmit Video
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-[9px] text-brand-cream/80 max-w-[200px] truncate">
                        <span className="font-bold text-brand block uppercase">{video.course} (Sem {video.semester})</span>
                        <span className="block truncate mt-0.5">{video.subject}</span>
                        <span className="block text-[8px] text-brand-cream/40 uppercase mt-0.5">Unit {video.unit}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[8px] font-mono font-bold uppercase tracking-widest ${getStatusColor(video.status)}`}>
                          {video.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-mono">
                        <div className="inline-flex gap-4 text-[9px] text-brand-cream/70 font-semibold">
                          <div>
                            <span className="block text-white font-bold">{video.view_count || 0}</span>
                            <span className="text-[7px] text-brand-cream/35 uppercase">Views</span>
                          </div>
                          <div>
                            <span className="block text-white font-bold">{video.like_count || 0}</span>
                            <span className="text-[7px] text-brand-cream/35 uppercase">Likes</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(video)}
                            className="px-3 py-1.5 border border-brand-border/40 hover:bg-brand-gray/30 rounded-lg text-[8px] font-bold uppercase tracking-widest font-mono text-brand-cream transition-all"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(video.id, video.title)}
                            className="px-3 py-1.5 border border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40 rounded-lg text-[8px] font-bold uppercase tracking-widest font-mono text-rose-400 transition-all"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      <AnimatePresence>
        {editingVideo && (
          <div className="fixed inset-0 bg-brand-charcoal/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel border-brand-border/40 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="border-b border-brand-border/20 px-6 py-4 flex justify-between items-center bg-brand-charcoal/20">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-brand uppercase font-extrabold">Modify Video Properties</span>
                  <span className="text-[8px] font-mono text-brand-cream/40 uppercase tracking-wider mt-0.5">{editingVideo.title}</span>
                </div>
                <button
                  onClick={() => setEditingVideo(null)}
                  className="text-brand-cream/50 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Lecture Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Description / Synopsis</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-brand-charcoal/20 border border-brand-border/20 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-mono text-white">Premium Lecture Pass</span>
                    <span className="text-[7px] text-brand-cream/40 uppercase tracking-widest font-mono">
                      Restricted to premium plans
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsPremium(!editIsPremium)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editIsPremium ? "bg-brand" : "bg-brand-gray"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        editIsPremium ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {editIsPremium && (
                  <div className="flex flex-col gap-1.5 border-t border-brand-border/20 pt-3 mt-1">
                    <div className="flex justify-between items-center text-[9px] font-mono uppercase font-bold text-brand-cream/60">
                      <span>Free Preview Duration</span>
                      <span className="text-brand">{editFreePreview} Seconds</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={300}
                      step={10}
                      value={editFreePreview}
                      onChange={(e) => setEditFreePreview(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-brand-charcoal rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-brand-border/20 px-6 py-4 flex gap-3 justify-end bg-brand-charcoal/20">
                <button
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl border border-brand-border/40 hover:bg-brand-gray/30 text-[9px] font-bold uppercase tracking-widest font-mono text-brand-cream transition-all"
                >
                  Cancel
                </button>
                {editingVideo.status === "rejected" ? (
                  <button
                    onClick={() => handleSaveEdit(true)}
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-xl bg-brand text-brand-charcoal text-[9px] font-extrabold uppercase tracking-widest font-mono shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
                  >
                    {isSavingEdit ? "Submitting..." : "💾 Save & Resubmit Video"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveEdit(false)}
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-xl bg-brand text-brand-charcoal text-[9px] font-extrabold uppercase tracking-widest font-mono shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
                  >
                    {isSavingEdit ? "Saving..." : "💾 Save Changes"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold uppercase tracking-wider font-mono z-50 ${
              toast.type === "error"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </LecturerLayout>
  );
}
