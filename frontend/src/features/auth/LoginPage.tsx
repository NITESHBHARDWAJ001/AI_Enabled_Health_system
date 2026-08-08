import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import * as authApi from "@/api/auth";
import { extractErrorMessage } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { roleHome } from "@/components/shared/ProtectedRoute";
import { toast } from "@/store/toastStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await authApi.login(email, password);
      setSession(session);
      toast({ title: `Welcome back, ${session.user.email.split("@")[0]}`, variant: "success" });
      navigate(roleHome(session.user.role), { replace: true });
    } catch (err) {
      toast({ title: "Couldn't sign in", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">Welcome back</h2>
        <p className="mt-1.5 text-sm text-surface-500">Sign in to continue to your health record.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : <LogIn className="h-4 w-4" />}
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-500">
          New patient?{" "}
          <Link to="/register" className="font-medium text-brand-700 dark:text-brand-300 hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-3.5 text-xs text-surface-500">
          <p className="font-medium text-surface-600 dark:text-surface-300">Demo accounts (password: Password123!)</p>
          <p className="mt-1">patient@hop.dev · dr.sharma@hop.dev · admin@hop.dev</p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
