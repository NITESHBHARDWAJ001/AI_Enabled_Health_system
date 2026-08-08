import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, CalendarClock, Pill, ClipboardList, ShieldAlert, Info } from "lucide-react";
import * as notificationsApi from "@/api/notifications";
import type { AppNotification, NotificationType } from "@/types";
import { timeAgo } from "@/lib/formatters";
import { cn } from "@/lib/cn";

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  APPOINTMENT_CREATED: CalendarClock,
  APPOINTMENT_STATUS_CHANGED: CalendarClock,
  PRESCRIPTION_CREATED: Pill,
  DIAGNOSIS_CREATED: ClipboardList,
  INFECTION_ALERT: ShieldAlert,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.listNotifications,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      await notificationsApi.markRead(n.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 dark:text-surface-300"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="absolute right-0 z-50 mt-2 max-h-[28rem] w-80 overflow-y-auto scrollbar-thin rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-[var(--shadow-lifted)]"
            >
              <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-surface-400">
                  <Info className="h-5 w-5" />
                  <p className="text-sm">You're all caught up.</p>
                </div>
              )}

              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {notifications.map((n) => {
                  const Icon = ICONS[n.type] ?? Info;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/60",
                        !n.isRead && "bg-brand-50/60 dark:bg-brand-900/10"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          n.type === "INFECTION_ALERT"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !n.isRead ? "font-semibold" : "font-medium text-surface-700 dark:text-surface-300")}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-surface-500">{n.message}</p>
                        <p className="mt-1 text-[11px] text-surface-400">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
