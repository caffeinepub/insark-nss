import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";

export type UserRole = "volunteer" | "coordinator" | "admin";

export interface AuthSession {
  role: UserRole;
  id: string;
  email: string;
  name: string;
  adminPassword?: string;
}

const SESSION_KEY = "insark_session";

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getSession();
    setSession(stored);
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-body">
            Loading INSARK...
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = (sess: AuthSession) => {
    saveSession(sess);
    setSession(sess);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return (
      <>
        <LandingPage onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (session.role === "volunteer") {
    return (
      <>
        <VolunteerDashboard session={session} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (session.role === "admin") {
    return (
      <>
        <AdminDashboard
          onLogout={handleLogout}
          adminPassword={session.adminPassword ?? ""}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <CoordinatorDashboard session={session} onLogout={handleLogout} />
      <Toaster position="top-right" />
    </>
  );
}
