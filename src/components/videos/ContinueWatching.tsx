"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { VideoCard } from "./VideoCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function ContinueWatching() {
  const { userId } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchContinue = async () => {
      try {
        const res = await fetch("/api/v1/videos/continue");
        const data = await res.json();
        if (data.success && data.data) {
          setVideos(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch continue watching:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContinue();
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full h-48 rounded-2xl liquid-glass animate-pulse flex items-center justify-center">
        <div className="animate-pulse-dot w-2 h-2 bg-brand-light rounded-full" />
      </div>
    );
  }

  if (videos.length === 0) {
    return null; // Hide completely if empty
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-medium text-white flex items-center gap-2">
            <div className="w-2 h-6 bg-brand rounded-full" />
            Continue Watching
          </h2>
          <p className="text-sm text-muted mt-1 font-mono">
            Pick up right where you left off
          </p>
        </div>
        <Link href="/history" className="text-sm text-brand-light hover:text-white transition flex items-center gap-1 font-mono">
          History <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
