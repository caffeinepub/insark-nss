import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserSquare2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Coordinator, Volunteer } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import {
  useGetAllCoordinatorsAsAdmin,
  useGetAllVolunteersAsAdmin,
} from "../../hooks/useQueries";

interface Props {
  onLogout: () => void;
  adminPassword: string;
}

type AdminPage = "coordinators" | "volunteers" | "settings";

// ── Add Coordinator Dialog ────────────────────────────────────────────────────

function AddCoordinatorDialog({
  onCreated,
  adminPassword,
}: {
  onCreated: (c: Coordinator) => void;
  adminPassword: string;
}) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    if (!actor) {
      toast.error("Service not ready");
      return;
    }
    setLoading(true);
    try {
      const created = await actor.createCoordinatorAsAdmin(
        adminPassword,
        name.trim(),
        email.trim(),
      );
      toast.success(`Coordinator "${created.name}" created successfully`);
      qc.invalidateQueries({ queryKey: ["coordinators"] });
      onCreated(created);
      setName("");
      setEmail("");
      setOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create coordinator";
      toast.error(msg.includes("already") ? "Email already in use" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="admin.coordinator.open_modal_button"
          className="font-body text-white gap-2"
          style={{ background: "oklch(0.32 0.09 152)" }}
        >
          <Plus className="w-4 h-4" />
          Add Coordinator
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="admin.coordinator.dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Add New Coordinator
          </DialogTitle>
          <DialogDescription className="font-body">
            Create a coordinator account for an NSS program officer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="coord-name" className="font-body text-sm">
              Full Name
            </Label>
            <Input
              id="coord-name"
              data-ocid="admin.coordinator.name_input"
              placeholder="e.g. Dr. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 font-body"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div>
            <Label htmlFor="coord-email" className="font-body text-sm">
              Email Address
            </Label>
            <Input
              id="coord-email"
              data-ocid="admin.coordinator.input"
              type="email"
              placeholder="coordinator@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 font-body"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="admin.coordinator.cancel_button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="font-body"
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.coordinator.submit_button"
            onClick={handleSubmit}
            disabled={loading}
            className="font-body text-white"
            style={{ background: "oklch(0.32 0.09 152)" }}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Coordinator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Coordinator Confirm Dialog ─────────────────────────────────────────

function DeleteCoordinatorDialog({
  coordinator,
  onDeleted,
  adminPassword,
}: {
  coordinator: Coordinator;
  onDeleted: () => void;
  adminPassword: string;
}) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!actor) {
      toast.error("Service not ready");
      return;
    }
    setLoading(true);
    try {
      await actor.deleteCoordinatorAsAdmin(adminPassword, coordinator.id);
      toast.success(`Coordinator "${coordinator.name}" removed`);
      qc.invalidateQueries({ queryKey: ["coordinators"] });
      onDeleted();
      setOpen(false);
    } catch {
      toast.error("Failed to delete coordinator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="admin.coordinator.delete_button"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="admin.coordinator.delete_dialog"
        className="sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-destructive">
            Remove Coordinator
          </DialogTitle>
          <DialogDescription className="font-body">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {coordinator.name}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-2">
          <Button
            data-ocid="admin.coordinator.cancel_button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="font-body"
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.coordinator.confirm_button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="font-body"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Coordinators Page ─────────────────────────────────────────────────────────

function CoordinatorsPage({ adminPassword }: { adminPassword: string }) {
  const { data: coordinators = [], isLoading } =
    useGetAllCoordinatorsAsAdmin(adminPassword);

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Coordinators
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            Manage NSS coordinator accounts
          </p>
        </div>
        <AddCoordinatorDialog
          onCreated={() => {}}
          adminPassword={adminPassword}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              data-ocid="admin.coordinators.loading_state"
              className="flex items-center justify-center py-16 gap-3 text-muted-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-body text-sm">Loading coordinators...</span>
            </div>
          ) : coordinators.length === 0 ? (
            <div
              data-ocid="admin.coordinators.empty_state"
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.92 0.03 145)" }}
              >
                <UserSquare2
                  className="w-6 h-6"
                  style={{ color: "oklch(0.32 0.09 152)" }}
                />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-foreground">
                  No coordinators yet
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  Add the first coordinator to get started.
                </p>
              </div>
            </div>
          ) : (
            <Table data-ocid="admin.coordinators.table">
              <TableHeader>
                <TableRow style={{ borderColor: "oklch(var(--border))" }}>
                  <TableHead className="font-display font-semibold pl-6">
                    Name
                  </TableHead>
                  <TableHead className="font-display font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="font-display font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="font-display font-semibold text-right pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coordinators.map((coord: Coordinator, idx: number) => (
                  <TableRow
                    key={coord.id}
                    data-ocid={`admin.coordinators.item.${idx + 1}`}
                    className="hover:bg-muted/30 transition-colors"
                    style={{ borderColor: "oklch(var(--border))" }}
                  >
                    <TableCell className="font-body font-medium pl-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold flex-shrink-0"
                          style={{
                            background: "oklch(0.32 0.09 152 / 0.12)",
                            color: "oklch(0.32 0.09 152)",
                          }}
                        >
                          {coord.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{coord.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-muted-foreground">
                      {coord.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="font-body text-xs"
                        style={{
                          background: "oklch(0.92 0.06 152)",
                          color: "oklch(0.28 0.09 152)",
                          border: "none",
                        }}
                      >
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DeleteCoordinatorDialog
                        coordinator={coord}
                        onDeleted={() => {}}
                        adminPassword={adminPassword}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Volunteers Page ───────────────────────────────────────────────────────────

function VolunteersPage({ adminPassword }: { adminPassword: string }) {
  const { data: volunteers = [], isLoading } =
    useGetAllVolunteersAsAdmin(adminPassword);

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Volunteers
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            All registered NSS volunteers
          </p>
        </div>
        <Badge
          className="font-body"
          style={{
            background: "oklch(0.92 0.03 145)",
            color: "oklch(0.28 0.07 152)",
            border: "none",
          }}
        >
          {volunteers.length} total
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              data-ocid="admin.volunteers.loading_state"
              className="flex items-center justify-center py-16 gap-3 text-muted-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-body text-sm">Loading volunteers...</span>
            </div>
          ) : volunteers.length === 0 ? (
            <div
              data-ocid="admin.volunteers.empty_state"
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.92 0.03 145)" }}
              >
                <Users
                  className="w-6 h-6"
                  style={{ color: "oklch(0.32 0.09 152)" }}
                />
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-foreground">
                  No volunteers registered
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  Volunteers appear here after they register.
                </p>
              </div>
            </div>
          ) : (
            <Table data-ocid="admin.volunteers.table">
              <TableHeader>
                <TableRow style={{ borderColor: "oklch(var(--border))" }}>
                  <TableHead className="font-display font-semibold pl-6">
                    Name
                  </TableHead>
                  <TableHead className="font-display font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="font-display font-semibold">
                    Roll No.
                  </TableHead>
                  <TableHead className="font-display font-semibold">
                    Department
                  </TableHead>
                  <TableHead className="font-display font-semibold text-right pr-6">
                    Total Hours
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteers.map((vol: Volunteer, idx: number) => (
                  <TableRow
                    key={vol.id}
                    data-ocid={`admin.volunteers.item.${idx + 1}`}
                    className="hover:bg-muted/30 transition-colors"
                    style={{ borderColor: "oklch(var(--border))" }}
                  >
                    <TableCell className="font-body font-medium pl-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold flex-shrink-0"
                          style={{
                            background: "oklch(0.38 0.12 152 / 0.12)",
                            color: "oklch(0.38 0.12 152)",
                          }}
                        >
                          {vol.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{vol.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-muted-foreground text-sm">
                      {vol.email}
                    </TableCell>
                    <TableCell className="font-body text-sm">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: "oklch(0.94 0.015 110)",
                          color: "oklch(0.35 0.03 140)",
                        }}
                      >
                        {vol.rollNumber}
                      </span>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      {vol.department}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: "oklch(0.32 0.09 152)" }}
                      >
                        {vol.totalHours.toString()}h
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────

function SettingsPage() {
  const { actor } = useActor();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (!actor) {
      toast.error("Service not ready");
      return;
    }
    setLoading(true);
    try {
      const result = await actor.changeAdminPassword(oldPassword, newPassword);
      if (!result) {
        toast.error("Current password is incorrect");
        return;
      }
      toast.success("Admin password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            Manage admin portal security settings
          </p>
        </div>
      </div>

      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.18 0.07 152)" }}
              >
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">
                  Change Admin Password
                </CardTitle>
                <CardDescription className="font-body text-sm">
                  Update the admin portal access password
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label
                htmlFor="old-password"
                className="font-body text-sm font-medium"
              >
                Current Password
              </Label>
              <Input
                id="old-password"
                data-ocid="admin.settings.old_password_input"
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 font-body"
              />
            </div>
            <div>
              <Label
                htmlFor="new-password"
                className="font-body text-sm font-medium"
              >
                New Password
              </Label>
              <Input
                id="new-password"
                data-ocid="admin.settings.new_password_input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 font-body"
              />
            </div>
            <div>
              <Label
                htmlFor="confirm-password"
                className="font-body text-sm font-medium"
              >
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                data-ocid="admin.settings.confirm_password_input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                className="mt-1 font-body"
              />
            </div>

            {newPassword &&
              confirmPassword &&
              newPassword !== confirmPassword && (
                <p
                  data-ocid="admin.settings.error_state"
                  className="text-xs font-body"
                  style={{ color: "oklch(0.57 0.22 27)" }}
                >
                  Passwords do not match
                </p>
              )}

            <Button
              data-ocid="admin.settings.submit_button"
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full font-body text-white mt-2"
              style={{ background: "oklch(0.22 0.08 152)" }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────

export default function AdminDashboard({ onLogout, adminPassword }: Props) {
  const [activePage, setActivePage] = useState<AdminPage>("coordinators");

  const navItems: {
    key: AdminPage;
    label: string;
    icon: LucideIcon;
    ocid: string;
  }[] = [
    {
      key: "coordinators",
      label: "Coordinators",
      icon: UserSquare2,
      ocid: "nav.admin.coordinators_link",
    },
    {
      key: "volunteers",
      label: "Volunteers",
      icon: Users,
      ocid: "nav.admin.volunteers_link",
    },
    {
      key: "settings",
      label: "Settings",
      icon: Settings,
      ocid: "nav.admin.settings_link",
    },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "coordinators":
        return <CoordinatorsPage adminPassword={adminPassword} />;
      case "volunteers":
        return <VolunteersPage adminPassword={adminPassword} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <CoordinatorsPage adminPassword={adminPassword} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full w-64 flex-shrink-0"
        style={{
          background: "oklch(0.14 0.06 152)",
          boxShadow: "2px 0 20px oklch(0 0 0 / 0.25)",
        }}
      >
        {/* Logo / Header */}
        <div
          className="p-5 border-b"
          style={{ borderColor: "oklch(0.22 0.06 152)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.32 0.09 152)",
                boxShadow: "0 2px 8px oklch(0.32 0.09 152 / 0.4)",
              }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm tracking-wide">
                INSARK
              </div>
              <div
                className="text-xs font-body"
                style={{ color: "oklch(0.78 0.14 85)" }}
              >
                Admin Portal
              </div>
            </div>
          </div>
        </div>

        {/* Admin badge */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "oklch(0.22 0.06 152)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
              style={{
                background: "oklch(0.78 0.14 85 / 0.2)",
                color: "oklch(0.88 0.12 85)",
              }}
            >
              A
            </div>
            <div className="min-w-0">
              <div className="text-sm font-body font-medium text-white">
                Administrator
              </div>
              <div
                className="text-xs font-body"
                style={{ color: "oklch(0.65 0.04 140)" }}
              >
                System Admin
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.key;
            const Icon = item.icon;
            return (
              <motion.button
                type="button"
                key={item.key}
                data-ocid={item.ocid}
                onClick={() => setActivePage(item.key)}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                style={{
                  background: isActive ? "oklch(0.22 0.08 152)" : "transparent",
                  color: isActive
                    ? "oklch(0.95 0.01 140)"
                    : "oklch(0.65 0.04 140)",
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    color: isActive
                      ? "oklch(0.78 0.14 85)"
                      : "oklch(0.55 0.04 140)",
                  }}
                />
                <span className="flex-1 text-sm font-body font-medium truncate">
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "oklch(0.78 0.14 85)" }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "oklch(0.22 0.06 152)" }}
        >
          <button
            type="button"
            data-ocid="nav.admin.logout_button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5"
            style={{ color: "oklch(0.65 0.04 140)" }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-body">Sign Out</span>
          </button>

          <p
            className="text-center text-xs font-body mt-3"
            style={{ color: "oklch(0.38 0.03 140)" }}
          >
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80 transition-opacity"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b"
          style={{
            background: "oklch(var(--background) / 0.95)",
            backdropFilter: "blur(8px)",
            borderColor: "oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2">
            <Shield
              className="w-4 h-4"
              style={{ color: "oklch(0.32 0.09 152)" }}
            />
            <span className="font-body text-sm font-medium text-foreground">
              {navItems.find((n) => n.key === activePage)?.label ?? "Admin"}
            </span>
          </div>
          <Badge
            className="font-body text-xs"
            style={{
              background: "oklch(0.14 0.06 152)",
              color: "oklch(0.78 0.14 85)",
              border: "none",
            }}
          >
            Admin Access
          </Badge>
        </div>

        {/* Page content */}
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {renderPage()}
        </motion.div>
      </main>
    </div>
  );
}
