import { motion } from "framer-motion";
import { Activity, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-white">Sunrise HOP</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-md"
        >
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            One lifetime medical record. Every hospital visit, in one timeline.
          </h1>
          <p className="mt-4 text-brand-100">
            Appointments, prescriptions, reports, and an AI assistant that helps you and your doctor stay on the
            same page — without ever replacing their judgment.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: HeartPulse, text: "A single timeline across every doctor and hospital you visit" },
              { icon: Sparkles, text: "AI-assisted symptom intake, always reviewed by a real doctor" },
              { icon: ShieldCheck, text: "Role-based access, audit trails, and encrypted sessions" },
            ].map((f) => (
              <div key={f.text} className="flex items-start gap-3 text-brand-50">
                <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-300" />
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative text-xs text-brand-200/70">Phase 1 build — Foundation, Core Hospital &amp; AI Assistant</p>
      </div>

      <div className="flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
