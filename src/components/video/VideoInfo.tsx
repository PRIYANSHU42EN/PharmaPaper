"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "@/lib/date-utils";

interface VideoInfoProps {
  videoId: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  viewCount: number;
  likeCount: number;
  hasLiked: boolean;
  createdAt: string;
  lecturer: {
    id: string;
    name: string;
    avatarUrl: string;
    totalSubscribers: number;
    isSubscribed: boolean;
  } | null;
}

export default function VideoInfo({
  videoId,
  title,
  subject,
  course,
  semester,
  viewCount,
  likeCount,
  hasLiked: initialHasLiked,
  createdAt,
  lecturer: initialLecturer,
}: VideoInfoProps) {
  // Local state for likes and subscription to make interaction feel instant
  const [liked, setLiked] = useState(initialHasLiked);
  const [likes, setLikes] = useState(likeCount);
  const [likeLoading, setLikeLoading] = useState(false);

  const [lecturer, setLecturer] = useState(initialLecturer);
  const [subLoading, setSubLoading] = useState(false);

  // Toggle Like
  const handleLikeToggle = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    // Optimistic UI update
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikes((prev) => (prevLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await fetch("/api/videos/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      if (!res.ok) {
        throw new Error();
      }
      const data = await res.json();
      setLiked(data.liked);
    } catch (err) {
      // Revert on error
      setLiked(prevLiked);
      setLikes((prev) => (prevLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setLikeLoading(false);
    }
  };

  // Toggle Lecturer Subscription
  const handleSubscribeToggle = async () => {
    if (!lecturer || subLoading) return;
    setSubLoading(true);

    const prevSubscribed = lecturer.isSubscribed;
    const prevSubscribersCount = lecturer.totalSubscribers;

    // Optimistic UI update
    setLecturer({
      ...lecturer,
      isSubscribed: !prevSubscribed,
      totalSubscribers: prevSubscribed ? Math.max(0, prevSubscribersCount - 1) : prevSubscribersCount + 1,
    });

    try {
      const res = await fetch("/api/lecturer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecturerId: lecturer.id }),
      });
      if (!res.ok) {
        throw new Error();
      }
      const data = await res.json();
      setLecturer({
        ...lecturer,
        isSubscribed: data.subscribed,
        totalSubscribers: data.subscribed ? prevSubscribersCount + (prevSubscribed ? 0 : 1) : prevSubscribersCount - (prevSubscribed ? 1 : 0),
      });
    } catch (err) {
      // Revert on error
      setLecturer({
        ...lecturer,
        isSubscribed: prevSubscribed,
        totalSubscribers: prevSubscribersCount,
      });
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl glass-panel border-[#0582CA]/15">
      {/* Title & Like Row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono tracking-widest text-[#0582CA] uppercase">
            {course} • Semester {semester} • {subject}
          </span>
          <h1 className="font-bebas text-3xl md:text-4xl text-brand-cream tracking-wide uppercase leading-tight">
            {title}
          </h1>
        </div>

        {/* Heart Like Button */}
        <button
          onClick={handleLikeToggle}
          disabled={likeLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
            liked
              ? "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
              : "bg-white/5 border-white/10 hover:border-[#0582CA]/40 text-brand-cream/80 hover:text-brand-cream"
          }`}
        >
          <svg
            className={`w-4 h-4 fill-current transition-transform duration-300 ${liked ? "scale-110" : ""}`}
            viewBox="0 0 24 24"
          >
            {liked ? (
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            ) : (
              <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
            )}
          </svg>
          <span>{likes}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Lecturer and Stat Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {lecturer && (
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#0582CA]/25 bg-[#07080f]">
              <img
                src={lecturer.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=aris"}
                alt={lecturer.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-brand-cream">{lecturer.name}</span>
              <span className="text-[10px] text-brand-cream/40 font-mono">
                {lecturer.totalSubscribers.toLocaleString()} subscribers
              </span>
            </div>
            {/* Subscribe Button */}
            <button
              onClick={handleSubscribeToggle}
              disabled={subLoading}
              className={`ml-3 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all duration-300 ${
                lecturer.isSubscribed
                  ? "bg-white/10 hover:bg-white/15 text-brand-cream/80 hover:text-brand-cream"
                  : "bg-brand hover:bg-brand-light text-[#07080f]"
              }`}
            >
              {lecturer.isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        )}

        {/* Stats Display */}
        <div className="flex items-center gap-4 text-[10px] text-brand-cream/40 font-mono sm:self-center">
          <span>👁 {viewCount.toLocaleString()} views</span>
          <span>•</span>
          <span>📅 {formatDistanceToNow(new Date(createdAt))} ago</span>
        </div>
      </div>
    </div>
  );
}
