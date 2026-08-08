import { api } from "./client";
import type { AppNotification } from "@/types";

export async function listNotifications() {
  const res = await api.get("/notifications");
  return res.data.data as { notifications: AppNotification[]; unreadCount: number };
}

export async function markRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead() {
  await api.patch(`/notifications/read-all`);
}
