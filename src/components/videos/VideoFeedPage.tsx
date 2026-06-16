"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { FilterBar } from "./FilterBar";
import { VideoCard } from "./VideoCard";
import { InfiniteScroll } from "./InfiniteScroll";
import { ContinueWatching } from "./ContinueWatching";
import { PlaySquare, Users } from "lucide-react";

export function VideoFeedPage() {
  const { isLoaded, userId } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"all" | "subscriptions">("all");
  const [filters, setFilters] = useState({
    course: "",
    semester: "",
    sort: "latest"
  });
  
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (reset = false) => {
    if (!reset && nextCursor === null) return;
    
    try {
      const cursorToUse = reset ? 0 : nextCursor;
      if (reset) {
        setLoading(true);
        setVideos([]);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (filters.course) params.append("course", filters.course);
      if (filters.semester) params.append("semester", filters.semester);
      if (filters.sort) params.append("sort", filters.sort);
      params.append("tab", activeTab);
      params.append("cursor", cursorToUse!.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/v1/videos?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setVideos(prev => reset ? data.data.videos : [...prev, ...data.data.videos]);
        setNextCursor(data.data.nextCursor);
      } else {
        setError(data.error || "Failed to load videos");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, activeTab, nextCursor]);

  // Effect for initial load and filter changes
  useEffect(() => {
    if (isLoaded) {
      fetchVideos(true);
    }
  }, [filters, activeTab, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (!loading && !loadingMore && nextCursor !== null) {
      fetchVideos();
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-7xl mx-auto w-full pb-20">
      
      {/* Continue Watching Section */}
      {userId && activeTab === "all" && !filters.course && !filters.semester && (
        <ContinueWatching />
      )}

      {/* Main Feed Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-light text-white mb-2">
            Video <span className="text-brand-light font-medium">Library</span>
          </h1>
          <p className="text-muted font-mono">
            Explore hundreds of HD lectures and tutorials
          </p>
        </div>

        {/* Tabs */}
        {userId && (
          <div className="flex p-1 bg-surface/50 border border-white/5 rounded-lg w-full md:w-auto self-start">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "all" 
                  ? "bg-brand/20 text-brand-light shadow-sm" 
                  : "text-muted hover:text-white"
              }`}
            >
              <PlaySquare className="w-4 h-4" />
              All Videos
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "subscriptions" 
                  ? "bg-brand/20 text-brand-light shadow-sm" 
                  : "text-muted hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Following
            </button>
          </div>
        )}
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      {/* Main Grid */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-video bg-surface/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-surface/50 flex items-center justify-center border border-white/5">
            <PlaySquare className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-xl font-display text-white mb-2">No videos found</h3>
          <p className="text-muted max-w-sm">
            {activeTab === "subscriptions" 
              ? "You haven't subscribed to any lecturers yet, or they haven't uploaded any videos." 
              : "Try adjusting your filters or checking back later."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          
          <InfiniteScroll 
            onLoadMore={handleLoadMore} 
            hasMore={nextCursor !== null} 
            isLoading={loadingMore} 
          />
        </>
      )}
    </div>
  );
}
