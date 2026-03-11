import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  Bell,
  CalendarCheck,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuthSession } from "../App";
import { Role } from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useLoginVolunteer, useRegisterVolunteer } from "../hooks/useQueries";

interface Props {
  onLogin: (session: AuthSession) => void;
}

type AuthMode = "choice" | "volunteer" | "coordinator" | "admin";

function PasswordInput({
  id,
  dataOcid,
  placeholder,
  value,
  onChange,
  onKeyDown,
  className,
}: {
  id?: string;
  dataOcid?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        data-ocid={dataOcid}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`pr-10 ${className ?? ""}`}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function LandingPage({ onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode>("choice");
  const [volunteerTab, setVolunteerTab] = useState<"login" | "register">(
    "login",
  );

  // Volunteer login
  const [vEmail, setVEmail] = useState("");

  // Volunteer register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRoll, setRegRoll] = useState("");
  const [regDept, setRegDept] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Volunteer login password
  const [vPassword, setVPassword] = useState("");

  // Volunteer register password
  const [regPassword, setRegPassword] = useState("");

  // Coordinator login password
  const [cPassword, setCPassword] = useState("");

  // Coordinator login
  const [cEmail, setCEmail] = useState("");

  // Admin login
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminRetryStatus, setAdminRetryStatus] = useState("");
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [coordinatorRetryStatus, setCoordinatorRetryStatus] = useState("");

  const { actor } = useActor();
  const loginVolunteer = useLoginVolunteer();
  const registerVolunteer = useRegisterVolunteer();

  const handleVolunteerLogin = async () => {
    if (!vEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!vPassword.trim()) {
      toast.error("Please enter your password");
      return;
    }
    try {
      const result = await loginVolunteer.mutateAsync({
        email: vEmail.trim(),
        password: vPassword.trim(),
      });
      if (!result) {
        toast.error(
          "Invalid email or password. Please check your credentials.",
        );
        return;
      }
      // Save user profile
      if (actor) {
        await actor
          .saveCallerUserProfile({
            userId: result.id,
            name: result.name,
            role: Role.volunteer,
            email: result.email,
          })
          .catch(() => {});
      }
      toast.success(`Welcome back, ${result.name}!`);
      onLogin({
        role: "volunteer",
        id: result.id,
        email: result.email,
        name: result.name,
      });
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleVolunteerRegister = async () => {
    if (
      !regName.trim() ||
      !regEmail.trim() ||
      !regRoll.trim() ||
      !regDept.trim() ||
      !regPhone.trim() ||
      !regPassword.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }
    if (regPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      const result = await registerVolunteer.mutateAsync({
        name: regName.trim(),
        email: regEmail.trim(),
        rollNumber: regRoll.trim(),
        department: regDept.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
      });
      if (actor) {
        await actor
          .saveCallerUserProfile({
            userId: result.id,
            name: result.name,
            role: Role.volunteer,
            email: result.email,
          })
          .catch(() => {});
      }
      toast.success(`Welcome to INSARK, ${result.name}!`);
      onLogin({
        role: "volunteer",
        id: result.id,
        email: result.email,
        name: result.name,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(
        msg.includes("already")
          ? "Email already registered. Please login."
          : msg,
      );
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      toast.error("Please enter the admin password");
      return;
    }
    setAdminLoading(true);
    const maxRetries = 8;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    // Create actor once and reuse across retries
    let adminActor: Awaited<ReturnType<typeof createActorWithConfig>> | null =
      null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setAdminRetryStatus(
        attempt === 1
          ? "Connecting to server..."
          : `Retrying... (${attempt}/${maxRetries})`,
      );
      try {
        if (!adminActor) adminActor = await createActorWithConfig();
        const result = await adminActor.adminLogin(adminPassword);
        if (result === false) {
          setAdminRetryStatus("");
          toast.error("Incorrect password. Access denied.");
          setAdminLoading(false);
          return;
        }
        setAdminRetryStatus("");
        toast.success("Welcome, Administrator!");
        onLogin({
          role: "admin",
          id: "",
          email: "",
          name: "Admin",
          adminPassword: adminPassword,
        });
        setAdminLoading(false);
        return;
      } catch (e) {
        console.error(`Admin login attempt ${attempt} failed:`, e);
        adminActor = null; // reset on error so next attempt gets a fresh connection
        if (attempt < maxRetries) {
          await delay(2000);
        } else {
          setAdminRetryStatus("");
          toast.error(
            "Unable to reach the server. Please try again in a moment.",
          );
          setAdminLoading(false);
        }
      }
    }
  };

  const handleCoordinatorLogin = async () => {
    if (!cEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!cPassword.trim()) {
      toast.error("Please enter your password");
      return;
    }
    setCoordinatorLoading(true);
    setCoordinatorRetryStatus("Connecting to server...");
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const maxRetries = 4;
    // Create actor once and reuse -- avoids repeated connection overhead
    let coordActor: Awaited<ReturnType<typeof createActorWithConfig>> | null =
      null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        setCoordinatorRetryStatus(`Retrying... (${attempt}/${maxRetries})`);
      }
      try {
        if (!coordActor) coordActor = await createActorWithConfig();
        const result = await coordActor.loginCoordinator(
          cEmail.trim(),
          cPassword.trim(),
        );
        setCoordinatorRetryStatus("");
        setCoordinatorLoading(false);
        if (!result) {
          toast.error(
            "Invalid email or password. Please check your credentials.",
          );
          return;
        }
        if (actor) {
          await actor
            .saveCallerUserProfile({
              userId: result.id,
              name: result.name,
              role: Role.coordinator,
              email: result.email,
            })
            .catch(() => {});
        }
        toast.success(`Welcome, ${result.name}!`);
        onLogin({
          role: "coordinator",
          id: result.id,
          email: result.email,
          name: result.name,
        });
        return;
      } catch (e) {
        console.error(`Coordinator login attempt ${attempt} failed:`, e);
        coordActor = null; // reset on error
        if (attempt < maxRetries) {
          await delay(1000);
        } else {
          setCoordinatorRetryStatus("");
          setCoordinatorLoading(false);
          toast.error(
            "Unable to reach the server. Please try again in a moment.",
          );
        }
      }
    }
  };

  const features = [
    {
      icon: CalendarCheck,
      label: "Event Management",
      desc: "Create and manage NSS events",
    },
    {
      icon: Users,
      label: "Volunteer Tracking",
      desc: "Monitor engagement and hours",
    },
    { icon: Award, label: "Certificates", desc: "Issue service certificates" },
    { icon: Bell, label: "Notifications", desc: "Real-time announcements" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.2 0.07 152) 0%, oklch(0.28 0.09 155) 50%, oklch(0.24 0.06 145) 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('/assets/generated/hero-bg.dim_1400x600.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "oklch(0.78 0.14 85)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: "oklch(0.78 0.14 85)" }}
        />

        <div className="relative z-10 container mx-auto px-6 py-12 min-h-screen flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-16"
          >
            <img
              src="/assets/generated/insark-logo-transparent.dim_200x200.png"
              alt="INSARK Logo"
              className="w-14 h-14 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                INSARK
              </h1>
              <p
                className="text-sm font-body"
                style={{ color: "oklch(0.78 0.14 85)" }}
              >
                National Service Scheme Management
              </p>
            </div>
          </motion.div>

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Hero text */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-white"
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-body font-medium mb-6"
                  style={{
                    background: "oklch(0.78 0.14 85 / 0.2)",
                    color: "oklch(0.88 0.12 85)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Digital NSS Platform
                </div>

                <h2 className="text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
                  Serve, Connect,{" "}
                  <span style={{ color: "oklch(0.88 0.12 85)" }}>Grow.</span>
                </h2>

                <p className="text-lg font-body leading-relaxed mb-8 opacity-80">
                  A comprehensive platform streamlining National Service Scheme
                  activities — from volunteer registration to event management,
                  attendance tracking, and service hour certificates.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3">
                  {features.map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: "oklch(1 0 0 / 0.07)" }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ background: "oklch(0.78 0.14 85 / 0.25)" }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: "oklch(0.88 0.12 85)" }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-display font-semibold">
                          {label}
                        </div>
                        <div className="text-xs opacity-60 font-body">
                          {desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right: Auth card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {mode === "choice" && (
                    <motion.div
                      key="choice"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className="shadow-2xl border-0"
                        style={{ background: "oklch(0.98 0.004 90)" }}
                      >
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="text-2xl font-display">
                            Welcome Back
                          </CardTitle>
                          <CardDescription className="font-body">
                            Sign in to access your INSARK dashboard
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                          <button
                            type="button"
                            data-ocid="auth.volunteer_login_button"
                            onClick={() => setMode("volunteer")}
                            className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md group"
                            style={{
                              borderColor: "oklch(0.32 0.09 152 / 0.3)",
                              background: "oklch(0.92 0.03 145)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                  background: "oklch(0.32 0.09 152 / 0.15)",
                                }}
                              >
                                <Users
                                  className="w-5 h-5"
                                  style={{ color: "oklch(0.32 0.09 152)" }}
                                />
                              </div>
                              <div className="text-left">
                                <div className="font-display font-semibold text-foreground">
                                  Volunteer Login
                                </div>
                                <div className="text-xs text-muted-foreground font-body">
                                  Access volunteer dashboard
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </button>

                          <button
                            type="button"
                            data-ocid="auth.coordinator_login_button"
                            onClick={() => setMode("coordinator")}
                            className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md group"
                            style={{
                              borderColor: "oklch(0.78 0.14 85 / 0.4)",
                              background: "oklch(0.96 0.04 90)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                  background: "oklch(0.78 0.14 85 / 0.2)",
                                }}
                              >
                                <Shield
                                  className="w-5 h-5"
                                  style={{ color: "oklch(0.55 0.12 60)" }}
                                />
                              </div>
                              <div className="text-left">
                                <div className="font-display font-semibold text-foreground">
                                  Coordinator Login
                                </div>
                                <div className="text-xs text-muted-foreground font-body">
                                  Manage NSS activities
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </button>

                          <p className="text-center text-xs text-muted-foreground font-body pt-2">
                            New volunteer?{" "}
                            <button
                              type="button"
                              className="underline font-medium"
                              style={{ color: "oklch(0.32 0.09 152)" }}
                              onClick={() => {
                                setMode("volunteer");
                                setVolunteerTab("register");
                              }}
                            >
                              Register here
                            </button>
                          </p>

                          <p className="text-center pt-1">
                            <button
                              type="button"
                              data-ocid="auth.admin_link"
                              className="text-xs font-body transition-opacity"
                              style={{ color: "oklch(0.55 0.04 140)" }}
                              onClick={() => setMode("admin")}
                            >
                              System Admin
                            </button>
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {mode === "volunteer" && (
                    <motion.div
                      key="volunteer"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className="shadow-2xl border-0"
                        style={{ background: "oklch(0.98 0.004 90)" }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => setMode("choice")}
                              className="text-muted-foreground hover:text-foreground text-sm font-body underline"
                            >
                              ← Back
                            </button>
                          </div>
                          <CardTitle className="text-xl font-display">
                            Volunteer Portal
                          </CardTitle>
                          <CardDescription className="font-body">
                            Login or register as a volunteer
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs
                            value={volunteerTab}
                            onValueChange={(v) =>
                              setVolunteerTab(v as "login" | "register")
                            }
                          >
                            <TabsList className="w-full mb-4">
                              <TabsTrigger
                                value="login"
                                className="flex-1 font-body"
                              >
                                Login
                              </TabsTrigger>
                              <TabsTrigger
                                value="register"
                                className="flex-1 font-body"
                              >
                                Register
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent
                              value="login"
                              className="space-y-3 mt-0"
                            >
                              <div>
                                <Label
                                  htmlFor="v-email"
                                  className="font-body text-sm"
                                >
                                  Email Address
                                </Label>
                                <Input
                                  id="v-email"
                                  data-ocid="auth.volunteer.input"
                                  type="email"
                                  placeholder="your@email.com"
                                  value={vEmail}
                                  onChange={(e) => setVEmail(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleVolunteerLogin()
                                  }
                                  className="mt-1 font-body"
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor="v-password"
                                  className="font-body text-sm"
                                >
                                  Password
                                </Label>
                                <PasswordInput
                                  id="v-password"
                                  dataOcid="auth.volunteer.password_input"
                                  placeholder="Enter your password"
                                  value={vPassword}
                                  onChange={(e) => setVPassword(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleVolunteerLogin()
                                  }
                                  className="mt-1 font-body"
                                />
                              </div>
                              <Button
                                data-ocid="auth.volunteer.submit_button"
                                className="w-full font-body"
                                onClick={handleVolunteerLogin}
                                disabled={loginVolunteer.isPending}
                                style={{ background: "oklch(0.32 0.09 152)" }}
                              >
                                {loginVolunteer.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In as Volunteer
                              </Button>
                            </TabsContent>

                            <TabsContent
                              value="register"
                              className="space-y-3 mt-0"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="font-body text-sm">
                                    Full Name
                                  </Label>
                                  <Input
                                    data-ocid="auth.register.name_input"
                                    placeholder="Full name"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    className="mt-1 font-body"
                                  />
                                </div>
                                <div>
                                  <Label className="font-body text-sm">
                                    Roll Number
                                  </Label>
                                  <Input
                                    data-ocid="auth.register.roll_input"
                                    placeholder="e.g. CS21B001"
                                    value={regRoll}
                                    onChange={(e) => setRegRoll(e.target.value)}
                                    className="mt-1 font-body"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="font-body text-sm">
                                  Email Address
                                </Label>
                                <Input
                                  data-ocid="auth.register.email_input"
                                  type="email"
                                  placeholder="your@email.com"
                                  value={regEmail}
                                  onChange={(e) => setRegEmail(e.target.value)}
                                  className="mt-1 font-body"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="font-body text-sm">
                                    Department
                                  </Label>
                                  <Input
                                    data-ocid="auth.register.dept_input"
                                    placeholder="e.g. Computer Science"
                                    value={regDept}
                                    onChange={(e) => setRegDept(e.target.value)}
                                    className="mt-1 font-body"
                                  />
                                </div>
                                <div>
                                  <Label className="font-body text-sm">
                                    Phone
                                  </Label>
                                  <Input
                                    data-ocid="auth.register.phone_input"
                                    placeholder="+91 9876543210"
                                    value={regPhone}
                                    onChange={(e) =>
                                      setRegPhone(e.target.value)
                                    }
                                    className="mt-1 font-body"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="font-body text-sm">
                                  Password
                                </Label>
                                <PasswordInput
                                  dataOcid="auth.register.password_input"
                                  placeholder="Min 6 characters"
                                  value={regPassword}
                                  onChange={(e) =>
                                    setRegPassword(e.target.value)
                                  }
                                  className="mt-1 font-body"
                                />
                              </div>
                              <Button
                                data-ocid="auth.register_button"
                                className="w-full font-body"
                                onClick={handleVolunteerRegister}
                                disabled={registerVolunteer.isPending}
                                style={{ background: "oklch(0.32 0.09 152)" }}
                              >
                                {registerVolunteer.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Register as Volunteer
                              </Button>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {mode === "coordinator" && (
                    <motion.div
                      key="coordinator"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className="shadow-2xl border-0"
                        style={{ background: "oklch(0.98 0.004 90)" }}
                      >
                        <CardHeader className="pb-2">
                          <button
                            type="button"
                            onClick={() => setMode("choice")}
                            className="text-muted-foreground hover:text-foreground text-sm font-body underline w-fit mb-1"
                          >
                            ← Back
                          </button>
                          <CardTitle className="text-xl font-display">
                            Coordinator Portal
                          </CardTitle>
                          <CardDescription className="font-body">
                            Sign in to manage NSS activities
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label
                              htmlFor="c-email"
                              className="font-body text-sm"
                            >
                              Coordinator Email
                            </Label>
                            <Input
                              id="c-email"
                              data-ocid="auth.coordinator.input"
                              type="email"
                              placeholder="coordinator@institution.edu"
                              value={cEmail}
                              onChange={(e) => setCEmail(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleCoordinatorLogin()
                              }
                              className="mt-1 font-body"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="c-password"
                              className="font-body text-sm"
                            >
                              Password
                            </Label>
                            <PasswordInput
                              id="c-password"
                              dataOcid="auth.coordinator.password_input"
                              placeholder="Enter your password"
                              value={cPassword}
                              onChange={(e) => setCPassword(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleCoordinatorLogin()
                              }
                              className="mt-1 font-body"
                            />
                          </div>
                          <Button
                            data-ocid="auth.coordinator.submit_button"
                            className="w-full font-body"
                            onClick={handleCoordinatorLogin}
                            disabled={coordinatorLoading}
                            style={{ background: "oklch(0.45 0.11 60)" }}
                          >
                            {coordinatorLoading && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In as Coordinator
                          </Button>

                          {coordinatorRetryStatus && (
                            <p className="text-xs text-center text-muted-foreground animate-pulse">
                              {coordinatorRetryStatus}
                            </p>
                          )}

                          <div
                            className="p-3 rounded-lg text-xs text-center font-body"
                            style={{
                              background: "oklch(0.96 0.04 90)",
                              color: "oklch(0.4 0.05 70)",
                            }}
                          >
                            Coordinator accounts are created by the system
                            administrator. Contact your NSS program officer for
                            access.
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {mode === "admin" && (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className="shadow-2xl border-0"
                        style={{ background: "oklch(0.98 0.004 90)" }}
                      >
                        <CardHeader className="pb-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMode("choice");
                              setAdminPassword("");
                              setAdminRetryStatus("");
                            }}
                            className="text-muted-foreground hover:text-foreground text-sm font-body underline w-fit mb-1"
                          >
                            ← Back
                          </button>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "oklch(0.18 0.07 152)" }}
                            >
                              <Shield className="w-4 h-4 text-white" />
                            </div>
                            <CardTitle className="text-xl font-display">
                              Admin Portal
                            </CardTitle>
                          </div>
                          <CardDescription className="font-body">
                            Restricted access — administrators only
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label
                              htmlFor="admin-password"
                              className="font-body text-sm"
                            >
                              Admin Password
                            </Label>
                            <PasswordInput
                              id="admin-password"
                              dataOcid="auth.admin.input"
                              placeholder="Enter admin password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleAdminLogin()
                              }
                              className="mt-1 font-body"
                            />
                          </div>
                          <Button
                            data-ocid="auth.admin.submit_button"
                            className="w-full font-body text-white"
                            onClick={handleAdminLogin}
                            disabled={adminLoading}
                            style={{ background: "oklch(0.22 0.08 152)" }}
                          >
                            {adminLoading && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In as Admin
                          </Button>
                          {adminRetryStatus && (
                            <p className="text-center text-xs font-body text-muted-foreground animate-pulse">
                              {adminRetryStatus}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
