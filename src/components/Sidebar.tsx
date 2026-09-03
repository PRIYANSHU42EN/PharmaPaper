"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, BookOpen, FileText, ArrowRight, Sparkles } from "lucide-react";
import type { Post } from "@/lib/supabase";

interface SidebarProps {
  recentPosts?: Post[];
}

export default function Sidebar({ recentPosts = [] }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <aside className="space-y-8">
      {/* SearchBox Widget */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span>Search Notes & Subjects</span>
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Pharmacology, Anatomy..."
              className="w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center shrink-0 shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Curriculum Links */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Curriculum Semesters</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <Link
              key={num}
              href={`/bpharm/${num}${num === 1 ? "st" : num === 2 ? "nd" : num === 3 ? "rd" : "th"}-semester`}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-100 transition-colors flex items-center justify-between"
            >
              <span>Sem {num}</span>
              <ArrowRight className="w-3 h-3 opacity-40" />
            </Link>
          ))}
        </div>
      </div>

      {/* RecentPosts Widget */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Recent Career & Exam Guides</span>
        </h3>

        {recentPosts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="block py-3 group first:pt-0 last:pb-0"
              >
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-400">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Article"}
                  </span>
                  <span className="text-[11px] text-blue-600 font-medium group-hover:underline">Read article &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono">No articles published yet.</p>
        )}
      </div>

      {/* Telegram Banner Widget */}
      <div className="bg-gradient-to-br from-[#229ED9]/10 to-blue-50 rounded-2xl p-5 border border-[#229ED9]/20 text-center">
        <Sparkles className="w-6 h-6 text-[#229ED9] mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-900 mb-1">Join Our Student Community</h4>
        <p className="text-xs text-slate-600 mb-3">Get instant updates whenever new semester notes and question papers are uploaded.</p>
        <a
          href="https://t.me/pharmdbm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#229ED9] text-white rounded-xl text-xs font-semibold hover:bg-[#1b85b8] transition-colors shadow-sm"
        >
          Join Telegram Channel
        </a>
      </div>
    </aside>
  );
}
