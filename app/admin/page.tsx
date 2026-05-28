"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import {
    ADMIN_GET_USERS,
    ADMIN_GET_POSTS,
    ADMIN_GET_JOBS,
    ADMIN_SUSPEND_USER,
    ADMIN_DELETE_POST,
    ADMIN_DELETE_JOB,
} from "@/lib/admin-graphql";

// ── Brand palette ─────────────────────────────────────────────
const C = {
    forest: "#1E3932",
    green: "#00704A",
    gold: "#CBA258",
    cream: "#F2F0EB",
    white: "#ffffff",
    muted: "#718096",
    border: "#E2E8F0",
    danger: "#c53030",
    dangerBg: "rgba(197,48,48,0.08)",
    successBg: "rgba(0,112,74,0.09)",
};

// ── Fallback mock data (used until backend is live) ───────────
const MOCK_USERS = [
    { id: "u-001", username: "alex_dev",    email: "alex@example.com",    role: "user",      status: "active",    createdAt: "2026-01-10", followerCount: 320 },
    { id: "u-002", username: "priya_codes", email: "priya@example.com",   role: "recruiter", status: "active",    createdAt: "2026-02-03", followerCount: 890 },
    { id: "u-003", username: "bob_ml",      email: "bob@example.com",     role: "admin",     status: "active",    createdAt: "2025-11-22", followerCount: 1200 },
    { id: "u-004", username: "tanya_ui",    email: "tanya@example.com",   role: "user",      status: "suspended", createdAt: "2026-03-15", followerCount: 67 },
    { id: "u-005", username: "rohit_rs",    email: "rohit@example.com",   role: "user",      status: "active",    createdAt: "2026-04-01", followerCount: 445 },
];

const MOCK_POSTS = [
    { id: "p-001", userId: "alex_dev",    caption: "Just shipped my Rust API 🚀", visibility: "public",    createdAt: "2026-05-25" },
    { id: "p-002", userId: "priya_codes", caption: "Hiring senior React devs!",   visibility: "public",    createdAt: "2026-05-24" },
    { id: "p-003", userId: "tanya_ui",    caption: "Check this design system",    visibility: "followers", createdAt: "2026-05-23" },
    { id: "p-004", userId: "bob_ml",      caption: "ML pipeline benchmarks",      visibility: "private",   createdAt: "2026-05-21" },
];

const MOCK_JOBS = [
    { id: "j-001", title: "Senior Rust Engineer", companyName: "InfraCo",    location: "Remote",    createdAt: "2026-05-20" },
    { id: "j-002", title: "React Frontend Dev",   companyName: "DesignHub",  location: "Bangalore", createdAt: "2026-05-18" },
    { id: "j-003", title: "DevOps Engineer",      companyName: "CloudBase",  location: "Remote",    createdAt: "2026-05-15" },
];

const STATS_MOCK = [
    { label: "Total Users",   value: "12,847", delta: "+8.4%",  up: true  },
    { label: "Posts Today",   value: "3,201",  delta: "+12.1%", up: true  },
    { label: "Active Jobs",   value: "5,234",  delta: "-2.3%",  up: false },
    { label: "Messages Sent", value: "41,098", delta: "+19.7%", up: true  },
];

const ACTIVITY_MOCK = [
    { time: "2 min ago",  event: "New user registered",    detail: "sara_devops joined Brewlink" },
    { time: "14 min ago", event: "Job listing created",    detail: "ML Engineer @ DataFusion" },
    { time: "31 min ago", event: "Post flagged",           detail: "tanya_ui's post reported for spam" },
    { time: "1 hr ago",   event: "User suspended",         detail: "tanya_ui account suspended" },
    { time: "2 hrs ago",  event: "Conversation started",   detail: "alex_dev ↔ priya_codes" },
];

