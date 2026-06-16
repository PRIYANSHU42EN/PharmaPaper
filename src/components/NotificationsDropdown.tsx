"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { Bell, Check, Trash2, X } from "lucide-react";
import Link from "next/link";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsDropdown() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/v1/notifications");
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? (payload.new as Notification) : n)
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await fetch("/api/v1/notifications/read", { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.is_read) return;

    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`/api/v1/notifications/${id}`, { method: "PATCH" });
    } catch (err) {
      console.error(`Failed to mark ${id} as read`, err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/v1/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(`Failed to delete ${id}`, err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) {
        const mins = Math.floor(diff / 60000);
        return mins <= 1 ? "Just now" : `${mins}m ago`;
      }
      return `${hours}h ago`;
    }
    
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-full transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-light rounded-full shadow-[0_0_8px_var(--brand-light)] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 liquid-glass-strong rounded-xl shadow-2xl border border-border overflow-hidden z-50 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/50">
            <h3 className="font-heading font-medium text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand/20 text-brand-light">
                  {unreadCount} NEW
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="p-1.5 text-xs font-mono text-muted hover:text-brand-light hover:bg-white/5 rounded transition"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted hover:text-white hover:bg-white/5 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-pulse-dot w-2 h-2 bg-brand-light rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted font-mono text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => {
                  const content = (
                    <div 
                      className={`p-4 border-b border-white/5 hover:bg-white/5 transition flex items-start gap-3 cursor-pointer ${!n.is_read ? 'bg-brand/5' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-medium truncate pr-4 ${!n.is_read ? 'text-brand-light' : 'text-text'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] font-mono text-muted shrink-0 mt-0.5">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                        {n.message && (
                          <p className="text-xs text-text-secondary line-clamp-2">
                            {n.message}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="p-1.5 text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );

                  return n.link ? (
                    <Link href={n.link} key={n.id} className="group block" onClick={() => markAsRead(n.id)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id} className="group block">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2 border-t border-white/5 bg-surface/80 text-center">
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono text-muted hover:text-brand-light transition"
            >
              Notification Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
