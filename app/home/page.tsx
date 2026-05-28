"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Blue brand palette (matches landing page) ─────────────────
const C = {
    blue:      "#38BDF8",
    blueDark:  "#0284C7",
    blueDeep:  "#0C4A6E",
    blueMid:   "#7DD3FC",
    blueLight: "#E0F2FE",
    bluePale:  "#F0F9FF",
    dark:      "#0F172A",
    darkMid:   "#1E293B",
    white:     "#FFFFFF",
    textMid:   "#475569",
    textLight: "#94A3B8",
    border:    "#E2E8F0",
    bg:        "#F8FAFC",
};

// ── Mock data ─────────────────────────────────────────────────
const MOCK_POSTS = [
    {
        id: "1", username: "priya_codes", role: "recruiter",
        time: "2h ago",
        content: "Just shipped a full Rust + GraphQL backend in 3 days. The async-graphql crate is genuinely incredible. If you're building APIs in 2026, Rust is worth the learning curve. 🦀",
        likes: 142, comments: 23, liked: false,
    },
    {
        id: "2", username: "alex_dev", role: "user",
        time: "4h ago",
        content: "Hot take: TypeScript's type system is 80% of what makes large codebases maintainable. The other 20% is just discipline. Fight me. 👇",
        likes: 89, comments: 41, liked: true,
    },
    {
        id: "3", username: "sara_devops", role: "recruiter",
        time: "6h ago",
        content: "🚀 We're hiring Senior DevOps Engineers at CloudBase!\n\n• Remote-first\n• Competitive salary (35–50 LPA)\n• Great team\n\nDM me or apply via the jobs section.",
        likes: 57, comments: 9, liked: false,
    },
    {
        id: "4", username: "rohit_rs", role: "user",
        time: "8h ago",
        content: "Open-sourced my Tokio utility library today. It handles graceful shutdown, health checks, and structured logging out of the box. Link in bio 🔗",
        likes: 310, comments: 45, liked: false,
    },
    {
        id: "5", username: "bob_ml", role: "user",
        time: "1d ago",
        content: "Benchmark results: our ML pipeline now processes 10M records/min after switching from Python to Rust for the hot path. The numbers don't lie.",
        likes: 201, comments: 18, liked: true,
    },
];

const SUGGESTED_USERS = [
    { username: "diana_rust", role: "user",      followers: 1240 },
    { username: "marco_fe",   role: "user",      followers: 890  },
    { username: "nina_pm",    role: "recruiter", followers: 3100 },
];

const TRENDING_JOBS = [
    { title: "Senior Rust Engineer", company: "InfraCo",    pkg: "40-60 LPA" },
    { title: "React Frontend Dev",   company: "DesignHub",  pkg: "20-30 LPA" },
    { title: "ML Engineer",          company: "DataFusion", pkg: "35-50 LPA" },
];

