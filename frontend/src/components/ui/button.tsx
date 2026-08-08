import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-brand-700 text-white shadow-[var(--shadow-soft)] hover:bg-brand-600",
        accent: "bg-accent-500 text-white shadow-[var(--shadow-soft)] hover:bg-accent-600",
        outline:
          "border border-surface-300 dark:border-surface-700 bg-transparent hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-800 dark:text-surface-100",
        ghost: "hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "text-brand-700 dark:text-brand-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
