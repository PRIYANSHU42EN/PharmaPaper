"use client";

import React, { useState, useEffect } from "react";
import LecturerLayout from "@/components/lecturer/LecturerLayout";
import { fetchSyllabusData, SyllabusData } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

export default function LecturerUploadPage() {
  const [loadingSyllabus, setLoadingSyllabus] = useState(true);
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState<"bpharm" | "dpharm">("bpharm");
  const [semester, setSemester] = useState("1");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("1");
  const [tags, setTags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [freePreviewDuration, setFreePreviewDuration] = useState(120);

  // Video source tabs
  const [videoSource, setVideoSource] = useState<"youtube" | "mux">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState("");

  // Mock upload progress states (for direct Mux tab)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch courses, semesters, and subjects dynamically
  useEffect(() => {
    fetchSyllabusData()
      .then((data) => {
        setSyllabus(data);
        // Default select first subject
        const list = data[course] || [];
        const currentSem = list.find((s) => s.id === (course === "dpharm" ? `year${semester}` : `sem${semester}`));
        if (currentSem && currentSem.subjects.length > 0) {
          setSubject(currentSem.subjects[0]);
        }
      })
      .catch((err) => {
        console.error("Error loading syllabus data:", err);
        showToast("Error retrieving course subjects list", "error");
      })
      .finally(() => setLoadingSyllabus(false));
  }, []);

  // Update subject list when course or semester changes
  useEffect(() => {
    if (!syllabus) return;
    const list = syllabus[course] || [];
    const currentSem = list.find((s) => s.id === (course === "dpharm" ? `year${semester}` : `sem${semester}`));
    if (currentSem && currentSem.subjects.length > 0) {
      setSubject(currentSem.subjects[0]);
    } else {
      setSubject("");
    }
  }, [course, semester, syllabus]);

  // Extract YouTube ID dynamically
  useEffect(() => {
    if (youtubeUrl) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = youtubeUrl.match(regExp);
      if (match && match[2].length === 11) {
        setYoutubeId(match[2]);
        // Auto-generate thumbnail preview
        setThumbnailUrl(`https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`);
      } else {
        const clean = youtubeUrl.trim();
        if (clean.length === 11) {
          setYoutubeId(clean);
          setThumbnailUrl(`https://img.youtube.com/vi/${clean}/mqdefault.jpg`);
        } else {
          setYoutubeId("");
        }
      }
    } else {
      setYoutubeId("");
    }
  }, [youtubeUrl]);

  // Handler for mock direct upload progress (Tab 2)
  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    // Mock incremental progress upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Set mock thumbnail
          setThumbnailUrl("https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80");
          showToast("Lecture file processed successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.length > 100) {
      showToast("Please enter a valid title (max 100 characters)", "error");
      return;
    }
    if (!subject) {
      showToast("Please select a subject from the list", "error");
      return;
    }
    if (videoSource === "youtube" && !youtubeId) {
      showToast("Please provide a valid YouTube video URL or ID", "error");
      return;
    }
    if (videoSource === "mux" && !uploadFile && uploadProgress < 100) {
      showToast("Please drag & drop or select a lecture video to upload", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/lecturer/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          course,
          semester,
          subject,
          unit,
          tags,
          thumbnailUrl,
          isPremium,
          freePreviewDuration,
          videoSource,
          youtubeUrl: videoSource === "youtube" ? youtubeUrl : "",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Video submitted for review! Usually approved within 24 hours.");
        // Reset form
        setTitle("");
        setDescription("");
        setYoutubeUrl("");
        setUploadFile(null);
        setUploadProgress(0);
        setTags("");
        setIsPremium(false);
      } else {
        showToast(data.error || "Failed to submit lecture video", "error");
      }
    } catch (err) {
      console.error("Video upload submission error:", err);
      showToast("Network exception during upload submission", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSemesters = course === "dpharm" ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8];
  const list = syllabus ? syllabus[course] || [] : [];
  const activeSemId = course === "dpharm" ? `year${semester}` : `sem${semester}`;
  const subjectsAvailable = list.find((s) => s.id === activeSemId)?.subjects || [];

  return (
    <LecturerLayout>
      <div className="max-w-5xl flex flex-col gap-8 pb-12">
        <div>
          <h1 className="font-bebas text-3xl tracking-wide uppercase text-brand-cream">
            Upload <span className="text-brand">New Lecture</span>
          </h1>
          <p className="text-xs text-brand-cream/60 uppercase tracking-wider font-mono mt-1">
            Submit a lecture video, notes summary, and metadata settings for admin review
          </p>
        </div>

        {loadingSyllabus ? (
          <div className="flex justify-center items-center h-48 text-xs font-mono uppercase text-brand-cream/50 tracking-wider">
            Loading Course Curriculums...
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Video and Source */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Video source tabs */}
              <div className="glass-panel border-brand-border/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="flex border-b border-brand-border/20 bg-brand-charcoal/20">
                  <button
                    type="button"
                    onClick={() => setVideoSource("youtube")}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      videoSource === "youtube"
                        ? "bg-brand text-brand-charcoal font-extrabold"
                        : "text-brand-cream/60 hover:text-brand-cream hover:bg-brand-gray/15"
                    }`}
                  >
                    YouTube Unlisted Embed
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSource("mux")}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      videoSource === "mux"
                        ? "bg-brand text-brand-charcoal font-extrabold"
                        : "text-brand-cream/60 hover:text-brand-cream hover:bg-brand-gray/15"
                    }`}
                  >
                    Direct Upload (Beta Mux)
                  </button>
                </div>

                <div className="p-6">
                  {videoSource === "youtube" ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">
                          Unlisted YouTube Video URL / ID
                        </label>
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        />
                      </div>

                      {/* YouTube Preview */}
                      {youtubeId ? (
                        <div className="mt-2 flex flex-col items-center gap-2 p-4 bg-brand-charcoal/40 border border-brand-border/20 rounded-xl">
                          <img
                            src={thumbnailUrl}
                            alt="YouTube Thumbnail Preview"
                            className="w-full max-w-[320px] aspect-video object-cover rounded-lg border border-brand-border/40 shadow-md"
                          />
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                            ✓ YouTube ID Extracted: {youtubeId}
                          </span>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center border border-dashed border-brand-border/20 rounded-xl bg-brand-charcoal/10">
                          <span className="text-[9px] text-brand-cream/30 uppercase tracking-widest font-mono">
                            Paste YouTube URL to render thumbnail preview
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="border border-dashed border-brand-border/40 hover:border-brand/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-brand-charcoal/10 transition-colors relative">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileDrop}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                        <span className="text-3xl">📤</span>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white font-mono">
                            {uploadFile ? uploadFile.name : "Drag and drop your lecture file here"}
                          </p>
                          <p className="text-[9px] text-brand-cream/40 uppercase tracking-wider mt-1">
                            Supports MP4, MOV, WEBM (Max 1GB)
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {(isUploading || uploadProgress > 0) && (
                        <div className="p-4 bg-brand-charcoal/40 border border-brand-border/20 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[9px] font-mono uppercase font-bold">
                            <span className="text-brand-cream/60">Processing File</span>
                            <span className="text-brand">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-brand-charcoal rounded-full overflow-hidden">
                            <div className="h-full bg-brand transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title and notes summary */}
              <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
                  Lecture Summaries
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Lecture Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    placeholder="e.g. Introduction to Heterocyclic Nomenclature"
                  />
                  <div className="flex justify-end text-[8px] font-mono text-brand-cream/35">
                    {title.length}/100
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Description / Study Summary</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    rows={6}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white resize-none"
                    placeholder="Write a detailed synopsis, lecture syllabus topics, notes index, or review references..."
                  />
                  <div className="flex justify-end text-[8px] font-mono text-brand-cream/35">
                    {description.length}/2000
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Taxonomy and gating */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Course details */}
              <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
                  Syllabus Mapping
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Course Program</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/90 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                  >
                    <option value="bpharm">B.Pharm (Bachelor of Pharmacy)</option>
                    <option value="dpharm">D.Pharm (Diploma in Pharmacy)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">
                      {course === "dpharm" ? "Academic Year" : "Semester"}
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/90 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    >
                      {currentSemesters.map((num) => (
                        <option key={num} value={num}>
                          {course === "dpharm" ? `Year ${num}` : `Semester ${num}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Syllabus Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/90 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    >
                      <option value="1">Unit I</option>
                      <option value="2">Unit II</option>
                      <option value="3">Unit III</option>
                      <option value="4">Unit IV</option>
                      <option value="5">Unit V</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Syllabus Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Keywords / Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    placeholder="e.g. heterocycles, organic, BP401T"
                  />
                </div>
              </div>

              {/* Gating properties */}
              <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4 shadow-xl">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
                  Access & Gating
                </h3>

                <div className="flex items-center justify-between p-3 bg-brand-charcoal/20 border border-brand-border/20 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold font-mono text-white">Premium Lecture Pass</span>
                    <span className="text-[8px] text-brand-cream/40 uppercase tracking-widest font-mono">
                      Require active subscriptive plan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPremium(!isPremium)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPremium ? "bg-brand" : "bg-brand-gray"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isPremium ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {isPremium && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col gap-2 border-t border-brand-border/20 pt-3 mt-1"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono uppercase font-bold text-brand-cream/60">
                      <span>Free Preview Duration</span>
                      <span className="text-brand">{freePreviewDuration} Seconds</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={300}
                      step={10}
                      value={freePreviewDuration}
                      onChange={(e) => setFreePreviewDuration(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-brand-charcoal rounded-lg appearance-none cursor-pointer accent-brand"
                    />
                  </motion.div>
                )}
              </div>

              {/* Submit trigger */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-brand hover:bg-brand/90 text-brand-charcoal font-extrabold tracking-widest uppercase transition-all duration-300 text-xs shadow-xl disabled:opacity-50"
              >
                {submitting ? "Uploading Credentials..." : "Submit Video for Review"}
              </button>
            </div>
          </form>
        )}
      </div>

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
