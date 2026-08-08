import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LayoutDashboard, UserRound, History, CalendarClock, FileStack, Stethoscope, Building2, Clock, ShieldAlert } from "lucide-react";
import { PortalLayout, type NavItem } from "@/components/shared/PortalLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Toaster } from "@/components/shared/Toaster";
import { useAuthStore } from "@/store/authStore";
import { roleHome } from "@/components/shared/ProtectedRoute";

import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";

import PatientDashboard from "@/features/patient/PatientDashboard";
import PatientProfile from "@/features/patient/PatientProfile";
import PatientTimeline from "@/features/patient/PatientTimeline";
import PatientAppointments from "@/features/patient/PatientAppointments";
import PatientDocuments from "@/features/patient/PatientDocuments";

import DoctorDashboard from "@/features/doctor/DoctorDashboard";
import DoctorPatientProfile from "@/features/doctor/DoctorPatientProfile";
import ConsultationRoom from "@/features/doctor/ConsultationRoom";
import DoctorAvailability from "@/features/doctor/DoctorAvailability";

import AdminDashboard from "@/features/admin/AdminDashboard";
import AdminDoctors from "@/features/admin/AdminDoctors";
import AdminAlerts from "@/features/admin/AdminAlerts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const patientNav: NavItem[] = [
  { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/patient/timeline", label: "Medical Timeline", icon: History },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/patient/documents", label: "Documents", icon: FileStack },
  { to: "/patient/profile", label: "Profile", icon: UserRound },
];

const doctorNav: NavItem[] = [
  { to: "/doctor/dashboard", label: "Today's Queue", icon: LayoutDashboard, end: true },
  { to: "/doctor/availability", label: "Availability", icon: Clock },
];

const adminNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Overview", icon: Building2, end: true },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/admin/alerts", label: "Infection Alerts", icon: ShieldAlert },
];

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(user.role)} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute allow={["PATIENT"]} />}>
            <Route element={<PortalLayout navItems={patientNav} portalLabel="Patient Portal" />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/timeline" element={<PatientTimeline />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/documents" element={<PatientDocuments />} />
              <Route path="/patient/profile" element={<PatientProfile />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allow={["DOCTOR"]} />}>
            <Route element={<PortalLayout navItems={doctorNav} portalLabel="Doctor Portal" />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/availability" element={<DoctorAvailability />} />
              <Route path="/doctor/patients/:patientId" element={<DoctorPatientProfile />} />
            </Route>
            <Route path="/doctor/consultations/:consultationId" element={<ConsultationRoom />} />
          </Route>

          <Route element={<ProtectedRoute allow={["HOSPITAL_ADMIN", "SUPER_ADMIN"]} />}>
            <Route element={<PortalLayout navItems={adminNav} portalLabel="Hospital Admin" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/doctors" element={<AdminDoctors />} />
              <Route path="/admin/alerts" element={<AdminAlerts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