// ── Avatar ────────────────────────────────────────────────────
const Avatar = ({ name, size = 38 }: { name: string; size?: number }) => (
    <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${C.blueDark}, ${C.blueDeep})`,
        color: C.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700,
        border: `2px solid ${C.blueLight}`,
        boxShadow: `0 0 0 1px ${C.blue}22`,
    }}>{name?.[0]?.toUpperCase() ?? "?"}</div>
);

// ── Post card ─────────────────────────────────────────────────
function PostCard({ post, onLike }: { post: typeof MOCK_POSTS[0]; onLike: (id: string) => void }) {
    return (
        <div style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "20px 22px", marginBottom: 16,
            transition: "box-shadow 0.2s, border-color 0.2s",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 4px 24px rgba(2,132,199,0.10)`;
                e.currentTarget.style.borderColor = C.blueMid;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = C.border;
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar name={post.username} />
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{post.username}</span>
                        {post.role === "recruiter" && (
                            <span style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px",
                                borderRadius: 20,
                                background: C.blueLight,
                                color: C.blueDark,
                                border: `1px solid ${C.blueMid}`,
                            }}>recruiter</span>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: C.textLight }}>{post.time}</div>
                </div>
                <button style={{
                    background: "transparent",
                    border: `1.5px solid ${C.blue}`,
                    borderRadius: 20, padding: "5px 16px",
                    fontSize: 12, color: C.blueDark, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                    transition: "all 0.15s",
                }}
                    onMouseEnter={e => {
                        (e.target as HTMLButtonElement).style.background = C.blueDark;
                        (e.target as HTMLButtonElement).style.color = C.white;
                    }}
                    onMouseLeave={e => {
                        (e.target as HTMLButtonElement).style.background = "transparent";
                        (e.target as HTMLButtonElement).style.color = C.blueDark;
                    }}
                >Follow</button>
            </div>

            {/* Content */}
            <p style={{
                fontSize: 14.5, lineHeight: 1.75, color: C.darkMid,
                whiteSpace: "pre-line", marginBottom: 16,
            }}>{post.content}</p>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 12 }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onLike(post.id)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    background: post.liked ? C.blueLight : C.bg,
                    color: post.liked ? C.blueDark : C.textMid,
                    fontWeight: post.liked ? 700 : 500,
                    fontSize: 13, cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all 0.15s",
                }}>
                    {post.liked ? "♥" : "♡"} {post.likes}
                </button>
                <button style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    background: C.bg, color: C.textMid,
                    fontSize: 13, cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    💬 {post.comments}
                </button>
                <button style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    background: C.bg, color: C.textMid,
                    fontSize: 13, cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    marginLeft: "auto",
                }}>
                    ↗ Share
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────
export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState<{ username: string; role?: string } | null>(null);
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [postText, setPostText] = useState("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            if (!raw) { router.replace("/login"); return; }
            setUser(JSON.parse(raw));
        } catch {
            router.replace("/login");
        }
    }, [router]);

    const handleLike = (id: string) => {
        setPosts(prev => prev.map(p =>
            p.id === id
                ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
                : p
        ));
    };

    const handlePost = () => {
        if (!postText.trim()) return;
        setPosts(prev => [{
            id: Date.now().toString(),
            username: user?.username ?? "you",
            role: user?.role ?? "user",
            time: "just now",
            content: postText.trim(),
            likes: 0, comments: 0, liked: false,
        }, ...prev]);
        setPostText("");
    };

    if (!user) return null;

    return (
        <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Navbar ──────────────────────────────────── */}
            <nav style={{
                background: C.dark,
                borderBottom: `1px solid rgba(56,189,248,0.15)`,
                position: "sticky", top: 0, zIndex: 100,
                padding: "0 40px", height: 58,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 1px 20px rgba(0,0,0,0.3)",
            }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: C.white, fontWeight: 800,
                        boxShadow: `0 0 12px ${C.blue}66`,
                    }}>B</div>
                    <span style={{
                        fontSize: 15, fontWeight: 700, color: C.white,
                        letterSpacing: "0.05em",
                    }}>Brewlink<span style={{ color: C.blue }}>.</span></span>
                </div>

                {/* Search */}
                <div style={{ position: "relative" }}>
                    <input
                        placeholder="Search people, jobs, posts…"
                        style={{
                            width: 300, padding: "8px 18px 8px 38px",
                            background: "rgba(255,255,255,0.07)",
                            border: `1px solid rgba(56,189,248,0.2)`,
                            borderRadius: 24, fontSize: 13,
                            color: "rgba(255,255,255,0.8)",
                            fontFamily: "'Outfit', sans-serif", outline: "none",
                        }}
                    />
                    <span style={{
                        position: "absolute", left: 13, top: "50%",
                        transform: "translateY(-50%)", fontSize: 14,
                        color: "rgba(255,255,255,0.3)",
                    }}>🔍</span>
                </div>

                {/* Right */}
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {[
                        { label: "Home",     href: "/home"     },
                        { label: "Jobs",     href: "/jobs"     },
                        { label: "Network",  href: "/network"  },
                        { label: "Messages", href: "/messages" },
                    ].map(n => (
                        <Link key={n.label} href={n.href} style={{
                            fontSize: 13, color: n.href === "/home" ? C.blue : "rgba(255,255,255,0.6)",
                            textDecoration: "none", fontWeight: n.href === "/home" ? 600 : 400,
                            borderBottom: n.href === "/home" ? `2px solid ${C.blue}` : "2px solid transparent",
                            paddingBottom: 2,
                            transition: "color 0.15s",
                        }}>{n.label}</Link>
                    ))}

                    {user.role === "admin" && (
                        <Link href="/admin" style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 12px",
                            background: "rgba(56,189,248,0.15)",
                            color: C.blue, borderRadius: 6,
                            textDecoration: "none",
                            border: `1px solid rgba(56,189,248,0.3)`,
                        }}>Admin</Link>
                    )}

                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                            color: C.white,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700,
                            boxShadow: `0 0 8px ${C.blue}44`,
                        }}>{user.username[0].toUpperCase()}</div>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                            {user.username}
                        </span>
                    </div>

                    <button onClick={() => { localStorage.clear(); router.push("/"); }} style={{
                        fontSize: 12, color: "rgba(255,255,255,0.3)",
                        background: "none", border: "none",
                        cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                    }}>logout</button>
                </div>
            </nav>

            {/* ── Body ─────────────────────────────────────── */}
            <div style={{
                maxWidth: 1100, margin: "0 auto",
                padding: "28px 24px",
                display: "grid", gridTemplateColumns: "1fr 300px", gap: 24,
            }}>

                {/* ── Feed ──────────────────────────────────── */}
                <div>
                    {/* Compose */}
                    <div style={{
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 16, padding: "18px 20px", marginBottom: 20,
                        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                    }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <Avatar name={user.username} />
                            <textarea
                                value={postText}
                                onChange={e => setPostText(e.target.value)}
                                placeholder="Share something with the community…"
                                rows={3}
                                style={{
                                    flex: 1, border: `1.5px solid ${C.border}`,
                                    borderRadius: 10, padding: "10px 14px",
                                    fontSize: 14, fontFamily: "'Outfit', sans-serif",
                                    resize: "none" as const, outline: "none",
                                    color: C.dark, background: C.bluePale,
                                    lineHeight: 1.65,
                                    transition: "border-color 0.2s",
                                }}
                                onFocus={e => (e.target.style.borderColor = C.blue)}
                                onBlur={e => (e.target.style.borderColor = C.border)}
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                            <button onClick={handlePost} disabled={!postText.trim()} style={{
                                padding: "9px 26px",
                                background: postText.trim()
                                    ? `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`
                                    : C.border,
                                color: postText.trim() ? C.white : C.textLight,
                                border: "none", borderRadius: 8,
                                fontSize: 13, fontWeight: 600,
                                cursor: postText.trim() ? "pointer" : "not-allowed",
                                fontFamily: "'Outfit', sans-serif",
                                boxShadow: postText.trim() ? `0 4px 14px ${C.blue}44` : "none",
                                transition: "all 0.15s",
                            }}>Post</button>
                        </div>
                    </div>

                    {/* Posts */}
                    {posts.map(p => <PostCard key={p.id} post={p} onLike={handleLike} />)}
                </div>

                {/* ── Sidebar ───────────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Profile card */}
                    <div style={{
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 16, overflow: "hidden",
                        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                    }}>
                        <div style={{
                            height: 64,
                            background: `linear-gradient(135deg, ${C.blueDeep}, ${C.blueDark})`,
                        }} />
                        <div style={{ padding: "0 18px 18px", textAlign: "center" as const, marginTop: -22 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                                color: C.white, margin: "0 auto",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18, fontWeight: 700,
                                border: `3px solid ${C.white}`,
                                boxShadow: `0 0 0 2px ${C.blue}`,
                            }}>{user.username[0].toUpperCase()}</div>
                            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8, color: C.dark }}>{user.username}</div>
                            <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
                                {user.role === "admin" ? "🔑 Admin" : user.role === "recruiter" ? "💼 Recruiter" : "👤 Member"}
                            </div>
                            <div style={{
                                display: "flex", justifyContent: "center", gap: 24,
                                marginTop: 14, paddingTop: 14,
                                borderTop: `1px solid ${C.border}`,
                            }}>
                                {[["0", "Posts"], ["0", "Followers"], ["0", "Following"]].map(([val, lbl]) => (
                                    <div key={lbl} style={{ textAlign: "center" as const }}>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>{val}</div>
                                        <div style={{ fontSize: 11, color: C.textLight }}>{lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* People to follow */}
                    <div style={{
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 16, padding: "18px",
                        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                    }}>
                        <div style={{
                            fontSize: 12, fontWeight: 700, color: C.blueDark,
                            marginBottom: 14, letterSpacing: "0.08em",
                            textTransform: "uppercase" as const,
                        }}>People to Follow</div>
                        {SUGGESTED_USERS.map((u, i) => (
                            <div key={u.username} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                paddingBottom: 12, marginBottom: 12,
                                borderBottom: i < SUGGESTED_USERS.length - 1 ? `1px solid ${C.border}` : "none",
                            }}>
                                <Avatar name={u.username} size={34} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{u.username}</div>
                                    <div style={{ fontSize: 11, color: C.textLight }}>{u.followers.toLocaleString()} followers</div>
                                </div>
                                <button style={{
                                    fontSize: 11, fontWeight: 600,
                                    padding: "4px 12px", borderRadius: 20,
                                    border: `1.5px solid ${C.blue}`,
                                    background: "transparent", color: C.blueDark,
                                    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                                    transition: "all 0.15s",
                                }}
                                    onMouseEnter={e => {
                                        (e.target as HTMLButtonElement).style.background = C.blueDark;
                                        (e.target as HTMLButtonElement).style.color = C.white;
                                    }}
                                    onMouseLeave={e => {
                                        (e.target as HTMLButtonElement).style.background = "transparent";
                                        (e.target as HTMLButtonElement).style.color = C.blueDark;
                                    }}
                                >Follow</button>
                            </div>
                        ))}
                    </div>

                    {/* Trending jobs */}
                    <div style={{
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 16, padding: "18px",
                        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                    }}>
                        <div style={{
                            fontSize: 12, fontWeight: 700, color: C.blueDark,
                            marginBottom: 14, letterSpacing: "0.08em",
                            textTransform: "uppercase" as const,
                        }}>Trending Jobs</div>
                        {TRENDING_JOBS.map((j, i) => (
                            <div key={j.title} style={{
                                paddingBottom: 12, marginBottom: 12,
                                borderBottom: i < TRENDING_JOBS.length - 1 ? `1px solid ${C.border}` : "none",
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{j.title}</div>
                                <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{j.company}</div>
                                <div style={{
                                    fontSize: 11, fontWeight: 700,
                                    color: C.blueDark, marginTop: 4,
                                    background: C.blueLight,
                                    display: "inline-block",
                                    padding: "2px 8px", borderRadius: 10,
                                }}>{j.pkg}</div>
                            </div>
                        ))}
                        <Link href="/jobs" style={{
                            fontSize: 12, color: C.blueDark, fontWeight: 600,
                            textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 4,
                        }}>View all jobs →</Link>
                    </div>

                    {/* Footer */}
                    <div style={{ fontSize: 11, color: C.textLight, lineHeight: 1.8, padding: "0 4px" }}>
                        <div>© 2026 Brewlink Technologies</div>
                        <div style={{ marginTop: 4 }}>
                            {["Privacy", "Terms", "Help"].map(l => (
                                <a key={l} href="#" style={{ color: C.textLight, textDecoration: "none", marginRight: 10 }}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}