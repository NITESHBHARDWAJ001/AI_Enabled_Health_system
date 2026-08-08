import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium gap-1", {
  variants: {
    variant: {
      default: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300",
      accent: "bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-300",
      neutral: "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300",
      success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
      warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
      danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      outline: "border border-surface-300 dark:border-surface-700 text-surface-600 dark:text-surface-300",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
