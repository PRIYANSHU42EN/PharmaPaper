"use client";

import React, { useState, useEffect } from "react";
import LecturerLayout from "@/components/lecturer/LecturerLayout";
import { motion, AnimatePresence } from "framer-motion";

interface SocialLinks {
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export default function LecturerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [socials, setSocials] = useState<SocialLinks>({
    youtube: "",
    linkedin: "",
    twitter: "",
    website: "",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/lecturer/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.lecturer) {
          const l = data.lecturer;
          setName(l.name || "");
          setBio(l.bio || "");
          setSpecialization(l.specialization || "");
          setAvatarUrl(l.avatar_url || "");
          setBannerUrl(l.banner_url || "");
          setSocials(l.social_links || {});
        } else {
          showToast(data.error || "Failed to load profile", "error");
        }
      })
      .catch((err) => {
        console.error("Load profile error:", err);
        showToast("Error loading profile details", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Display Name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/lecturer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          specialization: specialization.trim(),
          avatarUrl: avatarUrl.trim(),
          bannerUrl: bannerUrl.trim(),
          socialLinks: socials,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Profile settings updated successfully!");
      } else {
        showToast(data.error || "Failed to save settings", "error");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast("Error saving profile details", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LecturerLayout>
        <div className="flex items-center justify-center min-h-[50vh] font-mono text-xs uppercase tracking-widest text-brand-cream/50">
          Loading Profile Credentials...
        </div>
      </LecturerLayout>
    );
  }

  return (
    <LecturerLayout>
      <div className="max-w-4xl flex flex-col gap-8">
        <div>
          <h1 className="font-bebas text-3xl tracking-wide uppercase text-brand-cream">
            Profile <span className="text-brand">Settings</span>
          </h1>
          <p className="text-xs text-brand-cream/60 uppercase tracking-wider font-mono mt-1">
            Configure your educator brand, credentials, and social links
          </p>
        </div>

        {/* Banner Preview */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-brand-border/40 bg-brand-charcoal/40 backdrop-blur-md">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-brand-charcoal to-brand-gray/10">
              <span className="text-[10px] text-brand-cream/30 uppercase tracking-widest font-mono">No Banner Configured</span>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="absolute bottom-4 left-6 flex items-end gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-brand overflow-hidden bg-brand-charcoal shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg bg-brand/10">
                  {name[0]?.toUpperCase() || "L"}
                </div>
              )}
            </div>
            <div className="mb-2">
              <h2 className="text-sm font-bold text-white font-mono">{name || "Your Name"}</h2>
              <p className="text-[10px] text-brand uppercase tracking-wider font-bold mt-0.5">{specialization || "Specialization"}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General settings */}
          <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
              General Info
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                placeholder="e.g. Dr. Arjun Mehta"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                placeholder="e.g. Pharmaceutics Specialist"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Bio / About</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white resize-none"
                placeholder="Brief biography outlining your teaching qualifications and research credentials..."
              />
            </div>
          </div>

          {/* Media & Social Links */}
          <div className="flex flex-col gap-6">
            {/* Media urls */}
            <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
                Media Assets
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Avatar URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Banner Image URL</label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
            </div>

            {/* Social channels */}
            <div className="p-6 glass-panel border-brand-border/40 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand border-b border-brand-border/20 pb-2">
                Professional & Social Channels
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">YouTube</label>
                  <input
                    type="text"
                    value={socials.youtube || ""}
                    onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    placeholder="YouTube channel link"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">LinkedIn</label>
                  <input
                    type="text"
                    value={socials.linkedin || ""}
                    onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    placeholder="LinkedIn URL"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Twitter / X</label>
                  <input
                    type="text"
                    value={socials.twitter || ""}
                    onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    placeholder="Twitter URL"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-mono font-semibold text-brand-cream/60">Website</label>
                  <input
                    type="text"
                    value={socials.website || ""}
                    onChange={(e) => setSocials({ ...socials, website: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-border/40 bg-brand-charcoal/50 text-xs font-semibold focus:outline-none focus:border-brand transition-colors text-white"
                    placeholder="Personal blog/website"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action submit button */}
          <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-brand hover:bg-brand/90 text-brand-charcoal font-bold tracking-widest uppercase transition-all duration-300 text-xs shadow-lg disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold uppercase tracking-wider font-mono z-50 ${
              toast.type === "error"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </LecturerLayout>
  );
}
