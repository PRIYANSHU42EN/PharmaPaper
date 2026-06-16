"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, ShieldAlert, CreditCard, Activity, Trash2, Edit3, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/v1/admin/users/${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleRoleChange = async (newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({ ...prev, user: { ...prev.user, role: newRole } }));
      } else {
        alert(json.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating role");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to soft-delete this user? This cannot be easily undone.")) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/users");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.user) return <div className="text-red-400 font-mono">User not found</div>;

  const { user, payments, logs } = data;
  const profile = user.profiles?.[0] || {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Actions */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/users" className="p-2 bg-surface hover:bg-surface-2 rounded-lg text-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-white tracking-wide flex items-center gap-3">
            {user.name}
            {profile.deleted_at && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase tracking-wider font-mono">Deleted</span>}
          </h1>
          <p className="text-muted font-mono text-sm mt-1">{user.email} • ID: {user.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={user.role} 
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={updating}
            className="bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light appearance-none font-mono cursor-pointer"
          >
            <option value="user">Role: User</option>
            <option value="lecturer">Role: Lecturer</option>
            <option value="admin">Role: Admin</option>
          </select>
          <button 
            onClick={handleDelete}
            disabled={updating}
            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-2 font-mono text-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile */}
        <div className="space-y-6">
          <div className="liquid-glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-6 flex items-center gap-2">
              <User className="w-4 h-4" /> Profile Details
            </h3>
            <div className="flex items-center gap-4 mb-6">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-16 h-16 rounded-full object-cover border-2 border-brand/30" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface border-2 border-white/10 flex items-center justify-center text-xl text-muted font-mono">
                  {user.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="text-white font-medium">{user.name}</div>
                <div className="text-sm text-slate-400 font-mono">Joined {new Date(user.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between pb-3 border-b border-white/5">
                <span className="text-slate-500">Course</span>
                <span className="text-white">{profile.course || '-'}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/5">
                <span className="text-slate-500">Semester</span>
                <span className="text-white">{profile.semester || '-'}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-white/5">
                <span className="text-slate-500">Public Profile</span>
                <span className="text-white">{profile.is_public ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payments & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="liquid-glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment History
            </h3>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500 font-mono">No payments found.</p>
            ) : (
              <table className="w-full text-left text-sm font-mono">
                <thead className="text-slate-500 text-xs">
                  <tr>
                    <th className="pb-3 font-normal">Plan</th>
                    <th className="pb-3 font-normal">Amount</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-3 text-white">{p.plan_type}</td>
                      <td className="py-3 text-white">₹{p.amount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider ${p.status === 'captured' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-500'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="liquid-glass rounded-xl p-6 border border-white/5">
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Audit Logs
            </h3>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500 font-mono">No audit logs found.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex gap-4 items-start p-3 bg-surface/30 rounded-lg border border-white/5">
                    <Activity className="w-4 h-4 text-brand-light mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{log.action}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">By {log.performed_by} at {new Date(log.created_at).toLocaleString()}</div>
                      {log.details && (
                        <pre className="mt-2 p-2 bg-black/30 rounded text-[10px] font-mono text-slate-300 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
