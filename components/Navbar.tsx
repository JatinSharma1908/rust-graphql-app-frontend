"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  IconHome, IconBriefcase, IconMessage, IconUsers,
  IconSearch, IconBell, IconChevronDown
} from "@tabler/icons-react";

const navLinks = [
  { href: "/feed",     label: "Feed",     icon: IconHome },
  { href: "/jobs",     label: "Jobs",     icon: IconBriefcase },
  { href: "/messages", label: "Messages", icon: IconMessage, badge: 6 },
  { href: "/network",  label: "Network",  icon: IconUsers },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <nav className="topnav">
      {/* Logo */}
      <Link href="/feed" className="nav-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="#6B4EFF"/>
          <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="14" cy="18" r="3" fill="white"/>
        </svg>
        Brewlink
      </Link>

      {/* Search */}
      <div className="nav-search">
        <IconSearch size={15} color="var(--t3)" />
        <input placeholder="Search jobs, people, skills..." />
      </div>

      {/* Nav links */}
      <div className="nav-links">
        {navLinks.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`}>
              <div style={{ position: "relative" }}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {badge && <span className="nav-badge">{badge}</span>}
              </div>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="nav-right">
        <button style={s.iconBtn} aria-label="Notifications">
          <IconBell size={20} color="var(--t2)" />
          <div style={s.notifDot} />
        </button>

        <div style={s.userBtn} onClick={() => router.push("/profile")}>
          <div className="ava" style={{ width: 34, height: 34, background: "var(--purple-light)", color: "var(--purple)", fontSize: 12 }}>
            {initials}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>{user?.username ?? "Guest"}</div>
            <div style={{ fontSize: 11, color: "var(--t3)" }}>View profile</div>
          </div>
          <IconChevronDown size={14} color="var(--t3)" />
        </div>

        <button
          onClick={() => { logout(); router.push("/login"); }}
          style={{ fontSize: 12, color: "var(--t3)", background: "transparent", padding: "4px 8px", borderRadius: 4 }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

const s: Record<string, React.CSSProperties> = {
  iconBtn: { width: 36, height: 36, borderRadius: "50%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "background 0.12s" },
  notifDot: { width: 8, height: 8, borderRadius: "50%", background: "var(--red)", border: "2px solid var(--surface)", position: "absolute", top: 4, right: 4 },
  userBtn: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "background 0.12s" },
};