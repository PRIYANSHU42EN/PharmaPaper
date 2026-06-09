"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

interface BookmarkButtonProps {
  materialId: string;
  initialBookmarked?: boolean;
}

export default function BookmarkButton({ materialId, initialBookmarked = false }: BookmarkButtonProps) {
  const { isSignedIn } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  // Sync state if user's bookmarks list loads
  useEffect(() => {
    if (!isSignedIn) return;

    // Check if this material is bookmarked
    const checkBookmarkStatus = async () => {
      try {
        const res = await fetch("/api/bookmarks");
        if (res.ok) {
          const data = await res.json();
          const isSaved = data.bookmarks?.some((b: any) => b.material_id === materialId);
          setIsBookmarked(!!isSaved);
        }
      } catch (err) {
        console.error("Error checking bookmark status:", err);
      }
    };

    checkBookmarkStatus();
  }, [materialId, isSignedIn]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isSignedIn) {
      alert("Please sign in to bookmark study materials.");
      return;
    }

    setLoading(true);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const res = await fetch(`/api/bookmarks?material_id=${materialId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ material_id: materialId }),
        });
        if (res.ok) {
          setIsBookmarked(true);
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleBookmark}
      disabled={loading}
      className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-200 ${
        isBookmarked
          ? "bg-brand-subtle border-brand text-brand shadow-[0_0_12px_rgba(142,146,144,0.2)]"
          : "bg-brand-charcoal border-brand-border text-brand-cream/40 hover:text-brand-cream/80 hover:border-brand-cream/20"
      }`}
      title={isBookmarked ? "Remove Bookmark" : "Bookmark Material"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </motion.button>
  );
}
