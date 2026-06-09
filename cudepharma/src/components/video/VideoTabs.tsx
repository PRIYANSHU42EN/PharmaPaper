"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date-utils";

interface VideoTabsProps {
  videoId: string;
  notesMarkdown: string;
  subject: string;
  course: string;
  semester: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export default function VideoTabs({
  videoId,
  notesMarkdown,
  subject,
  course,
  semester,
  currentTime,
  onSeek,
}: VideoTabsProps) {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState<"notes" | "discussion" | "pyqs" | "mynotes">("notes");

  // Discussion state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState("");

  // PYQs state
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [pyqsLoading, setPyqsLoading] = useState(false);

  // Personal Notes state
  const [personalNotes, setPersonalNotes] = useState<any[]>([]);
  const [personalNotesLoading, setPersonalNotesLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteError, setNoteError] = useState("");

  // Load data depending on activeTab
  useEffect(() => {
    if (activeTab === "discussion") {
      fetchComments(1);
    } else if (activeTab === "pyqs") {
      fetchPYQs();
    } else if (activeTab === "mynotes" && isSignedIn) {
      fetchPersonalNotes();
    }
  }, [activeTab, videoId, isSignedIn]);

  // --- DISCUSSION ACTIONS ---
  const fetchComments = async (page = 1) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/videos/comments/${videoId}?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setComments(data.comments || []);
        } else {
          setComments((prev) => [...prev, ...(data.comments || [])]);
        }
        setCommentsCount(data.totalCount || 0);
        setCommentsHasMore(data.hasMore || false);
        setCommentsPage(page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async (parentId: string | null = null) => {
    const text = parentId ? replyTextMap[parentId] : commentText;
    if (!text || !text.trim()) return;

    setCommentError("");
    try {
      const res = await fetch("/api/videos/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          content: text.trim(),
          parentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error || "Failed to post comment.");
        return;
      }

      if (data.moderated) {
        alert("Your comment contains restricted words and is pending approval.");
      } else {
        // Optimistic insert or refresh
        if (parentId) {
          // Add to parent replies
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), data.comment],
                };
              }
              return c;
            })
          );
          setReplyTextMap((prev) => ({ ...prev, [parentId]: "" }));
          setActiveReplyId(null);
        } else {
          setComments((prev) => [data.comment, ...prev]);
          setCommentText("");
          setCommentsCount((prev) => prev + 1);
        }
      }
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment.");
    }
  };

  // --- RELATED PYQS ---
  const fetchPYQs = async () => {
    setPyqsLoading(true);
    try {
      const res = await fetch(`/api/videos/pyqs?subject=${encodeURIComponent(subject)}&course=${encodeURIComponent(course)}`);
      if (res.ok) {
        const data = await res.json();
        setPyqs(data.pyqs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPyqsLoading(false);
    }
  };

  // --- PERSONAL NOTES ---
  const fetchPersonalNotes = async () => {
    setPersonalNotesLoading(true);
    try {
      const res = await fetch(`/api/videos/notes/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setPersonalNotes(data.notes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPersonalNotesLoading(false);
    }
  };

  const handleAddPersonalNote = async () => {
    if (!newNoteText.trim()) return;
    setNoteError("");

    try {
      const res = await fetch("/api/videos/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          timestampSeconds: currentTime,
          noteText: newNoteText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNoteError(data.error || "Failed to save note.");
        return;
      }

      setPersonalNotes((prev) =>
        [...prev, data.note].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
      );
      setNewNoteText("");
    } catch (err: any) {
      setNoteError(err.message || "Failed to save note.");
    }
  };

  const handleDeletePersonalNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/videos/notes/${videoId}?id=${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPersonalNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- MARKDOWN RENDERER ---
  const renderLectureMarkdown = (md: string) => {
    if (!md) return <p className="text-xs text-brand-cream/40 italic">No lecture notes available.</p>;

    const lines = md.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h2 key={idx} className="font-bebas text-3xl text-brand-cream tracking-wider uppercase mt-5 mb-2.5 border-b border-white/5 pb-1">
            {line.replace("# ", "")}
          </h2>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-bold text-sm text-brand mt-4 mb-2">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-semibold text-xs text-brand-cream/95 mt-3 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      // Bullets
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const text = line.substring(2);
        return (
          <li key={idx} className="text-xs text-brand-cream/80 leading-relaxed list-disc ml-5 mb-1.5">
            {parseBoldText(text)}
          </li>
        );
      }
      // Standard lines
      if (line.trim() === "") {
        return <div key={idx} className="h-2.5" />;
      }
      return (
        <p key={idx} className="text-xs text-brand-cream/75 leading-relaxed mb-2">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-brand font-bold">{part}</strong>;
      }
      return part;
    });
  };

  const formatNoteTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs Header */}
      <div className="flex border-b border-[#0582CA]/15 bg-white/5 p-1 rounded-xl gap-1">
        {[
          { id: "notes", label: "📚 Notes" },
          { id: "discussion", label: `💬 Discussion (${commentsCount})` },
          { id: "pyqs", label: "📝 Related PYQs" },
          { id: "mynotes", label: "✏️ My Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#0582CA]/15 text-brand shadow-sm border border-[#0582CA]/25"
                : "text-brand-cream/60 hover:text-brand-cream hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panel Content */}
      <div className="min-h-[350px] p-5 rounded-2xl glass-panel border-[#0582CA]/15 bg-[#07080f]/40">
        {/* TAB 1: Lecture Notes */}
        {activeTab === "notes" && (
          <article className="prose prose-invert max-w-none">
            {renderLectureMarkdown(notesMarkdown)}
          </article>
        )}

        {/* TAB 2: Discussion */}
        {activeTab === "discussion" && (
          <div className="flex flex-col gap-5">
            {/* Comment Form */}
            {isSignedIn ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask a question or share a study tip..."
                  maxLength={500}
                  className="w-full min-h-[80px] p-3 rounded-xl bg-black/40 border border-[#0582CA]/20 text-brand-cream text-xs focus:outline-none focus:border-brand/50 placeholder-brand-cream/30 resize-none font-sans"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-cream/30 font-mono">
                    {commentText.length}/500 chars
                  </span>
                  <button
                    onClick={() => handlePostComment(null)}
                    disabled={!commentText.trim()}
                    className="px-5 py-2 rounded-full bg-brand text-[#07080f] font-bold text-[10px] uppercase tracking-wider hover:bg-brand-light transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Post Comment
                  </button>
                </div>
                {commentError && (
                  <p className="text-[10px] text-red-400 font-mono mt-1">{commentError}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-xs text-brand-cream/50">
                  Please log in to join the lecture discussion.
                </p>
              </div>
            )}

            {/* Comments List */}
            {commentsLoading && comments.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-cream/40 font-mono">
                Loading discussion...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-cream/40 italic">
                No questions asked yet. Be the first to start the discussion!
              </div>
            ) : (
              <div className="space-y-5">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start border-l-2 border-[#0582CA]/10 pl-3">
                    {/* User profile picture */}
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[#0582CA]/20 bg-black flex-shrink-0">
                      <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {/* Name & Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-brand-cream flex items-center gap-1.5">
                          {comment.user_name}
                          {comment.isLecturer && (
                            <span className="px-1.5 py-0.5 rounded bg-brand/10 text-brand text-[8px] uppercase tracking-wide border border-brand/20 font-mono font-bold">
                              Lecturer
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-brand-cream/40 font-mono">
                          {formatDistanceToNow(new Date(comment.created_at))} ago
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-xs text-brand-cream/80 leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </p>

                      {/* Actions (Reply toggle) */}
                      {isSignedIn && (
                        <div className="flex items-center gap-4 mt-1">
                          <button
                            onClick={() =>
                              setActiveReplyId(activeReplyId === comment.id ? null : comment.id)
                            }
                            className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-cream/40 hover:text-brand transition-colors cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-4 border-l border-white/5">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="flex gap-2 items-start">
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-[#0582CA]/10 bg-black flex-shrink-0">
                                <img src={reply.user_avatar} alt={reply.user_name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-brand-cream flex items-center gap-1">
                                    {reply.user_name}
                                    {reply.isLecturer && (
                                      <span className="px-1 py-0.2 rounded bg-brand/10 text-brand text-[7px] uppercase tracking-wide border border-brand/20 font-mono font-bold">
                                        Lecturer
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[8px] text-brand-cream/35 font-mono">
                                    {formatDistanceToNow(new Date(reply.created_at))} ago
                                  </span>
                                </div>
                                <p className="text-[11px] text-brand-cream/70 leading-relaxed whitespace-pre-line">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input Box */}
                      {activeReplyId === comment.id && (
                        <div className="mt-3 flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                          <textarea
                            value={replyTextMap[comment.id] || ""}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [comment.id]: e.target.value }))
                            }
                            placeholder="Write a reply..."
                            maxLength={500}
                            className="w-full min-h-[60px] p-2 bg-black/40 border border-[#0582CA]/10 rounded-lg text-xs text-brand-cream focus:outline-none focus:border-brand/40 resize-none font-sans"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveReplyId(null)}
                              className="px-3 py-1 rounded-full border border-white/10 text-brand-cream/50 hover:text-brand-cream text-[9px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handlePostComment(comment.id)}
                              disabled={!(replyTextMap[comment.id] || "").trim()}
                              className="px-4 py-1 rounded-full bg-brand text-[#07080f] font-bold text-[9px] uppercase tracking-wider hover:bg-brand-light transition-all disabled:opacity-50 cursor-pointer"
                            >
                              Post Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {commentsHasMore && (
                  <button
                    onClick={() => fetchComments(commentsPage + 1)}
                    disabled={commentsLoading}
                    className="w-full py-2.5 rounded-xl border border-[#0582CA]/20 text-brand hover:bg-[#0582CA]/5 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {commentsLoading ? "Loading..." : "Load More comments"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Related PYQs */}
        {activeTab === "pyqs" && (
          <div className="flex flex-col gap-5">
            {pyqsLoading ? (
              <div className="text-center py-8 text-xs text-brand-cream/40 font-mono">
                Loading study resources...
              </div>
            ) : pyqs.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-cream/40 italic">
                No past year question papers added for this subject yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pyqs.map((pyq) => {
                  // Extract year from title or use creation year
                  const match = pyq.title.match(/\b(20\d{2})\b/);
                  const year = match ? match[0] : new Date(pyq.created_at).getFullYear();

                  return (
                    <div
                      key={pyq.id}
                      className="p-4 rounded-xl border border-[#0582CA]/15 bg-black/30 hover:border-brand/40 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-brand uppercase tracking-wider">
                           Year: {year}
                        </span>
                        <h4 className="text-xs font-semibold text-brand-cream line-clamp-2">
                          {pyq.title}
                        </h4>
                      </div>
                      <a
                        href={pyq.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="self-start px-3 py-1.5 rounded-lg bg-[#0582CA]/10 hover:bg-[#0582CA]/25 text-[10px] uppercase font-mono font-bold tracking-wider text-brand-cream border border-[#0582CA]/10 transition-colors"
                      >
                        📄 Download PDF
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Practice Questions CTA Button */}
            <div className="h-px bg-white/5 my-2" />
            <div className="flex flex-col items-center gap-3 py-3 text-center">
              <p className="text-xs text-brand-cream/60 max-w-xs leading-normal">
                Want to test your knowledge on this chapter? Practice interactive MCQ question banks!
              </p>
              <Link
                href={`/quiz?subject=${encodeURIComponent(subject)}`}
                className="px-6 py-2.5 rounded-full bg-brand hover:bg-brand-light text-[#07080f] font-bold text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02]"
              >
                📝 Practice Questions Quiz
              </Link>
            </div>
          </div>
        )}

        {/* TAB 4: My Notes */}
        {activeTab === "mynotes" && (
          <div className="flex flex-col gap-5">
            {!isSignedIn ? (
              <div className="text-center py-6 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-xs text-brand-cream/50">
                  Please sign in to take personal timestamps notes.
                </p>
              </div>
            ) : (
              <>
                {/* Note creation input */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-brand uppercase tracking-widest">
                      Take note at <span className="font-bold text-white bg-brand/20 px-2 py-0.5 rounded">{formatNoteTime(currentTime)}</span>
                    </span>
                    <span className="text-[9px] text-brand-cream/35 font-mono">
                      {personalNotes.length}/100 notes
                    </span>
                  </div>
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Type personal reference, formula, or timestamp bookmark here..."
                    className="w-full min-h-[60px] p-2 bg-black/40 border border-[#0582CA]/10 rounded-lg text-xs text-brand-cream focus:outline-none focus:border-brand/40 resize-none font-sans"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddPersonalNote}
                      disabled={!newNoteText.trim() || personalNotes.length >= 100}
                      className="px-5 py-2 rounded-full bg-brand text-[#07080f] font-bold text-[10px] uppercase tracking-wider hover:bg-brand-light transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Save Timestamp Note
                    </button>
                  </div>
                  {noteError && (
                    <p className="text-[10px] text-red-400 font-mono mt-1">{noteError}</p>
                  )}
                </div>

                {/* Personal Notes List */}
                {personalNotesLoading ? (
                  <div className="text-center py-4 text-xs text-brand-cream/40 font-mono">
                    Loading your notes...
                  </div>
                ) : personalNotes.length === 0 ? (
                  <div className="text-center py-8 text-xs text-brand-cream/40 italic">
                    No notes saved yet. Add a note to bookmark key topics!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl border border-[#0582CA]/10 bg-black/20 hover:border-[#0582CA]/25 transition-all flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          {/* Timestamp Link */}
                          <button
                            onClick={() => onSeek(note.timestamp_seconds)}
                            className="self-start text-[10px] font-mono font-bold text-brand hover:text-brand-light hover:underline bg-brand/10 border border-brand/20 px-2 py-0.5 rounded cursor-pointer"
                          >
                            ⏱ Seek to {formatNoteTime(note.timestamp_seconds)}
                          </button>
                          <p className="text-xs text-brand-cream/80 leading-relaxed font-sans mt-1">
                            {note.note_text}
                          </p>
                        </div>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeletePersonalNote(note.id)}
                          className="text-brand-cream/25 hover:text-red-400 p-1 transition-colors text-xs font-mono font-bold cursor-pointer"
                          title="Delete note"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
