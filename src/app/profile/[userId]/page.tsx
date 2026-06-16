"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  course: string;
  semester: number;
  bio: string;
  is_public: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { userId: currentUserId } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/v1/users/${userId}`);
        const data = await res.json();
        
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error || "Profile not found");
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-pulse-dot w-3 h-3 bg-brand-light rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text p-4">
        <h1 className="text-2xl font-heading text-brand-light mb-2">Profile Not Found</h1>
        <p className="text-muted">{error}</p>
        <Link href="/" className="mt-6 px-4 py-2 liquid-glass text-sm rounded hover:bg-white/5 transition">
          Return Home
        </Link>
      </div>
    );
  }

  const isOwner = currentUserId === profile.user_id;

  return (
    <div className="min-h-screen bg-bg text-text pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <div className="liquid-glass rounded-2xl p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="ambient-brand-glow absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-brand-light/30 bg-surface flex-shrink-0">
            {profile.avatar_url ? (
              <Image 
                src={profile.avatar_url} 
                alt={profile.name || "User"} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface2 text-2xl font-heading text-brand-light">
                {profile.name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          
          <div className="relative z-10 flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <h1 className="text-3xl font-heading font-light tracking-tight text-white">
                {profile.name || "Anonymous User"}
              </h1>
              {isOwner && (
                <Link href="/settings" className="px-4 py-2 border border-border rounded-button text-sm font-mono text-brand-light hover:bg-surface2 transition">
                  Edit Profile
                </Link>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4 font-mono text-xs text-muted uppercase tracking-wider">
              {profile.course && (
                <span className="px-2 py-1 liquid-glass rounded-subtle text-brand-light">
                  {profile.course}
                </span>
              )}
              {profile.semester && (
                <span className="px-2 py-1 liquid-glass rounded-subtle">
                  Semester {profile.semester}
                </span>
              )}
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            
            {profile.bio && (
              <p className="text-text-secondary leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="liquid-glass rounded-xl p-6 text-center">
            <div className="font-mono text-sm text-muted mb-1 uppercase">Videos Watched</div>
            <div className="text-3xl font-heading font-light text-brand-light">0</div>
          </div>
          <div className="liquid-glass rounded-xl p-6 text-center">
            <div className="font-mono text-sm text-muted mb-1 uppercase">Subjects Studied</div>
            <div className="text-3xl font-heading font-light text-brand-light">0</div>
          </div>
          <div className="liquid-glass rounded-xl p-6 text-center">
            <div className="font-mono text-sm text-muted mb-1 uppercase">Badges Earned</div>
            <div className="text-3xl font-heading font-light text-brand-light">0</div>
          </div>
        </div>

        {/* Bookmarks Section (Public if is_public) */}
        {profile.is_public && (
          <div className="mt-12">
            <h2 className="text-xl font-heading font-light border-b border-border pb-4 mb-6">
              Public Bookmarks
            </h2>
            <div className="text-center py-12 liquid-glass rounded-xl text-muted font-mono text-sm">
              No bookmarks to show yet.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
