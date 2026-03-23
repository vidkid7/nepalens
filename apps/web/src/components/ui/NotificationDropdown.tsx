"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "like" | "follow" | "download" | "system";
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

interface NotificationDropdownProps {
  transparent?: boolean;
}

export default function NotificationDropdown({ transparent }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
    setLoading(false);
  };

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const iconForType = (type: string) => {
    switch (type) {
      case "like":
        return "❤️";
      case "follow":
        return "👤";
      case "download":
        return "⬇️";
      default:
        return "🔔";
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className={`btn-icon rounded-lg transition-colors relative ${
          transparent
            ? "text-white/80 hover:bg-white/10"
            : "text-surface-500 hover:bg-surface-100"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  await fetch("/api/internal/notifications/read-all", { method: "POST" }).catch(() => {});
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                className="text-xs text-brand hover:text-brand-600 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-surface-200 border-t-brand rounded-full animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-surface-600">No notifications yet</p>
                <p className="text-xs text-surface-400 mt-1">We&apos;ll notify you when something happens</p>
              </div>
            )}

            {notifications.map((n) => {
              const Wrapper = n.href ? Link : "div";
              const wrapperProps = n.href ? { href: n.href } : {};
              return (
                <Wrapper
                  key={n.id}
                  {...(wrapperProps as any)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-surface-50 transition-colors cursor-pointer ${
                    !n.read ? "bg-brand-50/30" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-base mt-0.5 shrink-0">{iconForType(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-medium text-surface-900" : "text-surface-600"}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />
                  )}
                </Wrapper>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