// ── Micro-components ──────────────────────────────────────────
const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string }) => {
    const map: Record<string, { bg: string; color: string }> = {
        green:  { bg: C.successBg,                       color: C.green  },
        red:    { bg: C.dangerBg,                        color: C.danger },
        gold:   { bg: "rgba(203,162,88,0.15)",           color: "#8a6820" },
        gray:   { bg: "#f1f5f9",                         color: "#475569" },
        blue:   { bg: "#EFF6FF",                         color: "#1D4ED8" },
        purple: { bg: "#F5F3FF",                         color: "#6D28D9" },
    };
    const s = map[color] ?? map.gray;
    return (
        <span style={{
            display: "inline-block", padding: "2px 9px", borderRadius: 20,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
            background: s.bg, color: s.color,
        }}>{children}</span>
    );
};

const statusBadge  = (s: string) => s === "active" ? <Badge color="green">active</Badge> : <Badge color="red">suspended</Badge>;
const visiBadge    = (v: string) => v === "public" ? <Badge color="green">public</Badge> : v === "private" ? <Badge color="gray">private</Badge> : <Badge color="blue">followers</Badge>;
const roleBadge    = (r: string) => r === "admin" ? <Badge color="red">admin</Badge> : r === "recruiter" ? <Badge color="purple">recruiter</Badge> : <Badge color="gray">user</Badge>;

const TH = ({ children }: { children: React.ReactNode }) => (
    <th style={{
        padding: "10px 14px", textAlign: "left",
        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase" as const, color: C.muted,
        borderBottom: `1.5px solid ${C.border}`, whiteSpace: "nowrap" as const,
    }}>{children}</th>
);

const TD = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <td style={{
        padding: "11px 14px", fontSize: 13.5, color: "#1a1a1a",
        borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" as const, ...style,
    }}>{children}</td>
);

const ActionBtn = ({ label, color = C.green, onClick }: { label: string; color?: string; onClick?: () => void }) => (
    <button onClick={onClick} style={{
        padding: "4px 10px", fontSize: 11, fontWeight: 600,
        border: `1.5px solid ${color}`, borderRadius: 6,
        background: "transparent", color, cursor: "pointer",
        marginRight: 4, fontFamily: "'Outfit', sans-serif",
    }}>{label}</button>
);

const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
    <div style={{
        width: size, height: size, borderRadius: "50%",
        background: C.forest, color: C.gold, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700,
    }}>{name?.[0]?.toUpperCase() ?? "?"}</div>
);

