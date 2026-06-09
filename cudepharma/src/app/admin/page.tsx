"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth, useUser, SignIn, useClerk } from "@clerk/nextjs";

// Interface Definitions
interface Note {
  id: string; // Changed to string (UUID)
  title: string;
  sem: string;
  course: string;
  units: number;
  status: 'published' | 'draft';
  date: string;
  pdfName?: string;
}

interface PYQ {
  id: string; // Changed to string (UUID)
  subject: string;
  sem: string;
  session: 'Aug-Sep' | 'Nov-Dec';
  year: string;
  course: string;
  status: 'uploaded' | 'pending';
  pdfName?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joined: string;
  status: 'active' | 'inactive';
}

interface Settings {
  sitename: string;
  email: string;
  desc: string;
}

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AdminPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Authentication & Authorization States
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Computed Loading State
  const authLoading = !isLoaded || (!!userId && isAdmin === null);

  // General States
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'notes' | 'pyq' | 'users' | 'settings' | 'payments' | 'video-approvals'>('dashboard');
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [rejectionVideoId, setRejectionVideoId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [popularMaterials, setPopularMaterials] = useState<any[]>([]);

  // Modal States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", sem: "", course: "", pdfName: "" });

  const [isPyqModalOpen, setIsPyqModalOpen] = useState(false);
  const [editingPyqId, setEditingPyqId] = useState<string | null>(null);
  const [pyqForm, setPyqForm] = useState({ subject: "", sem: "", course: "", session: "" as 'Aug-Sep' | 'Nov-Dec' | "", year: "" });

  // Settings State
  const [settingsForm, setSettingsForm] = useState<Settings>({ sitename: "Pharma Paper", email: "admin@pharmapaper.com", desc: "" });

  // Analytics State
  const [analyticsSummary, setAnalyticsSummary] = useState<{ total_views: number; views_today: number; top_pages: { page: string; views: number }[] }>({ total_views: 0, views_today: 0, top_pages: [] });

  // Core Data Lists
  const [notes, setNotes] = useState<Note[]>([]);
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Settings>({ sitename: "Pharma Paper", email: "admin@pharmapaper.com", desc: "Your Complete Pharmacy Study Vault" });

  // Toast Functionality
  const addToast = (text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // 1. Sync Clerk user and verify admin role
  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      setIsAdmin(null);
      setSession(null);
      return;
    }

    const syncAndVerify = async () => {
      try {
        const email = user?.emailAddresses[0]?.emailAddress;
        const name = user?.fullName || user?.firstName || "";
        const username = user?.username || "";

        if (!email) {
          setIsAdmin(false);
          return;
        }

        // Sync Clerk user with public.users table in Supabase (Security Definer RPC)
        const { error: syncError } = await supabase.rpc("sync_clerk_user", {
          p_email: email,
          p_clerk_user_id: userId,
          p_name: name,
          p_username: username,
        });
        if (syncError) console.error("Error syncing Clerk user to Supabase:", syncError);

        // Create virtual session for UI compatibility
        setSession({
          user: {
            id: userId,
            email: email,
            name: name,
          },
        });

        // Verify Admin role using SECURITY DEFINER check_user_role function
        const { data: roleData, error: roleError } = await supabase.rpc("check_user_role", {
          p_email: email,
        });

        if (roleError) {
          console.error("Error checking role:", roleError);
          // Fallback direct check (in case role function failed)
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("email", email)
            .maybeSingle();
          setIsAdmin(userData?.role === "admin" || userData?.role === "super-admin");
        } else {
          setIsAdmin(roleData === "admin" || roleData === "super-admin");
        }
      } catch (err) {
        console.error("Admin verification error:", err);
        setIsAdmin(false);
      }
    };

    syncAndVerify();
  }, [user, isLoaded, userId]);

  // 3. Fetch Admin Data once authorized
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchPendingVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await fetch("/api/admin/video-approvals");
      const data = await res.json();
      if (data.success) {
        setPendingVideos(data.videos || []);
      }
    } catch (err) {
      console.error("Error fetching pending videos:", err);
      addToast("Failed to load video queue", "error");
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (isAdmin && currentPage === "video-approvals") {
      fetchPendingVideos();
    }
  }, [isAdmin, currentPage]);

  const handleApproveVideo = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to approve and publish this video lecture?")) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/admin/video-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Video approved and published successfully!");
        fetchPendingVideos();
      } else {
        addToast(data.error || "Failed to approve video", "error");
      }
    } catch (err) {
      console.error("Approve video error:", err);
      addToast("Error approving video", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRejectVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionVideoId) return;
    if (!rejectionReasonInput.trim()) {
      addToast("Please provide a rejection reason", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/admin/video-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: rejectionVideoId,
          action: "reject",
          rejectionReason: rejectionReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Video rejected and feedback submitted");
        setRejectionVideoId(null);
        setRejectionReasonInput("");
        fetchPendingVideos();
      } else {
        addToast(data.error || "Failed to reject video", "error");
      }
    } catch (err) {
      console.error("Reject video error:", err);
      addToast("Error rejecting video", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch dashboard data");
      }
      const data = await response.json();
      const { study_materials, users: dbUsers, admin_activity_logs: dbLogs, platform_settings: dbSettings, analytics_summary: dbAnalytics } = data;

      // Map study materials to notes & PYQs
      const dbNotes: Note[] = [];
      const dbPyqs: PYQ[] = [];

      (study_materials || []).forEach((item: any) => {
        const isPyq = item.type === 'pyq';
        const semLabel = item.course === 'D.Pharm' ? `Year ${item.semester}` : `Sem ${item.semester}`;

        if (isPyq) {
          const parts = (item.title || "").split(" - ");
          const sessionVal = parts[0] === 'Aug-Sep' ? 'Aug-Sep' : 'Nov-Dec';
          const yearVal = parts[1] || "2025";
          dbPyqs.push({
            id: item.id,
            subject: item.subject || item.title || "Unknown",
            sem: semLabel,
            course: item.course || "B.Pharm",
            session: sessionVal,
            year: yearVal,
            status: 'uploaded',
            pdfName: item.file_url ? item.file_url.split('/').pop() : 'paper.pdf'
          });
        } else {
          dbNotes.push({
            id: item.id,
            title: item.title || "Untitled Note",
            sem: semLabel,
            course: item.course || "B.Pharm",
            units: 5,
            status: 'published',
            date: new Date(item.created_at).toISOString().slice(0, 10),
            pdfName: item.file_url ? item.file_url.split('/').pop() : 'notes.pdf'
          });
        }
      });

      setNotes(dbNotes);
      setPyqs(dbPyqs);

      // Set users
      setUsers((dbUsers || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.username || 'User',
        email: u.email || '',
        role: u.role || 'user',
        joined: new Date(u.created_at).toISOString().slice(0, 10),
        status: 'active'
      })));

      // Set activity logs
      setActivityLogs((dbLogs || []).map((l: any) => ({
        id: l.id,
        admin_email: l.admin_id || 'System',
        action: l.action || 'ACTION',
        details: typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || '{}',
        timestamp: new Date(l.timestamp).toLocaleString()
      })));

      // Set platform settings from Supabase
      if (dbSettings && typeof dbSettings === 'object') {
        const loadedSettings: Settings = {
          sitename: dbSettings.sitename || 'Pharma Paper',
          email: dbSettings.email || 'admin@pharmapaper.com',
          desc: dbSettings.description || 'Your Complete Pharmacy Study Vault'
        };
        setSettings(loadedSettings);
        setSettingsForm(loadedSettings);
      }

      // Set analytics summary
      if (dbAnalytics && typeof dbAnalytics === 'object') {
        setAnalyticsSummary({
          total_views: dbAnalytics.total_views || 0,
          views_today: dbAnalytics.views_today || 0,
          top_pages: dbAnalytics.top_pages || []
        });
      }

      // Set payments, trials and popular materials
      setPayments(data.payments || []);
      setTrials(data.trials || []);
      setPopularMaterials(data.popular_materials || []);

    } catch (err: any) {
      console.error("Error fetching admin dashboard data:", err);
      addToast(err.message || "Failed to fetch database records", "error");
    }
  };

  // Helper log activity via POST mutate
  const logActivity = async (action: string, details: any) => {
    try {
      const response = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          operation: "LOG_ACTIVITY",
          payload: {
            admin_email: user?.emailAddresses[0]?.emailAddress || "admin",
            action: action,
            details: details
          }
        })
      });
      if (!response.ok) throw new Error("Failed to write activity log");
      fetchDashboardData();
    } catch (e) {
      console.error("Failed to write activity log:", e);
    }
  };

  // Sign Out Handler
  const handleLogout = async () => {
    await signOut();
    addToast("Logged out successfully");
  };

  // Notes CRUD Handlers
  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        const targetNote = notes.find(n => n.id === id);
        const response = await fetch("/api/admin/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            operation: "MUTATE_STUDY_MATERIAL",
            payload: {
              action: "DELETE",
              id: id
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete note");
        }

        addToast("Note deleted successfully");
        logActivity("DELETE_NOTE", { id, title: targetNote?.title });
      } catch (err: any) {
        addToast(err.message, "error");
      }
    }
  };

  const openAddNote = () => {
    setEditingNoteId(null);
    setNoteForm({ title: "", sem: "", course: "", pdfName: "" });
    setIsNoteModalOpen(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteForm({ title: note.title, sem: note.sem, course: note.course, pdfName: note.pdfName || "" });
    setIsNoteModalOpen(true);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.sem || !noteForm.course) {
      addToast("Please fill all fields", "error");
      return;
    }

    const semesterInt = parseInt(noteForm.sem.replace("Sem ", "").replace("Year ", ""), 10) || 1;

    try {
      const response = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          operation: "MUTATE_STUDY_MATERIAL",
          payload: {
            action: editingNoteId !== null ? "UPDATE" : "INSERT",
            id: editingNoteId,
            title: noteForm.title,
            semester: semesterInt,
            course: noteForm.course,
            file_url: noteForm.pdfName || "https://example.com/pdf",
            type: "pdf",
            subject: noteForm.title
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save note");
      }

      addToast(editingNoteId !== null ? "Note updated successfully" : "Note added successfully");
      logActivity(editingNoteId !== null ? "UPDATE_NOTE" : "ADD_NOTE", { id: editingNoteId, title: noteForm.title });
      setIsNoteModalOpen(false);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  // PYQs CRUD Handlers
  const handleDeletePyq = async (id: string) => {
    if (confirm("Are you sure you want to delete this paper?")) {
      try {
        const targetPyq = pyqs.find(p => p.id === id);
        const response = await fetch("/api/admin/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            operation: "MUTATE_STUDY_MATERIAL",
            payload: {
              action: "DELETE",
              id: id
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to delete paper");
        }

        addToast("Question paper deleted");
        logActivity("DELETE_PYQ", { id, subject: targetPyq?.subject });
      } catch (err: any) {
        addToast(err.message, "error");
      }
    }
  };

  const openAddPyq = () => {
    setEditingPyqId(null);
    setPyqForm({ subject: "", sem: "", course: "", session: "", year: "" });
    setIsPyqModalOpen(true);
  };

  const openEditPyq = (pyq: PYQ) => {
    setEditingPyqId(pyq.id);
    setPyqForm({ subject: pyq.subject, sem: pyq.sem, course: pyq.course, session: pyq.session, year: pyq.year });
    setIsPyqModalOpen(true);
  };

  const handlePyqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pyqForm.subject || !pyqForm.sem || !pyqForm.course || !pyqForm.session || !pyqForm.year) {
      addToast("Please fill all fields", "error");
      return;
    }

    const semesterInt = parseInt(pyqForm.sem.replace("Sem ", "").replace("Year ", ""), 10) || 1;
    const paperTitle = `${pyqForm.session} - ${pyqForm.year}`;

    try {
      const response = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          operation: "MUTATE_STUDY_MATERIAL",
          payload: {
            action: editingPyqId !== null ? "UPDATE" : "INSERT",
            id: editingPyqId,
            title: paperTitle,
            semester: semesterInt,
            course: pyqForm.course,
            file_url: "https://example.com/pyq.pdf",
            type: "pyq",
            subject: pyqForm.subject
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save paper");
      }

      addToast(editingPyqId !== null ? "Question paper updated" : "Question paper added");
      logActivity(editingPyqId !== null ? "UPDATE_PYQ" : "ADD_PYQ", { id: editingPyqId, subject: pyqForm.subject });
      setIsPyqModalOpen(false);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  // User Actions
  const toggleUserRole = async (id: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (confirm(`Change this user's role to ${nextRole}?`)) {
      try {
        const response = await fetch("/api/admin/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            operation: "MUTATE_USER_ROLE",
            payload: {
              id: id,
              role: nextRole
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to update user role");
        }

        addToast("User role updated successfully");
        logActivity("TOGGLE_USER_ROLE", { id, newRole: nextRole });
      } catch (err: any) {
        addToast(err.message, "error");
      }
    }
  };

  // Settings Actions — persist to Supabase
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "SAVE_SETTINGS",
          payload: {
            settings: {
              sitename: settingsForm.sitename,
              email: settingsForm.email,
              description: settingsForm.desc
            }
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save settings");
      }

      setSettings(settingsForm);
      addToast("Platform settings saved to database");
      logActivity("SAVE_SETTINGS", { sitename: settingsForm.sitename, email: settingsForm.email });
    } catch (err: any) {
      addToast(err.message || "Failed to save settings", "error");
    }
  };

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const totalRev = (payments || [])
      .filter((p: any) => p.status === 'completed' || p.status === 'captured' || p.status === 'success' || p.status === 'paid')
      .reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

    const activeTrialsCount = (trials || [])
      .filter((t: any) => t.status === 'active')
      .length;

    return {
      totalNotes: notes.length,
      totalPYQ: pyqs.length,
      totalUsers: users.length,
      publishedNotes: notes.length,
      revenue: totalRev,
      activeTrials: activeTrialsCount
    };
  }, [notes, pyqs, users, payments, trials]);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Verifying Security Credentials...
      </div>
    );
  }

  // Login Required Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] ambient-brand-glow pointer-events-none opacity-[0.05]" />
        
        <div className="w-full max-w-md p-8 glass-panel border border-brand-border rounded-2xl relative z-10 shadow-2xl flex flex-col items-center">
          <div className="text-center mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] inline-block mb-3" />
            <h1 className="font-bebas text-3xl tracking-wider text-brand-cream uppercase">
              PHARMA<span className="text-brand"> GATEWAY</span>
            </h1>
            <p className="text-xs text-brand-cream/50 uppercase tracking-widest font-mono mt-1 font-bold">
              Admin Workspace Login
            </p>
          </div>

          <SignIn routing="hash" signUpUrl="/signup" />
        </div>
        
        {/* Toast Notification Container */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {toasts.map(toast => (
            <div key={toast.id} className={`px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold uppercase tracking-wider font-mono ${
              toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {toast.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Access Denied Screen (Logged in but not admin)
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md p-8 glass-panel border border-rose-500/20 bg-rose-500/[0.01] rounded-2xl relative z-10 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 text-xl mb-4">
            ⚠️
          </div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-cream uppercase mb-2">
            Access <span className="text-rose-400">Denied</span>
          </h1>
          <p className="text-xs text-brand-cream/60 leading-relaxed mb-6 font-mono">
            Your account ({session.user.email}) does not have administrative roles on this gateway.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-gray text-xs font-bold tracking-wider uppercase transition-all">
              Go Home
            </Link>
            <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold tracking-wider uppercase transition-all">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin View
  return (
    <div className="relative w-full min-h-screen bg-brand-charcoal text-brand-cream selection:bg-brand selection:text-white flex flex-col md:flex-row">
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold uppercase tracking-wider font-mono ${
            toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {toast.text}
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-brand-border md:sticky md:top-0 md:h-screen flex flex-col justify-between p-6 bg-brand-charcoal/40 backdrop-blur-xl z-40">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] animate-pulse" />
              <span className="font-bebas text-xl tracking-wider text-brand-cream">
                PHARMA<span className="text-brand"> PANEL</span>
              </span>
            </Link>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-brand-cream hover:text-brand transition-colors"
            >
              ☰
            </button>
          </div>

          <nav className={`flex-col gap-2 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'notes', label: 'Notes Vault', icon: '📝' },
              { id: 'pyq', label: 'PYQ Papers', icon: '📄' },
              { id: 'video-approvals', label: 'Video Approvals', icon: '📹' },
              { id: 'users', label: 'User Index', icon: '👥' },
              { id: 'payments', label: 'Payments & Revenue', icon: '💳' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  currentPage === item.id 
                    ? 'bg-brand text-brand-charcoal shadow-md font-extrabold' 
                    : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-gray/30'
                }`}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={`flex flex-col gap-4 border-t border-brand-border/40 pt-6 mt-6 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] text-brand-cream/30 uppercase tracking-widest font-mono">Logged in as</span>
            <span className="text-[10px] font-bold text-brand-cream/80 truncate font-mono mt-0.5">{session.user.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl border border-brand-border hover:border-rose-500/40 hover:text-rose-400 text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
          >
            🔌 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-brand-border/40 px-6 md:px-8 flex items-center justify-between shrink-0 bg-brand-charcoal/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-brand uppercase font-mono tracking-widest font-bold">Administration Console</span>
            <span className="text-brand-border">/</span>
            <span className="text-[10px] text-brand-cream/50 uppercase font-mono tracking-widest font-semibold">{currentPage}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-mono uppercase tracking-widest">
              Live Gateway Connected
            </span>
          </div>
        </header>

        {/* Content Explorer Scrollable area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* ═══ TAB: DASHBOARD ═══ */}
          {currentPage === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              {/* Stat Counters Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Notes', count: stats.totalNotes, color: 'text-brand' },
                  { label: 'PYQ Papers', count: stats.totalPYQ, color: 'text-sky-400' },
                  { label: 'Active Users', count: stats.totalUsers, color: 'text-purple-400' },
                  { label: 'Active Trials', count: stats.activeTrials, color: 'text-amber-400' },
                  { label: 'Total Revenue', count: `₹${stats.revenue}`, color: 'text-emerald-400' },
                  { label: 'Published Assets', count: stats.publishedNotes, color: 'text-teal-400' }
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 glass-panel border-brand-border rounded-2xl flex flex-col justify-between aspect-video">
                    <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold">{stat.label}</span>
                    <span className={`text-4xl font-bebas tracking-wide mt-2 ${stat.color}`}>{stat.count}</span>
                  </div>
                ))}
              </div>

              {/* Analytics Summary Widget */}
              <div className="glass-panel border-brand-border rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold font-bebas uppercase tracking-wider text-brand-cream/80 mb-4">📈 Platform Analytics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-brand-charcoal/30 border border-brand-border/40 rounded-xl">
                    <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold">Total Page Views</span>
                    <span className="block text-3xl font-bebas tracking-wide mt-1 text-brand">{analyticsSummary.total_views}</span>
                  </div>
                  <div className="p-4 bg-brand-charcoal/30 border border-brand-border/40 rounded-xl">
                    <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold">Views Today</span>
                    <span className="block text-3xl font-bebas tracking-wide mt-1 text-emerald-400">{analyticsSummary.views_today}</span>
                  </div>
                  <div className="p-4 bg-brand-charcoal/30 border border-brand-border/40 rounded-xl col-span-2 lg:col-span-1">
                    <span className="text-[9px] text-brand-cream/40 uppercase tracking-widest font-mono font-semibold">Popular Materials (Views)</span>
                    <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto">
                      {popularMaterials.length > 0 ? popularMaterials.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-brand-cream/60 truncate mr-2">{p.study_materials?.title || 'Unknown'}</span>
                          <span className="text-brand font-bold shrink-0">{p.views || 0}</span>
                        </div>
                      )) : (
                        <span className="text-[10px] text-brand-cream/30 font-mono">No data yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity log / Recent uploads */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Activity Logs */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <h3 className="text-sm font-bold font-bebas uppercase tracking-wider text-brand-cream/80">Admin Activity Logs</h3>
                  <div className="glass-panel border-brand-border rounded-2xl overflow-hidden shadow-xl p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-brand-charcoal/30 border border-brand-border/40 rounded-xl flex flex-col gap-1 text-[11px]">
                          <div className="flex justify-between items-center text-[9px] font-mono text-brand-cream/40">
                            <span>{log.admin_email}</span>
                            <span>{log.timestamp}</span>
                          </div>
                          <div className="font-semibold text-brand-cream">
                            Action: <span className="text-brand">{log.action}</span>
                          </div>
                          <div className="text-brand-cream/60 font-mono overflow-x-auto whitespace-pre-wrap mt-0.5">
                            {log.details}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-brand-cream/30 uppercase tracking-widest font-mono border border-dashed border-brand-border rounded-xl">
                        No activity logs registered yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold font-bebas uppercase tracking-wider text-brand-cream/80">Quick Gateways</h3>
                  <div className="p-6 glass-panel border border-brand-border rounded-2xl flex flex-col gap-4 shadow-xl">
                    <p className="text-xs text-brand-cream/65 leading-relaxed">
                      Need to immediately push syllabus additions or modify course semesters?
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setCurrentPage('notes')}
                        className="py-3 px-4 rounded-xl border border-brand-border hover:border-brand hover:text-brand text-xs font-bold uppercase tracking-wider text-left transition-all duration-300 flex items-center justify-between"
                      >
                        <span>Add Study Materials</span>
                        <span>→</span>
                      </button>
                      <button 
                        onClick={() => setCurrentPage('pyq')}
                        className="py-3 px-4 rounded-xl border border-brand-border hover:border-brand hover:text-brand text-xs font-bold uppercase tracking-wider text-left transition-all duration-300 flex items-center justify-between"
                      >
                        <span>Add Exam Question Papers</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: NOTES ═══ */}
          {currentPage === 'notes' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-bebas tracking-wider">
                  Manage <span className="text-brand">Notes</span>
                </h2>
                <button
                  onClick={openAddNote}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-md flex items-center gap-1.5"
                >
                  <span>+</span> Add Note
                </button>
              </div>

              <div className="glass-panel border-brand-border rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-gray/20">
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Title & PDF</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Semester</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Course</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Date</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map(n => (
                        <tr key={n.id} className="border-b border-brand-border/40 hover:bg-brand-gray/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="text-sm font-bold text-brand-cream">{n.title}</div>
                            {n.pdfName && (
                              <div className="text-[11px] text-brand-cream/40 font-mono mt-0.5 flex items-center gap-1">
                                <span>📄</span> {n.pdfName}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-brand-cream/60">{n.sem}</td>
                          <td className="py-4 px-6 text-sm text-brand-cream/60">{n.course}</td>
                          <td className="py-4 px-6 text-sm text-brand-cream/40 font-mono">{n.date}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditNote(n)}
                                className="px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand hover:text-brand text-[10px] font-semibold uppercase tracking-wider transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(n.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: PYQ ═══ */}
          {currentPage === 'pyq' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-bebas tracking-wider">
                  Manage Question <span className="text-brand">Papers</span>
                </h2>
                <button
                  onClick={openAddPyq}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-md flex items-center gap-1.5"
                >
                  <span>+</span> Add Paper
                </button>
              </div>

              <div className="glass-panel border-brand-border rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-gray/20">
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Subject & PDF</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Semester</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Session</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Year</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Course</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pyqs.map(p => (
                        <tr key={p.id} className="border-b border-brand-border/40 hover:bg-brand-gray/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="text-sm font-bold text-brand-cream">{p.subject}</div>
                            {p.pdfName && (
                              <div className="text-[11px] text-brand-cream/40 font-mono mt-0.5 flex items-center gap-1">
                                <span>📄</span> {p.pdfName}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-brand-cream/60">{p.sem}</td>
                          <td className="py-4 px-6 text-xs">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-semibold ${
                              p.session === 'Aug-Sep' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {p.session}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-brand-cream/60 font-mono">{p.year}</td>
                          <td className="py-4 px-6 text-sm text-brand-cream/60">{p.course}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditPyq(p)}
                                className="px-3 py-1.5 rounded-lg border border-brand-border hover:border-brand hover:text-brand text-[10px] font-semibold uppercase tracking-wider transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePyq(p.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: USERS ═══ */}
          {currentPage === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-xl font-bold font-bebas tracking-wider">
                Manage <span className="text-brand">Users</span>
              </h2>

              <div className="glass-panel border-brand-border rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-gray/20">
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Name</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Email</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Role</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono">Joined</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-brand-cream/40 font-mono text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-brand-border/40 hover:bg-brand-gray/30 transition-colors">
                          <td className="py-4 px-6 text-sm font-bold text-brand-cream">{u.name}</td>
                          <td className="py-4 px-6 text-sm text-brand-cream/60">{u.email}</td>
                          <td className="py-4 px-6 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono ${
                              u.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-brand-cream/40 font-mono">{u.joined}</td>
                          <td className="py-4 px-6 text-right">
                            {u.id !== session.user.id && (
                              <button
                                onClick={() => toggleUserRole(u.id, u.role)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors border ${
                                  u.role === 'admin' 
                                    ? 'bg-rose-500/10 border-rose-500/10 text-rose-400 hover:bg-rose-500/20' 
                                    : 'bg-emerald-500/10 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: SETTINGS ═══ */}
          {currentPage === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-xl font-bold font-bebas tracking-wider">
                Platform <span className="text-brand">Settings</span>
              </h2>

              <div className="glass-panel border-brand-border p-6 md:p-8 rounded-2xl shadow-xl max-w-2xl">
                <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Site Name</label>
                    <input
                      type="text"
                      value={settingsForm.sitename}
                      onChange={e => setSettingsForm({ ...settingsForm, sitename: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all placeholder:text-brand-cream/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Admin Email</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all placeholder:text-brand-cream/20"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Platform Description</label>
                    <textarea
                      value={settingsForm.desc}
                      onChange={e => setSettingsForm({ ...settingsForm, desc: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all placeholder:text-brand-cream/20 min-h-[100px] resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-md mt-2"
                  >
                    Save Platform Settings
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: PAYMENTS ═══ */}
          {currentPage === 'payments' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <h2 className="text-xl font-bold font-bebas tracking-wider">
                Payments & <span className="text-brand">Trials Log</span>
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payments Table */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold font-bebas uppercase tracking-wider text-brand-cream/80">Completed Transactions</h3>
                  <div className="glass-panel border-brand-border rounded-2xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-brand-border bg-brand-gray/20">
                            <th className="py-3 px-4 uppercase tracking-widest text-brand-cream/40 font-mono">User ID / Plan</th>
                            <th className="py-3 px-4 uppercase tracking-widest text-brand-cream/40 font-mono">Amount</th>
                            <th className="py-3 px-4 uppercase tracking-widest text-brand-cream/40 font-mono">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p, idx) => (
                            <tr key={idx} className="border-b border-brand-border/40 hover:bg-brand-gray/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-brand-cream truncate max-w-[150px]">{p.user_id}</div>
                                <div className="text-[10px] text-brand font-mono uppercase">{p.plan_type}</div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{p.amount}</td>
                              <td className="py-3 px-4 text-brand-cream/40 font-mono">{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-brand-cream/30 font-mono uppercase">No payment transactions</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Trials Table */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold font-bebas uppercase tracking-wider text-brand-cream/80">Active & Expired Trials</h3>
                  <div className="glass-panel border-brand-border rounded-2xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-brand-border bg-brand-gray/20">
                            <th className="py-3 px-4 uppercase tracking-widest text-brand-cream/40 font-mono">Email / Plan</th>
                            <th className="py-3 px-4 uppercase tracking-widest text-brand-cream/40 font-mono">Status</th>
                            <th className="py-3 px-4 uppercase tracking-widest text-brand-cream/40 font-mono">Expires At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trials.map((t, idx) => (
                            <tr key={idx} className="border-b border-brand-border/40 hover:bg-brand-gray/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-brand-cream truncate max-w-[150px]">{t.email}</div>
                                <div className="text-[10px] text-brand-cream/40 font-mono">{t.plan_type}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest font-mono ${
                                  t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>{t.status}</span>
                              </td>
                              <td className="py-3 px-4 text-brand-cream/40 font-mono">{new Date(t.trial_end).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {trials.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-brand-cream/30 font-mono uppercase">No trial enrollments</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: VIDEO APPROVALS ═══ */}
          {currentPage === 'video-approvals' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-bebas tracking-wider">
                  Lecturer Video <span className="text-brand">Approvals</span>
                </h2>
                <button
                  onClick={fetchPendingVideos}
                  className="px-4 py-2 rounded-xl border border-brand-border text-brand-cream hover:bg-brand-gray/30 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  🔄 Refresh Queue
                </button>
              </div>

              {loadingVideos ? (
                <div className="py-12 text-center text-xs text-brand-cream/35 font-mono uppercase tracking-widest">
                  Loading submissions queue...
                </div>
              ) : pendingVideos.length === 0 ? (
                <div className="py-16 glass-panel border-brand-border rounded-2xl text-center flex flex-col items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <p className="text-xs font-mono uppercase text-brand-cream/50 tracking-wider">No lectures currently awaiting review</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingVideos.map((video) => (
                    <div
                      key={video.id}
                      className="p-6 glass-panel border border-brand-border rounded-2xl flex flex-col lg:flex-row justify-between gap-6 shadow-xl"
                    >
                      <div className="flex gap-6 min-w-0">
                        {/* Video Preview */}
                        <div className="w-44 aspect-video rounded-xl overflow-hidden border border-brand-border/40 shrink-0 bg-brand-charcoal flex items-center justify-center relative">
                          {video.youtube_id ? (
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?controls=1`}
                              title={video.title}
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          ) : (
                            <span className="text-xl">📹</span>
                          )}
                        </div>

                        {/* Video Metadata */}
                        <div className="flex flex-col gap-2 min-w-0">
                          <h4 className="text-sm font-bold text-white font-mono leading-snug">{video.title}</h4>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-[8px] bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                              {video.course} - Sem {video.semester}
                            </span>
                            <span className="text-[8px] bg-brand-gray border border-brand-border/40 text-brand-cream/60 px-2 py-0.5 rounded font-mono uppercase">
                              {video.subject} - Unit {video.unit}
                            </span>
                            {video.is_premium && (
                              <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                                Premium (Preview: {video.free_preview_duration}s)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-brand-cream/60 line-clamp-2 leading-relaxed font-sans max-w-xl">
                            {video.description || "No description provided."}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-brand-cream/40 font-mono uppercase">Submitted by:</span>
                            <span className="text-[9px] text-brand font-bold font-mono">{video.lecturer?.name || "Unknown Lecturer"}</span>
                            <span className="text-[8px] text-brand-cream/30 font-mono">({new Date(video.created_at).toLocaleDateString()})</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex lg:flex-col justify-end gap-3 shrink-0 self-center">
                        <button
                          onClick={() => handleApproveVideo(video.id)}
                          disabled={submittingReview}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-md transition-colors disabled:opacity-50"
                        >
                          🟢 Approve & Publish
                        </button>
                        <button
                          onClick={() => setRejectionVideoId(video.id)}
                          disabled={submittingReview}
                          className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-md transition-colors disabled:opacity-50"
                        >
                          🔴 Reject Submission
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejection Feedback Modal overlay */}
              <AnimatePresence>
                {rejectionVideoId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                      onClick={() => setRejectionVideoId(null)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-panel border-brand-border p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl"
                    >
                      <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-4">
                        Submit Rejection Feedback
                      </h3>
                      <form onSubmit={handleRejectVideo} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-semibold font-mono text-brand-cream/40 uppercase tracking-widest">
                            Reason for Rejection
                          </label>
                          <textarea
                            value={rejectionReasonInput}
                            onChange={(e) => setRejectionReasonInput(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-xs focus:outline-none focus:border-brand transition-all resize-none"
                            placeholder="Please specify why this video does not meet guidelines (e.g. poor audio quality, wrong syllabus unit mapping, etc.)"
                            required
                          />
                        </div>
                        <div className="flex gap-3 justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => setRejectionVideoId(null)}
                            className="px-4 py-2 rounded-xl border border-brand-border hover:bg-brand-gray text-[9px] font-mono font-bold uppercase tracking-widest text-brand-cream transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-mono font-bold uppercase tracking-widest shadow-md transition-colors disabled:opacity-50"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </main>
      </div>

      {/* ═══ MODAL: ADD / EDIT NOTE ═══ */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel border-brand-border p-6 md:p-8 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-bold font-bebas tracking-wider mb-6">
                {editingNoteId ? 'Edit' : 'Add'} <span className="text-brand">Note</span>
              </h3>
              
              <form onSubmit={handleNoteSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Subject Title</label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                    placeholder="e.g. General Pharmacology"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Semester</label>
                    <select
                      value={noteForm.sem}
                      onChange={e => setNoteForm({ ...noteForm, sem: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                      required
                    >
                      <option value="">Select...</option>
                      <option>Sem 1</option><option>Sem 2</option><option>Sem 3</option><option>Sem 4</option>
                      <option>Sem 5</option><option>Sem 6</option><option>Sem 7</option><option>Sem 8</option>
                      <option>Year 1</option><option>Year 2</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Course</label>
                    <select
                      value={noteForm.course}
                      onChange={e => setNoteForm({ ...noteForm, course: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                      required
                    >
                      <option value="">Select...</option>
                      <option>B.Pharm</option><option>D.Pharm</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">PDF URL / File Name</label>
                  <input
                    type="text"
                    value={noteForm.pdfName}
                    onChange={e => setNoteForm({ ...noteForm, pdfName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                    placeholder="e.g. https://example.com/pharmacology_unit1.pdf"
                  />
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-gray text-xs font-bold tracking-wider uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-colors"
                  >
                    {editingNoteId ? 'Save Changes' : 'Add Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL: ADD / EDIT PYQ ═══ */}
      <AnimatePresence>
        {isPyqModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPyqModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel border-brand-border p-6 md:p-8 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-bold font-bebas tracking-wider mb-6">
                {editingPyqId ? 'Edit' : 'Add'} Question <span className="text-brand">Paper</span>
              </h3>
              
              <form onSubmit={handlePyqSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Subject Name</label>
                  <input
                    type="text"
                    value={pyqForm.subject}
                    onChange={e => setPyqForm({ ...pyqForm, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                    placeholder="e.g. Biochemistry"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Semester</label>
                    <select
                      value={pyqForm.sem}
                      onChange={e => setPyqForm({ ...pyqForm, sem: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                      required
                    >
                      <option value="">Select...</option>
                      <option>Sem 1</option><option>Sem 2</option><option>Sem 3</option><option>Sem 4</option>
                      <option>Sem 5</option><option>Sem 6</option><option>Sem 7</option><option>Sem 8</option>
                      <option>Year 1</option><option>Year 2</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Course</label>
                    <select
                      value={pyqForm.course}
                      onChange={e => setPyqForm({ ...pyqForm, course: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                      required
                    >
                      <option value="">Select...</option>
                      <option>B.Pharm</option><option>D.Pharm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Session</label>
                    <select
                      value={pyqForm.session}
                      onChange={e => setPyqForm({ ...pyqForm, session: e.target.value as 'Aug-Sep' | 'Nov-Dec' })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                      required
                    >
                      <option value="">Select...</option>
                      <option>Aug-Sep</option>
                      <option>Nov-Dec</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-brand-cream/40 uppercase tracking-widest font-mono">Year</label>
                    <select
                      value={pyqForm.year}
                      onChange={e => setPyqForm({ ...pyqForm, year: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-gray border border-brand-border text-brand-cream text-sm focus:outline-none focus:border-brand transition-all"
                      required
                    >
                      <option value="">Select...</option>
                      <option>2029</option><option>2028</option><option>2027</option>
                      <option>2026</option><option>2025</option><option>2024</option>
                      <option>2023</option><option>2022</option><option>2021</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsPyqModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-brand-border hover:bg-brand-gray text-xs font-bold tracking-wider uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-brand-charcoal font-bold text-xs tracking-wider uppercase transition-colors"
                  >
                    {editingPyqId ? 'Save Changes' : 'Add Paper'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
