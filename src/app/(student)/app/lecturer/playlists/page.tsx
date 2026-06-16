"use client";

import React, { useState, useEffect } from "react";
import LecturerLayout from "@/components/lecturer/LecturerLayout";
import { fetchSyllabusData, SyllabusData } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

interface PlaylistVideo {
  id: string;
  title: string;
  youtube_id: string;
  is_premium: boolean;
  playlist_order: number;
}

interface Playlist {
  id: string;
  title: string;
  description: string;
  course: string;
  semester: number;
  subject: string;
  thumbnail_url?: string;
  is_published: boolean;
  videos: PlaylistVideo[];
}

interface UnassignedVideo {
  id: string;
  title: string;
  subject: string;
}

export default function LecturerPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [unassignedVideos, setUnassignedVideos] = useState<UnassignedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Selected playlist for detailed video management
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Creation form states
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCourse, setNewCourse] = useState<"bpharm" | "dpharm">("bpharm");
  const [newSemester, setNewSemester] = useState("1");
  const [newSubject, setNewSubject] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [newIsPublished, setNewIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Video addition modal states
  const [isAddingVideos, setIsAddingVideos] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [savingAdd, setSavingAdd] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const res = await fetch("/api/lecturer/playlists");
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.playlists || []);
        // Update selected playlist references if open
        if (selectedPlaylist) {
          const fresh = (data.playlists || []).find((p: Playlist) => p.id === selectedPlaylist.id);
          if (fresh) setSelectedPlaylist(fresh);
        }
      }

      // Fetch all lecturer videos to find unassigned ones
      const vRes = await fetch("/api/lecturer/videos");
      const vData = await vRes.json();
      if (vData.success) {
        const list: UnassignedVideo[] = (vData.videos || [])
          .filter((v: any) => v.status === "approved" || v.status === "published")
          .map((v: any) => ({ id: v.id, title: v.title, subject: v.subject }));
        setUnassignedVideos(list);
      }
    } catch (err) {
      console.error("Load playlists error:", err);
      showToast("Error loading playlists", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    fetchSyllabusData().then((data) => {
      setSyllabus(data);
      const firstSub = data["bpharm"]?.[0]?.subjects?.[0] || "";
      setNewSubject(firstSub);
    });
  }, []);

  // Update subject drop list in creation form
  useEffect(() => {
    if (!syllabus) return;
    const list = syllabus[newCourse] || [];
    const currentSem = list.find((s) => s.id === (newCourse === "dpharm" ? `year${newSemester}` : `sem${newSemester}`));
    if (currentSem && currentSem.subjects.length > 0) {
      setNewSubject(currentSem.subjects[0]);
    } else {
      setNewSubject("");
    }
  }, [newCourse, newSemester, syllabus]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Playlist title is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          course: newCourse,
          semester: newSemester,
          subject: newSubject,
          thumbnailUrl: newThumbnail.trim(),
          isPublished: newIsPublished,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Playlist created successfully!");
        setIsCreating(false);
        setNewTitle("");
        setNewDescription("");
        setNewThumbnail("");
        setNewIsPublished(false);
        loadData();
      } else {
        showToast(data.error || "Failed to create playlist", "error");
      }
    } catch (err) {
      console.error("Create playlist error:", err);
      showToast("Error creating playlist", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlaylist = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? Videos inside will not be deleted but will become unassigned.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/lecturer/playlists?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Playlist deleted successfully");
        if (selectedPlaylist?.id === id) {
          setSelectedPlaylist(null);
        }
        loadData();
      } else {
        showToast(data.error || "Failed to delete playlist", "error");
      }
    } catch (err) {
      console.error("Delete playlist error:", err);
      showToast("Error deleting playlist", "error");
    }
  };

  const handleToggleVisibility = async (playlist: Playlist) => {
    const nextStatus = !playlist.is_published;
    try {
      const res = await fetch("/api/lecturer/playlists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: playlist.id,
          isPublished: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(nextStatus ? "Playlist published!" : "Playlist hidden (unpublished)");
        loadData();
      } else {
        showToast(data.error || "Failed to toggle status", "error");
      }
    } catch (err) {
      console.error("Toggle visibility error:", err);
      showToast("Error updating visibility", "error");
    }
  };

  // Move video up/down locally, then save
  const handleMoveVideo = async (index: number, direction: "up" | "down") => {
    if (!selectedPlaylist) return;
    const items = [...selectedPlaylist.videos];
    if (direction === "up" && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === "down" && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    } else {
      return; // No-op
    }

    // Instantly update local UI state
    setSelectedPlaylist({
      ...selectedPlaylist,
      videos: items,
    });

    // Sync order to API
    try {
      await fetch("/api/lecturer/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          playlistId: selectedPlaylist.id,
          videoIds: items.map((it) => it.id),
        }),
      });
    } catch (err) {
      console.error("Failed to sync video reorder:", err);
      showToast("Failed to save new video sequence", "error");
    }
  };

  const handleOpenAddVideos = () => {
    setSelectedVideoIds([]);
    setIsAddingVideos(true);
  };

  const handleSaveAddVideos = async () => {
    if (!selectedPlaylist || selectedVideoIds.length === 0) return;
    setSavingAdd(true);
    try {
      const res = await fetch("/api/lecturer/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-videos",
          playlistId: selectedPlaylist.id,
          videoIds: selectedVideoIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Videos added to playlist");
        setIsAddingVideos(false);
        loadData();
      } else {
        showToast(data.error || "Failed to add videos", "error");
      }
    } catch (err) {
      console.error("Add videos error:", err);
      showToast("Error linking videos to playlist", "error");
    } finally {
      setSavingAdd(false);
    }
  };

  const currentSemesters = newCourse === "dpharm" ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8];
  const activeSyllabusList = syllabus ? syllabus[newCourse] || [] : [];
  const activeSemName = newCourse === "dpharm" ? `year${newSemester}` : `sem${newSemester}`;
  const subjectsAvailable = activeSyllabusList.find((s) => s.id === activeSemName)?.subjects || [];

  return (
    <LecturerLayout>
      <div className="flex flex-col gap-8 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bebas text-3xl tracking-wide uppercase text-brand-cream">
              Manage <span className="text-brand">Playlists</span>
            </h1>
            <p className="text-xs text-brand-cream/60 uppercase tracking-wider font-mono mt-1">
              Create video collections, toggle lecture series access, and order sequence lists
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-brand text-brand-charcoal text-[10px] uppercase font-mono tracking-widest font-extrabold shadow-lg hover:bg-brand/90 transition-all"
          >
            ➕ Create Playlist
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 text-xs font-mono uppercase text-brand-cream/50 tracking-wider">
            Loading Playlists...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Playlists listing */}
            <div className={`${selectedPlaylist ? "lg:col-span-6" : "lg:col-span-12"} flex flex-col gap-4`}>
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
                Your Playlists ({playlists.length})
              </h2>

              {playlists.length === 0 ? (
                <div className="glass-panel border-brand-border/40 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <p className="text-xs font-bold text-white font-mono uppercase">No Playlists Created Yet</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-[9px] font-bold text-brand uppercase tracking-widest hover:underline"
                  >
                    Click here to build your first playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  {playlists.map((playlist) => {
                    const isSelected = selectedPlaylist?.id === playlist.id;
                    return (
                      <div
                        key={playlist.id}
                        onClick={() => setSelectedPlaylist(playlist)}
                        className={`p-5 glass-panel rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between gap-4 ${
                          isSelected
                            ? "border-brand bg-brand-gray/25 shadow-lg"
                            : "border-brand-border/40 hover:border-brand-border/80 hover:bg-brand-gray/10"
                        }`}
                      >
                        <div className="flex gap-4 min-w-0">
                          <div className="w-20 h-20 rounded-xl border border-brand-border/40 overflow-hidden shrink-0 bg-brand-charcoal flex items-center justify-center relative">
                            {playlist.thumbnail_url ? (
                              <img src={playlist.thumbnail_url} alt={playlist.title} className="w-full h-full object-cover" />
                            ) : playlist.videos[0] ? (
                              <img
                                src={`https://img.youtube.com/vi/${playlist.videos[0].youtube_id}/mqdefault.jpg`}
                                alt={playlist.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">📁</span>
                            )}
                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1 rounded text-[7px] font-mono text-white">
                              {playlist.videos.length} Videos
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-white font-mono truncate">{playlist.title}</span>
                            <span className="text-[8px] text-brand uppercase tracking-wider font-bold">
                              {playlist.course} - Sem {playlist.semester} ({playlist.subject})
                            </span>
                            <span className="text-[9px] text-brand-cream/60 line-clamp-2 leading-relaxed">
                              {playlist.description || "No description provided."}
                            </span>
                          </div>
                        </div>

                        <div className="flex md:flex-col justify-end items-end gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(playlist);
                            }}
                            className={`px-3 py-1 rounded text-[7px] font-bold uppercase tracking-widest font-mono border transition-colors ${
                              playlist.is_published
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-brand-gray/10 border-brand-border/40 text-brand-cream/60 hover:bg-brand-gray/20"
                            }`}
                          >
                            {playlist.is_published ? "🟢 Public" : "⚪ Private"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlaylist(playlist.id, playlist.title);
                            }}
                            className="px-3 py-1 rounded text-[7px] font-bold uppercase tracking-widest font-mono border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected playlist detailed view */}
            {selectedPlaylist && (
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-brand-border/20 pb-2">
                  <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-brand">
                    Playlist Contents: {selectedPlaylist.title}
                  </h2>
                  <button
                    onClick={handleOpenAddVideos}
                    className="px-3 py-1.5 rounded-lg border border-brand/40 text-[8px] font-bold uppercase tracking-widest font-mono text-brand hover:bg-brand/10 transition-all"
                  >
                    🔗 Add Videos
                  </button>
                </div>

                {selectedPlaylist.videos.length === 0 ? (
                  <div className="glass-panel border-brand-border/40 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                    <span className="text-xl">📹</span>
                    <p className="text-[10px] font-mono uppercase text-brand-cream/60">No lectures grouped in this series yet</p>
                    <button
                      onClick={handleOpenAddVideos}
                      className="text-[8px] font-extrabold text-brand uppercase tracking-widest hover:underline"
                    >
                      Click here to add videos
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedPlaylist.videos.map((video, idx) => (
                      <div
                        key={video.id}
                        className="p-3 bg-brand-charcoal/40 border border-brand-border/20 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[9px] font-mono text-brand-cream/40 font-bold w-4">
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>
                          <img
                            src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-12 aspect-video rounded object-cover border border-brand-border/20 shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold font-mono text-white truncate">{video.title}</span>
                            <span className="text-[7px] text-brand-cream/40 font-mono uppercase tracking-wider mt-0.5">
                              ID: {video.youtube_id}
                            </span>
                          </div>
                        </div>

                        {/* Order action triggers */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveVideo(idx, "up")}
                            disabled={idx === 0}
                            className="w-6 h-6 rounded bg-brand-charcoal border border-brand-border/40 flex items-center justify-center text-[10px] hover:border-brand disabled:opacity-25"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveVideo(idx, "down")}
                            disabled={idx === selectedPlaylist.videos.length - 1}
                            className="w-6 h-6 rounded bg-brand-charcoal border border-brand-border/40 flex items-center justify-center text-[10px] hover:border-brand disabled:opacity-25"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Playlist Overlay Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 bg-brand-charcoal/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel border-brand-border/40 rounded-2xl overflow-hidden shadow-2xl"
            >
              <form onSubmit={handleCreatePlaylist}>
                <div className="border-b border-brand-border/20 px-6 py-4 flex justify-between items-center bg-brand-charcoal/20">
                  <span className="text-xs font-mono text-brand uppercase font-extrabold">Build Playlist Series</span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-brand-cream/50 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                      placeholder="e.g. Pharmaceutical Organic Chemistry II"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Description</label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white resize-none"
                      placeholder="Brief course playlist syllabus description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Course</label>
                      <select
                        value={newCourse}
                        onChange={(e) => setNewCourse(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/90 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                      >
                        <option value="bpharm">B.Pharm</option>
                        <option value="dpharm">D.Pharm</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">
                        {newCourse === "dpharm" ? "Academic Year" : "Semester"}
                      </label>
                      <select
                        value={newSemester}
                        onChange={(e) => setNewSemester(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/90 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                      >
                        {currentSemesters.map((num) => (
                          <option key={num} value={num}>
                            {newCourse === "dpharm" ? `Year ${num}` : `Sem ${num}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Syllabus Subject</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/90 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    >
                      {subjectsAvailable.map((sub, i) => (
                        <option key={i} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Playlist Thumbnail URL</label>
                    <input
                      type="text"
                      value={newThumbnail}
                      onChange={(e) => setNewThumbnail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                      placeholder="https://example.com/playlist.jpg"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-brand-charcoal/20 border border-brand-border/20 rounded-xl">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold font-mono text-white">Publish Playlist</span>
                      <span className="text-[7px] text-brand-cream/40 uppercase tracking-widest font-mono">
                        Make visible in students' notes portal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewIsPublished(!newIsPublished)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        newIsPublished ? "bg-brand" : "bg-brand-gray"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          newIsPublished ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="border-t border-brand-border/20 px-6 py-4 flex gap-3 justify-end bg-brand-charcoal/20">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-xl border border-brand-border/40 hover:bg-brand-gray/30 text-[9px] font-bold uppercase tracking-widest font-mono text-brand-cream transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-brand text-brand-charcoal text-[9px] font-extrabold uppercase tracking-widest font-mono shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Build Playlist"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Videos to Playlist Modal */}
      <AnimatePresence>
        {isAddingVideos && selectedPlaylist && (
          <div className="fixed inset-0 bg-brand-charcoal/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel border-brand-border/40 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="border-b border-brand-border/20 px-6 py-4 flex justify-between items-center bg-brand-charcoal/20">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-brand uppercase font-extrabold">Link Approved Videos</span>
                  <span className="text-[8px] font-mono text-brand-cream/40 uppercase tracking-widest mt-0.5">
                    Filter by Subject: {selectedPlaylist.subject}
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingVideos(false)}
                  className="text-brand-cream/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 max-h-[50vh] overflow-y-auto flex flex-col gap-3">
                {unassignedVideos.filter((v) => v.subject === selectedPlaylist.subject).length === 0 ? (
                  <div className="text-center py-6 text-[10px] font-mono uppercase text-brand-cream/40">
                    No approved unassigned videos for this subject.
                  </div>
                ) : (
                  unassignedVideos
                    .filter((v) => v.subject === selectedPlaylist.subject)
                    .map((video) => {
                      const isSelected = selectedVideoIds.includes(video.id);
                      return (
                        <div
                          key={video.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedVideoIds(selectedVideoIds.filter((id) => id !== video.id));
                            } else {
                              setSelectedVideoIds([...selectedVideoIds, video.id]);
                            }
                          }}
                          className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand bg-brand-gray/15"
                              : "border-brand-border/30 hover:border-brand-border/80"
                          }`}
                        >
                          <span className="text-[10px] font-bold font-mono text-white truncate max-w-[280px]">
                            {video.title}
                          </span>
                          <span className="text-[16px]">{isSelected ? "✅" : "➕"}</span>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="border-t border-brand-border/20 px-6 py-4 flex gap-3 justify-end bg-brand-charcoal/20">
                <button
                  onClick={() => setIsAddingVideos(false)}
                  className="px-4 py-2 rounded-xl border border-brand-border/40 hover:bg-brand-gray/30 text-[9px] font-bold uppercase tracking-widest font-mono text-brand-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddVideos}
                  disabled={savingAdd || selectedVideoIds.length === 0}
                  className="px-4 py-2 rounded-xl bg-brand text-brand-charcoal text-[9px] font-extrabold uppercase tracking-widest font-mono shadow-md hover:bg-brand/90 transition-all disabled:opacity-50"
                >
                  {savingAdd ? "Linking..." : "Link Selected Videos"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification Container */}
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
