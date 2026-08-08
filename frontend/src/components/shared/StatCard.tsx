import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brand",
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "brand" | "accent" | "neutral";
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-surface-400">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
          {hint && <p className="mt-1 text-xs text-surface-400">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent === "brand" && "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
            accent === "accent" && "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300",
            accent === "neutral" && "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