// ── Section: Overview ─────────────────────────────────────────
function Overview() {
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                {STATS_MOCK.map(s => (
                    <div key={s.label} style={{
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 12, padding: "20px 22px",
                        borderTop: `3px solid ${s.up ? C.green : C.danger}`,
                    }}>
                        <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: s.up ? C.green : C.danger, marginTop: 4, fontWeight: 600 }}>{s.delta} this week</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 18, color: C.forest }}>Live Activity</h3>
                    {ACTIVITY_MOCK.map((a, i) => (
                        <div key={i} style={{
                            display: "flex", gap: 14, paddingBottom: 14, marginBottom: 14,
                            borderBottom: i < ACTIVITY_MOCK.length - 1 ? `1px solid ${C.border}` : "none",
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1a1a" }}>{a.event}</div>
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.detail}</div>
                            </div>
                            <div style={{ fontSize: 11, color: "#b0b8c1", whiteSpace: "nowrap" as const, paddingTop: 2 }}>{a.time}</div>
                        </div>
                    ))}
                </div>

                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, marginBottom: 14, color: C.forest }}>Content Health</h3>
                    {[
                        { label: "Active users",      val: "12,732", warn: false },
                        { label: "Suspended users",   val: "115",    warn: true  },
                        { label: "Public posts",      val: "78%",    warn: false },
                        { label: "Active jobs",       val: "5,234",  warn: false },
                        { label: "Pending reports",   val: "2",      warn: true  },
                    ].map(r => (
                        <div key={r.label} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 0", borderBottom: `1px solid ${C.border}`,
                        }}>
                            <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: r.warn ? C.danger : C.green }}>{r.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Section: Users ────────────────────────────────────────────
function UsersSection() {
    const [search, setSearch] = useState("");

    // Swap to real data once backend admin queries are added:
    // const { data, loading } = useQuery(ADMIN_GET_USERS);
    // const users = data?.adminUsers ?? MOCK_USERS;
    const [users, setUsers] = useState(MOCK_USERS);

    // const [suspendUser] = useMutation(ADMIN_SUSPEND_USER);
    const toggle = (id: string) => {
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u
        ));
        // suspendUser({ variables: { userId: id } });
    };

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.forest }}>
                    User Management
                    <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, marginLeft: 10 }}>{users.length} total</span>
                </h3>
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by username or email…"
                    style={{
                        padding: "8px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8,
                        fontSize: 13, outline: "none", fontFamily: "'Outfit', sans-serif", width: 260,
                    }}
                />
            </div>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                    <thead>
                        <tr style={{ background: "#FAFAF9" }}>
                            <TH>User</TH><TH>Role</TH><TH>Status</TH><TH>Followers</TH><TH>Joined</TH><TH>Actions</TH>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u.id}
                                onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF9")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                                <TD>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <Avatar name={u.username} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.username}</div>
                                            <div style={{ fontSize: 11.5, color: C.muted }}>{u.email}</div>
                                        </div>
                                    </div>
                                </TD>
                                <TD>{roleBadge(u.role)}</TD>
                                <TD>{statusBadge(u.status)}</TD>
                                <TD style={{ color: C.muted }}>{u.followerCount}</TD>
                                <TD style={{ color: C.muted }}>{u.createdAt}</TD>
                                <TD>
                                    <ActionBtn label="View" />
                                    <ActionBtn
                                        label={u.status === "active" ? "Suspend" : "Reinstate"}
                                        color={u.status === "active" ? C.danger : C.green}
                                        onClick={() => toggle(u.id)}
                                    />
                                </TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Section: Posts ────────────────────────────────────────────
