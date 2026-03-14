"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
import { useRole, type UserRole } from "@/context/RoleProvider";

/* ── Icon helpers (inline SVGs for zero-dependency icons) ── */
function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPairings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconMessages() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconGoals() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconCheckIns() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ── Navigation items ── */
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <IconDashboard /> },
  { label: "Pairings", href: "/pairings", icon: <IconPairings /> },
  { label: "Messages", href: "/messages", icon: <IconMessages /> },
  { label: "Goals", href: "/goals", icon: <IconGoals /> },
  { label: "Check-ins", href: "/check-ins", icon: <IconCheckIns /> },
];

/* ── Role labels ── */
const roleLabels: Record<UserRole, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  officer: "Officer",
};

const roleColors: Record<UserRole, string> = {
  mentee: "bg-brand/16 text-brand",
  mentor: "bg-accent/20 text-accent",
  officer: "bg-danger/16 text-danger",
};

/* ── Sidebar Component ── */
export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { role, setRole } = useRole();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold text-lg font-heading">
          M
        </div>
        <span className="text-lg font-bold font-heading tracking-tight">Maventor</span>
      </div>

      {/* Role Switcher */}
      <div className="px-4 pb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Demo Role
        </p>
        <div className="flex gap-1.5">
          {(["mentee", "mentor", "officer"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={[
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
                "focus-ring",
                role === r ? roleColors[r] : "text-text-muted hover:bg-surface-muted",
              ].join(" ")}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    "focus-ring",
                    isActive
                      ? "bg-brand/12 text-brand"
                      : "text-text-muted hover:bg-surface-muted hover:text-text-primary",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className="border-t border-border px-4 py-4">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors duration-150 cursor-pointer focus-ring"
          aria-live="polite"
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
