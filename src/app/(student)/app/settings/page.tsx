"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    course: "B.Pharm",
    semester: 1,
    is_public: true,
    notifications_email: true,
    avatar_url: ""
  });

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/login");
      return;
    }

    async function fetchProfile() {
      if (!userId) return;
      try {
        const res = await fetch(`/api/v1/users/${userId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setFormData({
            name: data.data.name || user?.fullName || "",
            bio: data.data.bio || "",
            course: data.data.course || "B.Pharm",
            semester: data.data.semester || 1,
            is_public: data.data.is_public ?? true,
            notifications_email: data.data.notifications_email ?? true,
            avatar_url: data.data.avatar_url || user?.imageUrl || ""
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [isLoaded, userId, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === "semester" ? parseInt(value) : value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Profile updated successfully", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to update profile", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ text: "Uploading avatar...", type: "info" });
    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/v1/users/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "presigned",
          fileName: file.name,
          contentType: file.type
        })
      });
      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error(presignData.error);

      // 2. Upload directly to Supabase Storage
      const uploadRes = await fetch(presignData.data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      // 3. Confirm with backend
      const confirmRes = await fetch("/api/v1/users/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          avatarUrl: presignData.data.publicUrl
        })
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.success) throw new Error(confirmData.error);

      setFormData(prev => ({ ...prev, avatar_url: presignData.data.publicUrl }));
      setMessage({ text: "Avatar updated successfully", type: "success" });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Avatar upload failed", type: "error" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone after 7 days.")) return;

    try {
      const res = await fetch("/api/v1/users/me", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("Account scheduled for deletion. You will be signed out.");
        // Redirect or trigger clerk signout
        router.push("/");
      } else {
        alert(data.error || "Failed to delete account");
      }
    } catch (err) {
      alert("An error occurred");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="animate-pulse-dot w-3 h-3 bg-brand-light rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-heading font-light tracking-tight mb-2">Account Settings</h1>
          <p className="text-muted">Manage your profile, preferences, and account security.</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-subtle font-mono text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-brand/10 text-brand-light border border-brand/20'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile Section */}
          <div className="liquid-glass rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-heading border-b border-border pb-2">Profile Information</h2>
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-surface2 overflow-hidden relative border border-border">
                {formData.avatar_url && (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-border rounded-button text-sm font-mono text-brand-light hover:bg-surface2 transition"
                >
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-muted mb-1">Display Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-button px-4 py-2 text-text focus:outline-none focus:border-brand-light transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-mono text-muted mb-1">Bio</label>
                <textarea 
                  name="bio" 
                  rows={3}
                  value={formData.bio} 
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-button px-4 py-2 text-text focus:outline-none focus:border-brand-light transition"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Academic Section */}
          <div className="liquid-glass rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-heading border-b border-border pb-2">Academic Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono text-muted mb-1">Course</label>
                <select 
                  name="course" 
                  value={formData.course} 
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-button px-4 py-2 text-text focus:outline-none focus:border-brand-light appearance-none"
                >
                  <option value="B.Pharm">B.Pharm</option>
                  <option value="D.Pharm">D.Pharm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-mono text-muted mb-1">Semester/Year</label>
                <select 
                  name="semester" 
                  value={formData.semester} 
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-button px-4 py-2 text-text focus:outline-none focus:border-brand-light appearance-none"
                >
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>{formData.course === 'B.Pharm' ? `Semester ${s}` : `Year ${s}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="liquid-glass rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-heading border-b border-border pb-2">Preferences</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_public" 
                  checked={formData.is_public} 
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border bg-surface text-brand-light focus:ring-brand-light focus:ring-offset-bg"
                />
                <div>
                  <div className="text-sm font-medium">Public Profile</div>
                  <div className="text-xs text-muted">Allow others to see your profile and bookmarks</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="notifications_email" 
                  checked={formData.notifications_email} 
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border bg-surface text-brand-light focus:ring-brand-light focus:ring-offset-bg"
                />
                <div>
                  <div className="text-sm font-medium">Email Notifications</div>
                  <div className="text-xs text-muted">Receive updates about new materials and videos</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-brand-light text-bg px-6 py-2 rounded-button font-medium hover:bg-white transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-12 border border-red-500/20 rounded-xl p-6 bg-red-500/5">
          <h2 className="text-xl font-heading text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-400/80 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button 
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-button text-sm hover:bg-red-500/20 transition"
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  );
}
