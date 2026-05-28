"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION } from "@/lib/graphql";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");

    const [login, { loading }] = useMutation(LOGIN_MUTATION, {
        onCompleted(data: any) {
            localStorage.setItem("token", data.login.token);
            localStorage.setItem("user", JSON.stringify(data.login.user));
            router.push("/home");
        },
        onError(err) { setError(err.message); },
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        login({ variables: { input: form } });
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", background: "#F2F0EB" }}>

            {/* LEFT — branding */}
            <div style={{
                flex: 1, background: "#1E3932",
                padding: "48px 52px",
                display: "flex", flexDirection: "column",
                justifyContent: "space-between",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", top: -120, right: -80,
                    width: 400, height: 400, borderRadius: "50%",
                    background: "rgba(0,112,74,0.35)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: -80, left: -60,
                    width: 280, height: 280, borderRadius: "50%",
                    background: "rgba(203,162,88,0.12)", pointerEvents: "none",
                }} />

                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", textDecoration: "none" }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "#00704A", border: "2px solid #CBA258",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 14, color: "#CBA258", fontWeight: 700,
                    }}>B</div>
                    <span style={{
                        fontSize: 13, letterSpacing: "0.2em",
                        textTransform: "uppercase", color: "rgba(255,255,255,0.85)", fontWeight: 500,
                    }}>Brewlink</span>
                </Link>

                <div style={{ position: "relative" }}>
                    <div style={{
                        display: "inline-block", background: "rgba(203,162,88,0.2)",
                        color: "#CBA258", fontSize: 11, letterSpacing: "0.15em",
                        textTransform: "uppercase", padding: "5px 12px", borderRadius: 20,
                        border: "1px solid rgba(203,162,88,0.35)", marginBottom: 24,
                    }}>✦ Welcome back</div>
                    <h1 style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 52, fontWeight: 900, lineHeight: 1.05,
                        color: "#ffffff", marginBottom: 20,
                    }}>
                        Good to<br />see you<br />
                        <span style={{ color: "#CBA258" }}>again</span>
                    </h1>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, maxWidth: 360 }}>
                        Sign in to your Brewlink account and continue building your career where you left off.
                    </p>
                </div>

                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", position: "relative" }}>
                    © 2026 Brewlink Technologies
                </p>
            </div>

            {/* RIGHT — form */}
            <div style={{
                width: 460, background: "#ffffff",
                display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "52px 48px", position: "relative",
            }}>
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 4,
                    background: "linear-gradient(90deg, #00704A, #CBA258)",
                }} />

                {/* Tab bar */}
                <div style={{
                    display: "flex", gap: 4,
                    background: "#F2F0EB", borderRadius: 10,
                    padding: 4, marginBottom: 32,
                }}>
                    <div style={{
                        flex: 1, padding: "9px", background: "#ffffff",
                        borderRadius: 7, textAlign: "center",
                        fontSize: 13, fontWeight: 600, color: "#1E3932",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}>Sign In</div>
                    <Link href="/register" style={{
                        flex: 1, padding: "9px", background: "transparent",
                        borderRadius: 7, textAlign: "center",
                        fontSize: 13, fontWeight: 500, color: "#718096",
                        textDecoration: "none", display: "block",
                    }}>Create Account</Link>
                </div>

                <h2 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28, fontWeight: 700, color: "#1a1a1a", marginBottom: 6,
                }}>Welcome back</h2>
                <p style={{ fontSize: 14, color: "#718096", marginBottom: 28, lineHeight: 1.6 }}>
                    Sign in to continue on Brewlink.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Username</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required autoFocus autoComplete="username"
                            placeholder="your_username"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                            <label style={labelStyle}>Password</label>
                            <a href="#" style={{ fontSize: 12, color: "#00704A", textDecoration: "none", fontWeight: 500 }}>
                                Forgot password?
                            </a>
                        </div>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPass ? "text" : "password"}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required autoComplete="current-password"
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                style={{
                                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                    fontSize: 11, color: "#00704A", background: "none", border: "none",
                                    cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                }}
                            >{showPass ? "Hide" : "Show"}</button>
                        </div>
                    </div>

                    {error && (
                        <p style={{
                            fontSize: 13, color: "#c53030", padding: "10px 12px", marginBottom: 12,
                            background: "rgba(197,48,48,0.07)", border: "1px solid rgba(197,48,48,0.2)",
                            borderRadius: 8,
                        }}>{error}</p>
                    )}

                    <button type="submit" disabled={loading} style={{
                        padding: 13, background: loading ? "#e2e8f0" : "#00704A",
                        color: loading ? "#a0aec0" : "#fff",
                        border: "none", borderRadius: 8,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                        fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                        marginTop: 16,
                        boxShadow: loading ? "none" : "0 4px 16px rgba(0,112,74,0.3)",
                    }}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                    <span style={{ fontSize: 12, color: "#b0b8c1" }}>or continue with</span>
                    <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    {["Google", "GitHub"].map(p => (
                        <button key={p} style={{
                            flex: 1, padding: "10px", border: "1.5px solid #e2e8f0",
                            background: "#fff", borderRadius: 8, cursor: "pointer",
                            fontFamily: "'Outfit', sans-serif", fontSize: 12, color: "#4a5568", fontWeight: 500,
                        }}>{p}</button>
                    ))}
                </div>

                <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
                    <p style={{ fontSize: 13, color: "#718096" }}>
                        Don&apos;t have an account?{" "}
                        <Link href="/register" style={{ color: "#00704A", fontWeight: 600, textDecoration: "none" }}>
                            Create one →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 5,
    fontSize: 12, fontWeight: 600, color: "#4a5568",
    letterSpacing: "0.04em", textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
    padding: "11px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    color: "#1a1a1a", outline: "none", width: "100%",
    background: "#FAFAF9",
};