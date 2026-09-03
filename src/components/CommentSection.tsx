"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { submitComment, type Comment } from "@/lib/supabase";

interface CommentSectionProps {
  parentType: "semester" | "subject" | "unit";
  parentId: string;
  initialComments?: Comment[];
}

export default function CommentSection({
  parentType,
  parentId,
  initialComments = [],
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !commentText.trim()) {
      setStatusMessage({ type: "error", text: "Please fill in all required fields (Name, Email, Comment)." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await submitComment({
      parent_type: parentType,
      parent_id: parentId,
      name: name.trim(),
      email: email.trim(),
      website: website.trim() || undefined,
      comment_text: commentText.trim(),
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: "success", text: res.message });
      setCommentText("");
      setName("");
      setEmail("");
      setWebsite("");
    } else {
      setStatusMessage({ type: "error", text: res.message || "Failed to submit comment. Please try again." });
    }
  }

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8 mt-12">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Student Discussion & Comments</h3>
          <p className="text-xs text-slate-500">Ask questions, request specific topics, or leave feedback</p>
        </div>
      </div>

      {/* Leave a Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leave a Comment</h4>
        
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Website / College (Optional)
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. Delhi Pharmaceutical Sciences Univ"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Your Comment / Doubt <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your doubts, queries about this unit, or suggestions..."
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm rounded-xl hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <span>Submitting...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Post Comment</span>
            </>
          )}
        </button>
      </form>

      {/* Approved Comments List */}
      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Approved Student Discussions ({comments.length})
        </h4>

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{comment.name}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.comment_text}</p>
                {comment.website && (
                  <span className="text-[11px] text-slate-400 italic">Affiliation: {comment.website}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No comments yet. Be the first pharmacy student to share your thoughts!
          </p>
        )}
      </div>
    </section>
  );
}
