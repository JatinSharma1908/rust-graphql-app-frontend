"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION, REGISTER_MUTATION } from "@/lib/graphql";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Brand colour palette (unchanged from your existing landing page) ── */
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
};

/* ── Shared form styles ── */
const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 5,
    fontSize: 12, fontWeight: 600, color: "#4a5568",
    letterSpacing: "0.04em", textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
    padding: "11px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    color: C.dark, outline: "none", width: "100%",
    background: C.bluePale,
    transition: "border-color 0.2s",
};

export default function LandingPage() {
    const router = useRouter();

    /* ── auth state ── */
    const [tab, setTab]           = useState<"login" | "register">("login");
    const [showPass, setShowPass] = useState(false);
    const [error, setError]       = useState("");

    const [loginForm, setLoginForm]   = useState({ username: "", password: "" });
    const [regForm,   setRegForm]     = useState({ username: "", email: "", password: "" });

    const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
        onCompleted(data: any) {
            localStorage.setItem("token", data.login.token);
            localStorage.setItem("user", JSON.stringify(data.login.user));
            router.push("/home");
        },
        onError(err) { setError(err.message); },
    });

    const [register, { loading: regLoading }] = useMutation(REGISTER_MUTATION, {
        onCompleted(data: any) {
            localStorage.setItem("token", data.register.token);
            localStorage.setItem("user", JSON.stringify(data.register.user));
            router.push("/home");
        },
        onError(err) { setError(err.message); },
    });

    function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        login({ variables: { input: loginForm } });
    }

    function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (regForm.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        register({ variables: { input: regForm } });
    }

    const loading = tab === "login" ? loginLoading : regLoading;

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bluePale, minHeight: "100vh", overflowX: "hidden" }}>

            {/* ══ NAVBAR ══ */}
            <nav style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 60px", height: 68,
                background: C.white,
                borderBottom: `1px solid ${C.border}`,
                position: "sticky", top: 0, zIndex: 100,
                boxShadow: "0 1px 12px rgba(14,165,233,0.08)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: C.blueDeep, border: `2px solid ${C.blue}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 15, color: C.blue, fontWeight: 700,
                    }}>B</div>
                    <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 20, fontWeight: 700, color: C.dark, letterSpacing: "-0.02em",
                    }}>Brewlink<span style={{ color: C.blue }}>.</span></span>
                </div>

                <div style={{ display: "flex", gap: 36 }}>
                    {["Home", "Jobs", "Network", "Projects", "Messages"].map((item, i) => (
                        <a key={item} href="#" style={{
                            fontSize: 14, fontWeight: i === 0 ? 600 : 400,
                            color: i === 0 ? C.blueDark : C.textMid,
                            textDecoration: i === 0 ? "underline" : "none",
                            textUnderlineOffset: 4,
                        }}>{item}</a>
                    ))}
                </div>

                <button
                    onClick={() => { setTab("register"); setError(""); setShowPass(false); }}
                    style={{
                        padding: "9px 24px", background: C.blueDeep, color: C.white,
                        border: "none", borderRadius: 50, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                    }}
                >Get Started</button>
            </nav>

            {/* ══ SPLIT HERO ══ */}
            <section style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>

                {/* LEFT — hero content */}
                <div style={{
                    flex: 1, padding: "60px 52px 60px 60px",
                    display: "flex", alignItems: "center",
                    background: C.bluePale, position: "relative",
                }}>
                    <div style={{ display: "flex", gap: 52, alignItems: "center", width: "100%", maxWidth: 780, margin: "0 auto" }}>

                        {/* Text */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                border: `1.5px dashed ${C.blue}`, borderRadius: 6,
                                padding: "6px 14px", marginBottom: 24,
                            }}>
                                <span style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>Hello There!</span>
                            </div>

                            <h1 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900,
                                lineHeight: 1.1, color: C.dark, marginBottom: 20,
                            }}>
                                I&apos;m <em style={{ color: C.blue, fontStyle: "italic" }}>Brewlink,</em><br />
                                Professional Network<br />
                                <span style={{ color: C.dark }}>Built for Engineers.</span>
                            </h1>

                            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.75, maxWidth: 380, marginBottom: 36 }}>
                                Connect with top engineers, discover your next opportunity,
                                and build the career you deserve — all in one place.
                            </p>

                            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 44 }}>
                                <a href="#features" style={{
                                    display: "inline-flex", alignItems: "center", gap: 10,
                                    padding: "13px 28px", background: C.blueDeep, color: C.white,
                                    textDecoration: "none", borderRadius: 50, fontSize: 14, fontWeight: 600,
                                    boxShadow: "0 6px 20px rgba(2,132,199,0.35)",
                                }}>View Jobs</a>
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%", background: C.blue,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: C.white,
                                    boxShadow: "0 4px 12px rgba(56,189,248,0.4)",
                                    fontSize: 16,
                                }}>▶</div>
                                <button
                                    onClick={() => { setTab("login"); setError(""); setShowPass(false); }}
                                    style={{
                                        padding: "13px 28px", background: "transparent", color: C.dark,
                                        border: `1.5px solid ${C.border}`, borderRadius: 50,
                                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >Sign In</button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: "flex", gap: 32 }}>
                                {[
                                    { val: "12K+", lbl: "Engineers" },
                                    { val: "5.2K+", lbl: "Job Listings" },
                                    { val: "340+", lbl: "Companies" },
                                ].map(s => (
                                    <div key={s.lbl}>
                                        <p style={{
                                            fontFamily: "'Playfair Display', Georgia, serif",
                                            fontSize: 24, fontWeight: 700, color: C.blueDark, margin: 0,
                                        }}>{s.val}</p>
                                        <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.lbl}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Orb visual */}
                        <div style={{ position: "relative", flexShrink: 0, width: 300 }}>
                            {/* Outer circle bg */}
                            <div style={{
                                width: 280, height: 280, borderRadius: "50%", background: C.blueLight,
                                position: "absolute", top: "50%", left: "50%",
                                transform: "translate(-50%, -52%)", zIndex: 0,
                            }} />
                            {/* Main blob */}
                            <div style={{
                                position: "relative", zIndex: 1, width: 240, height: 280,
                                margin: "0 auto",
                                background: `linear-gradient(160deg, ${C.blueDeep} 0%, ${C.blueDark} 100%)`,
                                borderRadius: "50% 50% 48% 52% / 60% 60% 40% 40%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 20px 60px rgba(12,74,110,0.3)",
                            }}>
                                <div style={{ textAlign: "center", color: C.white, padding: 24 }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: "50%", background: C.blue,
                                        margin: "0 auto 14px", display: "flex", alignItems: "center",
                                        justifyContent: "center", fontSize: 26,
                                        fontFamily: "'Playfair Display', serif", fontWeight: 700,
                                    }}>B</div>
                                    <p style={{ fontSize: 12, color: C.blueMid, marginBottom: 4, fontWeight: 500 }}>Professional Network</p>
                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>12,000+ Engineers</p>
                                </div>
                            </div>
                            {/* Floating pills */}
                            {[
                                { text: "Full-Stack Dev", style: { top: "15%", right: -24 } },
                                { text: "UI/UX Engineer", style: { bottom: "28%", right: -34 } },
                                { text: "DevOps",         style: { bottom: "10%", left: 8 } },
                            ].map(({ text, style }) => (
                                <div key={text} style={{
                                    position: "absolute", ...style,
                                    background: C.white, padding: "7px 14px", borderRadius: 30,
                                    fontSize: 11, fontWeight: 600, color: C.dark,
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)", whiteSpace: "nowrap", zIndex: 2,
                                }}>{text}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT — auth panel */}
                <div style={{
                    width: 440, background: C.white,
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    padding: "52px 44px", position: "relative", flexShrink: 0,
                    borderLeft: `1px solid ${C.border}`,
                    boxShadow: "-4px 0 32px rgba(14,165,233,0.07)",
                }}>
                    {/* Top accent bar */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 4,
                        background: `linear-gradient(90deg, ${C.blueDeep}, ${C.blue})`,
                    }} />

                    {/* Tab switcher */}
                    <div style={{
                        display: "flex", gap: 4,
                        background: C.bluePale, borderRadius: 10,
                        padding: 4, marginBottom: 28,
                    }}>
                        {(["login", "register"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setError(""); setShowPass(false); }}
                                style={{
                                    flex: 1, padding: "9px", border: "none", borderRadius: 7,
                                    textAlign: "center", fontSize: 13, cursor: "pointer",
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: tab === t ? 600 : 500,
                                    color: tab === t ? C.blueDeep : C.textMid,
                                    background: tab === t ? C.white : "transparent",
                                    boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                {t === "login" ? "Sign In" : "Create Account"}
                            </button>
                        ))}
                    </div>

                    {tab === "login" ? (
                        <>
                            <h2 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 26, fontWeight: 700, color: C.dark, marginBottom: 4,
                            }}>Welcome back</h2>
                            <p style={{ fontSize: 14, color: C.textMid, marginBottom: 24, lineHeight: 1.6 }}>
                                Sign in to continue on Brewlink.
                            </p>

                            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={labelStyle}>Username</label>
                                    <input
                                        type="text" value={loginForm.username}
                                        onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                                        required autoFocus autoComplete="username"
                                        placeholder="your_username" style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginBottom: 4 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                        <label style={labelStyle}>Password</label>
                                        <a href="#" style={{ fontSize: 12, color: C.blueDark, textDecoration: "none", fontWeight: 500 }}>
                                            Forgot password?
                                        </a>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type={showPass ? "text" : "password"} value={loginForm.password}
                                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                            required autoComplete="current-password"
                                            placeholder="••••••••" style={inputStyle}
                                        />
                                        <button
                                            type="button" onClick={() => setShowPass(p => !p)}
                                            style={{
                                                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                                fontSize: 11, color: C.blueDark, background: "none", border: "none",
                                                cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                            }}
                                        >{showPass ? "Hide" : "Show"}</button>
                                    </div>
                                </div>

                                {error && <ErrorBox msg={error} />}

                                <button type="submit" disabled={loading} style={{
                                    padding: 13,
                                    background: loading ? C.border : C.blueDeep,
                                    color: loading ? C.textLight : C.white,
                                    border: "none", borderRadius: 8,
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                                    fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                                    marginTop: 16,
                                    boxShadow: loading ? "none" : "0 4px 16px rgba(2,132,199,0.3)",
                                }}>
                                    {loading ? "Signing in…" : "Sign In →"}
                                </button>
                            </form>

                            {/* Divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                                <div style={{ flex: 1, height: 1, background: C.border }} />
                                <span style={{ fontSize: 12, color: C.textLight }}>or continue with</span>
                                <div style={{ flex: 1, height: 1, background: C.border }} />
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                                {["Google", "GitHub"].map(p => (
                                    <button key={p} style={{
                                        flex: 1, padding: "10px", border: `1.5px solid ${C.border}`,
                                        background: C.white, borderRadius: 8, cursor: "pointer",
                                        fontFamily: "'Outfit', sans-serif", fontSize: 12,
                                        color: C.textMid, fontWeight: 500,
                                    }}>{p}</button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 26, fontWeight: 700, color: C.dark, marginBottom: 4,
                            }}>Start your journey</h2>
                            <p style={{ fontSize: 14, color: C.textMid, marginBottom: 24, lineHeight: 1.6 }}>
                                Join 12,000+ engineers already on Brewlink.
                            </p>

                            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Username</label>
                                    <input
                                        type="text" value={regForm.username}
                                        onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                                        required autoFocus autoComplete="username"
                                        placeholder="your_username" style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Email address</label>
                                    <input
                                        type="email" value={regForm.email}
                                        onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                                        required autoComplete="email"
                                        placeholder="you@example.com" style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginBottom: 4 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                        <label style={labelStyle}>Password</label>
                                        <button
                                            type="button" onClick={() => setShowPass(p => !p)}
                                            style={{
                                                fontSize: 11, color: C.blueDark, background: "none", border: "none",
                                                cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                            }}
                                        >{showPass ? "Hide" : "Show"}</button>
                                    </div>
                                    <input
                                        type={showPass ? "text" : "password"} value={regForm.password}
                                        onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                                        required autoComplete="new-password"
                                        placeholder="Min. 8 characters" style={inputStyle}
                                    />
                                </div>

                                {error && <ErrorBox msg={error} />}

                                <button type="submit" disabled={loading} style={{
                                    padding: 13,
                                    background: loading ? C.border : C.blueDeep,
                                    color: loading ? C.textLight : C.white,
                                    border: "none", borderRadius: 8,
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                                    fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                                    marginTop: 16,
                                    boxShadow: loading ? "none" : "0 4px 16px rgba(2,132,199,0.3)",
                                }}>
                                    {loading ? "Creating account…" : "Create Account →"}
                                </button>

                                <p style={{ fontSize: 11.5, color: C.textLight, marginTop: 12, lineHeight: 1.6 }}>
                                    By registering you agree to our{" "}
                                    <a href="#" style={{ color: C.blueDark, textDecoration: "none" }}>Terms</a>{" "}
                                    and{" "}
                                    <a href="#" style={{ color: C.blueDark, textDecoration: "none" }}>Privacy Policy</a>.
                                </p>
                            </form>
                        </>
                    )}

                    {/* Footer switch */}
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 13, color: C.textMid }}>
                            {tab === "login" ? (
                                <>Don&apos;t have an account?{" "}
                                    <button onClick={() => { setTab("register"); setError(""); setShowPass(false); }}
                                        style={{ color: C.blueDark, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                                        Create one →
                                    </button>
                                </>
                            ) : (
                                <>Already have an account?{" "}
                                    <button onClick={() => { setTab("login"); setError(""); setShowPass(false); }}
                                        style={{ color: C.blueDark, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                                        Sign in →
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </section>

            {/* ══ TICKER ══ */}
            <div style={{
                background: C.blueDeep, color: C.white, padding: "14px 0",
                overflow: "hidden", borderTop: `1px solid ${C.blueDark}`,
                borderBottom: `1px solid ${C.blueDark}`,
            }}>
                <div style={{ display: "flex", gap: 64, animation: "ticker 22s linear infinite", whiteSpace: "nowrap" }}>
                    {[...Array(2)].map((_, rep) =>
                        ["Software Engineering", "✦", "Product Design", "✦", "DevOps & Cloud", "✦", "Data Science", "✦", "Open Source", "✦", "Remote Jobs", "✦"].map((item, i) => (
                            <span key={`${rep}-${i}`} style={{
                                fontSize: 13, fontWeight: 600, letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: item === "✦" ? C.blue : "rgba(255,255,255,0.85)",
                            }}>{item}</span>
                        ))
                    )}
                </div>
            </div>

            {/* ══ FEATURES ══ */}
            <section id="features" style={{ padding: "80px 60px", maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ marginBottom: 48 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 24, height: 3, background: C.blue, borderRadius: 2 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.15em", textTransform: "uppercase" }}>What We Offer</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <h2 style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 900, color: C.dark,
                        }}>
                            <em style={{ color: C.blue, fontStyle: "italic" }}>Features</em> We Provide
                        </h2>
                        <button
                            onClick={() => { setTab("register"); setError(""); setShowPass(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            style={{
                                padding: "11px 22px", background: C.blueDeep, color: C.white,
                                border: "none", borderRadius: 50, fontSize: 13, fontWeight: 600,
                                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                            }}
                        >View All →</button>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                    {[
                        { icon: "💼", title: "Job Board",        desc: "Browse 5,200+ curated tech job listings with salary ranges, tech stack requirements and remote options." },
                        { icon: "🤝", title: "Engineer Network", desc: "Follow top engineers, see their projects and experience, and build your professional circle." },
                        { icon: "📢", title: "Posts & Feed",     desc: "Share your work, like and comment on posts, and discover what engineers in your field are building." },
                        { icon: "💬", title: "Direct Messages",  desc: "Private DMs and group conversations with people in your network. Collaborate seamlessly." },
                        { icon: "📄", title: "CV & Portfolio",   desc: "Showcase your tech stack, projects, certificates and downloadable CV right on your profile." },
                        { icon: "🔔", title: "Smart Alerts",     desc: "Get notified about new jobs matching your skills, new followers, and activity on your posts." },
                    ].map(({ icon, title, desc }) => (
                        <div
                            key={title}
                            style={{
                                background: C.white, borderRadius: 16, padding: 28,
                                border: `1px solid ${C.border}`, cursor: "default",
                                transition: "box-shadow 0.2s, transform 0.2s",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(2,132,199,0.15)";
                                (e.currentTarget as HTMLDivElement).style.transform  = "translateY(-4px)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                                (e.currentTarget as HTMLDivElement).style.transform  = "translateY(0)";
                            }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, background: C.blueLight,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 22, marginBottom: 16,
                            }}>{icon}</div>
                            <h3 style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 17, fontWeight: 700, color: C.dark, marginBottom: 8,
                            }}>{title}</h3>
                            <p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.65, marginBottom: 16 }}>{desc}</p>
                            <a href="#" style={{ fontSize: 13, fontWeight: 600, color: C.blueDark, textDecoration: "none" }}>Learn more →</a>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ ABOUT + STATS ══ */}
            <section style={{ background: C.blueDeep, padding: "80px 60px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 80 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                            width: 300, height: 300, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${C.blueDark}, ${C.blueDeep})`,
                            border: `4px solid ${C.blue}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 0 12px rgba(56,189,248,0.1)",
                        }}>
                            <div style={{ textAlign: "center", color: C.white }}>
                                <div style={{ fontSize: 64, marginBottom: 8 }}>👨‍💻</div>
                                <p style={{ fontSize: 13, color: C.blueMid }}>Your Profile</p>
                            </div>
                        </div>
                        {[
                            { text: "React / Next.js", style: { top: "5%",    left: "65%" } },
                            { text: "Rust / Go",       style: { top: "35%",   left: "-25%" } },
                            { text: "PostgreSQL",      style: { bottom: "20%", left: "60%" } },
                            { text: "Docker",          style: { bottom: "5%", left: "5%" } },
                        ].map(({ text, style }) => (
                            <div key={text} style={{
                                position: "absolute", ...style,
                                background: "rgba(255,255,255,0.1)",
                                border: `1px solid rgba(56,189,248,0.3)`,
                                padding: "6px 14px", borderRadius: 30,
                                fontSize: 11, fontWeight: 600, color: C.white, whiteSpace: "nowrap",
                            }}>{text}</div>
                        ))}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 24, height: 3, background: C.blue, borderRadius: 2 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.15em", textTransform: "uppercase" }}>About</span>
                        </div>
                        <h2 style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 900,
                            color: C.white, lineHeight: 1.15, marginBottom: 20,
                        }}>
                            What is <em style={{ color: C.blue, fontStyle: "italic" }}>Brewlink?</em>
                        </h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
                            Brewlink is a professional social network built specifically for engineers.
                            Share your work, find jobs that match your stack, and connect with people building the future.
                        </p>
                        <div style={{ display: "flex", gap: 40, marginBottom: 40 }}>
                            {[{ val: "12K+", lbl: "Members" }, { val: "340+", lbl: "Companies" }, { val: "5.2K", lbl: "Jobs Posted" }].map(({ val, lbl }) => (
                                <div key={lbl}>
                                    <p style={{
                                        fontFamily: "'Playfair Display', Georgia, serif",
                                        fontSize: 34, fontWeight: 700, color: C.blue, lineHeight: 1, marginBottom: 4,
                                    }}>{val}</p>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lbl}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setTab("register"); setError(""); setShowPass(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            style={{
                                padding: "13px 28px", background: C.blue, color: C.blueDeep,
                                border: "none", borderRadius: 50, fontSize: 14, fontWeight: 700,
                                cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                                boxShadow: "0 6px 20px rgba(56,189,248,0.35)",
                            }}
                        >Join Now →</button>
                    </div>
                </div>
            </section>

            {/* ══ TECH STACK ══ */}
            <section style={{ padding: "80px 60px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 3, background: C.blue, borderRadius: 2 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.15em", textTransform: "uppercase" }}>Tech Stack</span>
                </div>
                <h2 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 900, color: C.dark, marginBottom: 8,
                }}>
                    <em style={{ color: C.blue, fontStyle: "italic" }}>Technologies</em> We Support
                </h2>
                <p style={{ fontSize: 15, color: C.textMid, marginBottom: 48 }}>Post your stack, find engineers who know your tools.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 900, margin: "0 auto" }}>
                    {["React", "Next.js", "Rust", "Go", "Python", "TypeScript", "PostgreSQL", "Docker", "Kubernetes", "AWS", "GraphQL", "Node.js"].map(tech => (
                        <div
                            key={tech}
                            style={{
                                padding: "12px 22px", background: C.white,
                                border: `1.5px solid ${C.border}`, borderRadius: 50,
                                fontSize: 13, fontWeight: 600, color: C.darkMid,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "default",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.background    = C.blueLight;
                                (e.currentTarget as HTMLDivElement).style.borderColor   = C.blue;
                                (e.currentTarget as HTMLDivElement).style.color         = C.blueDark;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.background    = C.white;
                                (e.currentTarget as HTMLDivElement).style.borderColor   = C.border;
                                (e.currentTarget as HTMLDivElement).style.color         = C.darkMid;
                            }}
                        >{tech}</div>
                    ))}
                </div>
            </section>

            {/* ══ CTA ══ */}
            <section style={{
                background: `linear-gradient(135deg, ${C.blueDeep} 0%, ${C.blueDark} 100%)`,
                padding: "80px 60px", textAlign: "center",
            }}>
                <h2 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900,
                    color: C.white, marginBottom: 16,
                }}>
                    Ready to <em style={{ color: C.blue, fontStyle: "italic" }}>Brew</em> Your Career?
                </h2>
                <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginBottom: 40 }}>
                    Join 12,000+ engineers already building their future on Brewlink.
                </p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    <button
                        onClick={() => { setTab("register"); setError(""); setShowPass(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{
                            padding: "15px 36px", background: C.blue, color: C.blueDeep,
                            border: "none", borderRadius: 50, fontSize: 15, fontWeight: 700,
                            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                            boxShadow: "0 8px 24px rgba(56,189,248,0.4)",
                        }}
                    >Create Free Account</button>
                    <button
                        onClick={() => { setTab("login"); setError(""); setShowPass(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        style={{
                            padding: "15px 36px", background: "transparent", color: C.white,
                            border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 50,
                            fontSize: 15, fontWeight: 500, cursor: "pointer",
                            fontFamily: "'Outfit', sans-serif",
                        }}
                    >Sign In</button>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 32 }}>
                    © 2026 Brewlink Technologies · Free to join, always.
                </p>
            </section>

            <style>{`
                @keyframes ticker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                input:focus { border-color: ${C.blue} !important; }
                input::placeholder { color: ${C.textLight}; }
            `}</style>
        </div>
    );
}

/* ── Error box helper ── */
function ErrorBox({ msg }: { msg: string }) {
    return (
        <p style={{
            fontSize: 13, color: "#c53030", padding: "10px 12px",
            marginBottom: 12, marginTop: 8,
            background: "rgba(197,48,48,0.07)", border: "1px solid rgba(197,48,48,0.2)",
            borderRadius: 8,
        }}>{msg}</p>
    );
}