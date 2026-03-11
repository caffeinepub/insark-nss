import { ChevronRight, LogOut, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AuthSession } from "../App";

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  ocid: string;
}

interface Props {
  session: AuthSession;
  navItems: NavItem[];
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  title: string;
  subtitle: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({
  session,
  navItems,
  activePage,
  onNavigate,
  onLogout,
  title,
  subtitle,
  isOpen = false,
  onClose,
}: Props) {
  const handleNavigate = (key: string) => {
    onNavigate(key);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 md:hidden w-full h-full cursor-default"
          style={{ background: "oklch(0 0 0 / 0.5)", border: "none" }}
          onClick={onClose}
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "flex flex-col h-full w-64 flex-shrink-0 transition-transform duration-300",
          // Mobile: fixed overlay, slide in/out
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        style={{
          background: "oklch(0.18 0.07 152)",
          boxShadow: "2px 0 16px oklch(0 0 0 / 0.18)",
        }}
      >
        {/* Logo / Header */}
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: "oklch(0.28 0.06 152)" }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/insark-logo-transparent.dim_200x200.png"
              alt="INSARK"
              className="w-9 h-9 rounded-lg object-cover"
            />
            <div>
              <div className="font-display font-bold text-white text-sm">
                {title}
              </div>
              <div
                className="text-xs font-body"
                style={{ color: "oklch(0.78 0.14 85)" }}
              >
                {subtitle}
              </div>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            type="button"
            className="md:hidden p-1 rounded-lg"
            style={{ color: "oklch(0.65 0.04 140)" }}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "oklch(0.28 0.06 152)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold flex-shrink-0"
              style={{
                background: "oklch(0.78 0.14 85 / 0.25)",
                color: "oklch(0.88 0.12 85)",
              }}
            >
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-body font-medium text-white truncate">
                {session.name}
              </div>
              <div
                className="text-xs font-body truncate"
                style={{ color: "oklch(0.65 0.04 140)" }}
              >
                {session.email}
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
              <button
                type="button"
                key={item.key}
                data-ocid={item.ocid}
                onClick={() => handleNavigate(item.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group"
                style={{
                  background: isActive ? "oklch(0.28 0.08 152)" : "transparent",
                  color: isActive
                    ? "oklch(0.95 0.01 140)"
                    : "oklch(0.72 0.04 140)",
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    color: isActive ? "oklch(0.78 0.14 85)" : "inherit",
                  }}
                />
                <span className="flex-1 text-sm font-body font-medium truncate">
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="ml-auto flex-shrink-0 min-w-5 h-5 rounded-full text-xs flex items-center justify-center font-body font-bold px-1"
                    style={{
                      background: "oklch(0.78 0.14 85)",
                      color: "oklch(0.15 0.04 50)",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <ChevronRight
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "oklch(0.78 0.14 85)" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "oklch(0.28 0.06 152)" }}
        >
          <button
            type="button"
            data-ocid="nav.logout_button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
            style={{ color: "oklch(0.72 0.04 140)" }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-body">Sign Out</span>
          </button>

          {/* Footer */}
          <p
            className="text-center text-xs font-body mt-3"
            style={{ color: "oklch(0.45 0.03 140)" }}
          >
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
