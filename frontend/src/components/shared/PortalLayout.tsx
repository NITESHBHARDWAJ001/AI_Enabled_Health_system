import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/cn";
import * as authApi from "@/api/auth";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

export function PortalLayout({ navItems, portalLabel }: { navItems: NavItem[]; portalLabel: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, refreshToken, clear } = useAuthStore();
  const navigate = useNavigate();
  useOfflineSync();

  const displayName = user?.profile && "fullName" in user.profile ? user.profile.fullName : user?.email ?? "";

  async function handleLogout() {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // proceed with local logout regardless
      }
    }
    clear();
    navigate("/login", { replace: true });
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-soft)]">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-sm font-bold leading-tight text-surface-900 dark:text-surface-50">
            Sunrise HOP
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {portalLabel}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                  : "text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-200 dark:border-surface-800 p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <Avatar name={displayName} size={9} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{displayName}</p>
            <p className="truncate text-xs text-surface-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-red-500 dark:hover:bg-surface-800"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <aside className="hidden w-64 shrink-0 border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 lg:block">
        {SidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-surface-950/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-surface-900 lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-surface-100 dark:hover:bg-surface-800">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <p className="font-display text-sm font-bold">Sunrise HOP</p>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Avatar name={displayName} size={8} />
          </div>
        </header>

        <div className="hidden items-center justify-end border-b border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-900/60 px-6 py-2.5 lg:flex">
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
