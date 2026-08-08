import { cn } from "@/lib/cn";
import { initials } from "@/lib/formatters";

const GRADIENTS = [
  "from-brand-500 to-brand-700",
  "from-accent-400 to-accent-600",
  "from-teal-400 to-emerald-600",
  "from-cyan-500 to-brand-700",
];

function hashToIndex(input: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) % 1000;
  return hash % mod;
}

export function Avatar({ name, className, size = 10 }: { name: string; className?: string; size?: number }) {
  const gradient = GRADIENTS[hashToIndex(name, GRADIENTS.length)];
  return (
    <div
      className={cn(
        `flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-display font-semibold text-white shadow-sm`,
        className
      )}
      style={{ width: `${size * 0.25}rem`, height: `${size * 0.25}rem`, fontSize: `${size * 0.1}rem` }}
    >
      {initials(name) || "?"}
    </div>
  );
}
