"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  file_url: string;
  type: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search query helper inline/hook style
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Alphanumeric check matching searchSchema
    if (!/^[a-zA-Z0-9\s\-_.]+$/.test(debouncedQuery)) {
      setError("Search query contains invalid characters");
      setResults([]);
      return;
    }

    setError(null);
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("Too many search requests. Please wait.");
          }
          return res.json().then((d) => {
            throw new Error(d.error || "Search error");
          });
        }
        return res.json();
      })
      .then((data) => {
        setResults(data.results || []);
      })
      .catch((err: any) => {
        setError(err.message || "Something went wrong");
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedQuery]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    // Push user to the material page or subject view
    const semParam = result.course === "D.Pharm" ? `year${result.semester}` : `sem${result.semester}`;
    const courseParam = result.course.toLowerCase().replace(/[^a-z]/g, "");
    router.push(`/subject?name=${encodeURIComponent(result.subject)}&sem=${semParam}&type=${courseParam}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg z-50">
      <div className="relative">
        <span className="absolute inset-y-0 left-4 flex items-center text-brand-cream/40 text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search courses, notes, and question papers..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-11 pr-10 py-3 rounded-full bg-brand-charcoal/60 border border-brand-border text-xs text-brand-cream focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-300 placeholder:text-brand-cream/35 shadow-inner"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-4 inset-y-0 flex items-center text-brand-cream/30 hover:text-brand text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.trim() !== "") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 mt-2 p-3 bg-brand-charcoal/95 border border-brand-border rounded-2xl shadow-2xl backdrop-blur-xl max-h-80 overflow-y-auto"
          >
            {loading && (
              <div className="py-6 text-center text-xs text-brand-cream/50 font-mono tracking-wider animate-pulse">
                SEARCHING THE ARCHIVES...
              </div>
            )}

            {error && (
              <div className="py-4 px-3 text-center text-xs text-rose-400 font-mono">
                ⚠️ {error}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="py-6 text-center text-xs text-brand-cream/30 font-mono">
                NO MATERIALS FOUND FOR "{query}"
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleResultClick(r)}
                    className="w-full p-3 text-left rounded-xl hover:bg-brand-gray/30 border border-transparent hover:border-brand-border/40 transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-brand-cream group-hover:text-brand transition-colors">
                        {r.title}
                      </span>
                      <span className="text-[10px] text-brand-cream/50">
                        {r.subject} • {r.course} • Sem {r.semester}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest font-mono bg-brand-gray border border-brand-border text-brand-cream/60">
                      {r.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
