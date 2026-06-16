"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScroll({ onLoadMore, hasMore, isLoading }: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" } // Trigger 200px before reaching the bottom
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) {
    return (
      <div className="py-12 text-center text-muted font-mono text-sm">
        You've reached the end of the line.
      </div>
    );
  }

  return (
    <div ref={observerTarget} className="py-12 flex justify-center">
      {isLoading && (
        <div className="flex items-center gap-2 text-brand-light font-mono text-sm">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading more videos...
        </div>
      )}
    </div>
  );
}