function PostsSection() {
    // const { data } = useQuery(ADMIN_GET_POSTS);
    // const [deletePost] = useMutation(ADMIN_DELETE_POST);
    const [posts, setPosts] = useState(MOCK_POSTS);

    const remove = (id: string) => {
        setPosts(prev => prev.filter(p => p.id !== id));
        // deletePost({ variables: { postId: id } });
    };

    return (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.forest }}>Post Moderation</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                    <thead>
                        <tr style={{ background: "#FAFAF9" }}>
                            <TH>Author</TH><TH>Caption</TH><TH>Visibility</TH><TH>Created</TH><TH>Actions</TH>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map(p => (
                            <tr key={p.id}
                                onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF9")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                                <TD>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Avatar name={p.userId} size={28} />
                                        <span style={{ fontWeight: 600 }}>{p.userId}</span>
                                    </div>
                                </TD>
                                <TD style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                    {p.caption ?? <span style={{ color: C.muted, fontStyle: "italic" }}>no caption</span>}
                                </TD>
                                <TD>{visiBadge(p.visibility)}</TD>
                                <TD style={{ color: C.muted }}>{p.createdAt}</TD>
                                <TD>
                                    <ActionBtn label="Delete" color={C.danger} onClick={() => remove(p.id)} />
                                </TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Section: Jobs ─────────────────────────────────────────────
function JobsSection() {
    // const { data } = useQuery(ADMIN_GET_JOBS);
    // const [deleteJob] = useMutation(ADMIN_DELETE_JOB);
    const [jobs, setJobs] = useState(MOCK_JOBS);

    const remove = (id: string) => {
        setJobs(prev => prev.filter(j => j.id !== id));
        // deleteJob({ variables: { jobId: id } });
    };

    return (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.forest }}>Job Listings</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                    <thead>
                        <tr style={{ background: "#FAFAF9" }}>
                            <TH>Title</TH><TH>Company</TH><TH>Location</TH><TH>Posted</TH><TH>Actions</TH>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(j => (
                            <tr key={j.id}
                                onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF9")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                                <TD style={{ fontWeight: 600 }}>{j.title}</TD>
                                <TD style={{ color: C.muted }}>{j.companyName}</TD>
                                <TD style={{ color: C.muted }}>{j.location}</TD>
                                <TD style={{ color: C.muted }}>{j.createdAt}</TD>
                                <TD>
                                    <ActionBtn label="Delete" color={C.danger} onClick={() => remove(j.id)} />
                                </TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Nav config ────────────────────────────────────────────────
const NAV = [
    { id: "overview", label: "Overview" },
    { id: "users",    label: "Users"    },
    { id: "posts",    label: "Posts"    },
    { id: "jobs",     label: "Jobs"     },
] as const;

type NavId = typeof NAV[number]["id"];

// ── Root export ───────────────────────────────────────────────
export default function AdminPage() {
    const router = useRouter();
    const [active, setActive] = useState<NavId>("overview");
    const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            if (!raw) { router.replace("/login"); return; }
            const user = JSON.parse(raw);
            if (user?.role !== "admin") { router.replace("/home"); return; }
            setAdminUser(user);
        } catch {
            router.replace("/login");
        } finally {
            setChecking(false);
        }
    }, [router]);

    if (checking) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.cream, fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ fontSize: 14, color: C.muted }}>Checking permissions…</div>
            </div>
        );
    }

    const subtitles: Record<NavId, string> = {
        overview: "Platform health and live activity",
        users:    "Manage members, roles, and suspensions",
        posts:    "Review and moderate all content",
        jobs:     "Monitor job listings across the platform",
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", background: C.cream }}>

            {/* ── Sidebar ─────────────────────────────────── */}
            <div style={{
                width: 220, background: C.forest,
                display: "flex", flexDirection: "column",
                position: "sticky", top: 0, height: "100vh", flexShrink: 0,
            }}>
                {/* Logo */}
                <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: C.green, border: `2px solid ${C.gold}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 14, color: C.gold, fontWeight: 700,
                        }}>B</div>
                        <div>
                            <div style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Brewlink</div>
                            <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginTop: 1 }}>Admin Panel</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "16px 12px" }}>
                    {NAV.map(n => {
                        const isActive = active === n.id;
                        return (
                            <button key={n.id} onClick={() => setActive(n.id)} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                width: "100%", padding: "10px 14px", borderRadius: 8,
                                border: "none", cursor: "pointer", marginBottom: 4,
                                background: isActive ? "rgba(203,162,88,0.18)" : "transparent",
                                color: isActive ? C.gold : "rgba(255,255,255,0.6)",
                                fontSize: 13.5, fontFamily: "'Outfit', sans-serif",
                                fontWeight: isActive ? 600 : 400, textAlign: "left" as const,
                                borderLeft: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
                            }}>
                                {n.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Admin badge + logout */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: C.gold, color: C.forest,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                    }}>{adminUser?.username?.[0]?.toUpperCase() ?? "A"}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{adminUser?.username ?? "Admin"}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Super Admin</div>
                    </div>
                    <button onClick={() => { localStorage.clear(); router.push("/login"); }} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, color: "rgba(255,255,255,0.3)",
                        fontFamily: "'Outfit', sans-serif",
                    }}>logout</button>
                </div>
            </div>

            {/* ── Main ────────────────────────────────────── */}
            <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: C.forest, marginBottom: 4 }}>
                        {NAV.find(n => n.id === active)?.label}
                    </h2>
                    <p style={{ fontSize: 13.5, color: C.muted }}>{subtitles[active]}</p>
                </div>

                {active === "overview" && <Overview />}
                {active === "users"    && <UsersSection />}
                {active === "posts"    && <PostsSection />}
                {active === "jobs"     && <JobsSection />}
            </div>
        </div>
    );
}