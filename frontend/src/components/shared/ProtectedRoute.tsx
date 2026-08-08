import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

export function roleHome(role: Role) {
  if (role === "PATIENT") return "/patient/dashboard";
  if (role === "DOCTOR") return "/doctor/dashboard";
  return "/admin/dashboard";
}

export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user, accessToken } = useAuthStore();

  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;

  return <Outlet />;
}
