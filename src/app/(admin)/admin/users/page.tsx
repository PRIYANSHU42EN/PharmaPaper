"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, MoreVertical, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">User Management</h1>
          <p className="text-muted font-mono text-sm mt-1">Manage accounts, roles, and access</p>
        </div>
      </div>

      <div className="liquid-glass rounded-xl border border-white/5 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-surface/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light appearance-none font-mono cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="liquid-glass rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-[#003554]/50 text-muted uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Course/Sem</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-brand-light border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profiles?.[0]?.avatar_url ? (
                          <img src={user.profiles[0].avatar_url} className="w-8 h-8 rounded-full border border-white/10 object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs text-muted">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white group-hover:text-brand-light transition-colors">{user.name || "Unknown"}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs border ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        user.role === 'lecturer' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-brand/10 text-brand-light border-brand/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {user.profiles?.[0]?.course ? `${user.profiles[0].course} - Sem ${user.profiles[0].semester}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/users/${user.id}`}
                        className="p-2 text-muted hover:text-white hover:bg-surface rounded transition-colors inline-block"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
