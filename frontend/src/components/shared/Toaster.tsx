import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/lib/cn";

const ICONS = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant ?? "default"];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 shadow-[var(--shadow-lifted)] bg-white dark:bg-surface-900",
                t.variant === "success" && "border-emerald-200 dark:border-emerald-900",
                t.variant === "error" && "border-red-200 dark:border-red-900",
                t.variant !== "success" && t.variant !== "error" && "border-surface-200 dark:border-surface-800"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  t.variant === "success" && "text-emerald-500",
                  t.variant === "error" && "text-red-500",
                  t.variant !== "success" && t.variant !== "error" && "text-brand-600"
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-surface-500">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-surface-400 hover:text-surface-600">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
