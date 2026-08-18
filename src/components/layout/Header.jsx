import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, LogOut, User, Bell, BellDot, Calendar, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_LABELS } from "../../lib/constants";
import { notificationsApi } from "../../lib/db";
import Logo from "../common/Logo";

function timeAgo(isoString) {
  if (!isoString) return "-";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function Header() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const loadNotifications = useCallback(() => {
    notificationsApi
      .list(20)
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, []);

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationsApi.subscribe(() => loadNotifications());
    return unsubscribe;
  }, [loadNotifications]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open || notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, notificationsOpen]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (item) => {
    if (item.is_read) return;
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    try {
      await notificationsApi.markRead(item.id, user?.id);
    } catch {
      loadNotifications();
    }
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-surface-border flex items-center justify-between px-5 sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <Logo width={120} height={34} className="object-contain" />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gray-100 border border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide leading-none">Tanggal</p>
              <p className="text-[12px] font-bold text-gray-600">{currentDateTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="w-px h-7 bg-gray-300" />
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide leading-none">Waktu</p>
              <p className="text-sm font-bold text-gray-600 font-mono">{currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
            </div>
          </div>
        </div>

        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((value) => !value)}
            className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-panel transition-colors"
            aria-label="Notifikasi"
          >
            {unreadCount > 0 ? <BellDot size={18} className="text-ink-700" /> : <Bell size={18} className="text-ink-700" />}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-status-red text-[10px] font-semibold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-surface-border shadow-card z-40">
              <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
                <p className="text-sm font-semibold text-ink-900">Notifikasi</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-primary hover:text-primary-700"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs && <p className="text-xs text-ink-500 text-center py-6">Memuat...</p>}
                {!loadingNotifs && notifications.length === 0 && (
                  <p className="text-xs text-ink-500 text-center py-6">Belum ada notifikasi.</p>
                )}
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className="w-full text-left px-3 py-2 border-b border-surface-border last:border-b-0 hover:bg-surface-panel"
                  >
                    <div className="flex gap-2">
                      <span className={`mt-1.5 w-2 h-2 rounded-full ${!item.is_read ? "bg-primary" : "bg-surface-border"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900">{item.title}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{item.message}</p>
                        <p className="text-[11px] text-ink-300 mt-1">{timeAgo(item.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-surface-panel transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-ink-900 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-ink-500 leading-tight">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-ink-500" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-surface-border shadow-card py-1 z-40">
              <button
                onClick={signOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-700 hover:bg-surface-panel"
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
