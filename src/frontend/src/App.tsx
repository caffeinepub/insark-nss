import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { createActorWithConfig } from "./config";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import { getSecretParameter } from "./utils/urlParams";

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

// Silently re-establishes the backend session (role assignment) after page
// reload or canister upgrade when the frontend already has a stored session.
async function silentReAuth(session: AuthSession): Promise<void> {
  try {
    if (session.role === "admin") return;
    const actor = await createActorWithConfig();
    const adminToken = getSecretParameter("caffeineAdminToken") || "";
    await actor._initializeAccessControlWithSecret(adminToken);
    if (session.role === "volunteer") {
      await actor.loginVolunteer(session.email, "");
    } else if (session.role === "coordinator") {
      await actor.loginCoordinator(session.email, "");
    }
  } catch {
    // Silent -- do not break the app if re-auth fails
  }
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initialized, setInitialized] = useState(false);
  const reAuthed = useRef(false);

  useEffect(() => {
    const stored = getSession();
    setSession(stored);
    setInitialized(true);
  }, []);

  // Silently re-login to backend on startup to re-establish roles lost after redeployment.
  useEffect(() => {
    if (!initialized || !session || reAuthed.current) return;
    reAuthed.current = true;
    silentReAuth(session);
  }, [initialized, session]);

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
    reAuthed.current = false;
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    reAuthed.current = false;
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
