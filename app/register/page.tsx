"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { REGISTER_MUTATION } from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState("");

  const { login }  = useAuth();
  const router     = useRouter();

  const [doRegister, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      login({ ...data.register.user, token: data.register.token });
      router.push("/feed");
    },
    onError: (e) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    doRegister({ variables: { input: form } });
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#6B4EFF"/>
            <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="14" cy="18" r="3" fill="white"/>
          </svg>
          <span style={s.brandName}>Brewlink</span>
        </div>
        <h1 style={s.tagline}>Join 50,000+<br />engineers.</h1>
        <p style={s.sub}>Build your profile, share your work, and land your next role.</p>
      </div>

      <div style={s.right}>
        <div style={s.card} className="card">
          <h2 style={s.title}>Create account</h2>
          <p style={s.hint}>Start building your engineering profile</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={submit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input className="input" placeholder="jasmeet_d" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showPw ? "text" : "password"} placeholder="Min 8 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={s.eyeBtn}>
                  {showPw ? <IconEyeOff size={16} color="var(--t3)" /> : <IconEye size={16} color="var(--t3)" />}
                </button>
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "11px", borderRadius: 8, fontSize: 15 }}>
              {loading ? <IconLoader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Create account"}
            </button>
          </form>

          <p style={s.switchText}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--purple)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--bg)" },
  left: { background: "var(--purple)", padding: "60px 56px", display: "flex", flexDirection: "column", justifyContent: "center" },
  brand: { display: "flex", alignItems: "center", gap: 12, marginBottom: 48 },
  brandName: { fontSize: 26, fontWeight: 800, color: "#fff" },
  tagline: { fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" },
  sub: { fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 },
  right: { display: "flex", alignItems: "center", justifyContent: "center", padding: 40 },
  card: { width: "100%", maxWidth: 420, padding: 36 },
  title: { fontSize: 24, fontWeight: 800, color: "var(--t1)", marginBottom: 6 },
  hint: { fontSize: 14, color: "var(--t3)", marginBottom: 24 },
  errorBox: { background: "#fff0f0", border: "1px solid #fcc", color: "var(--red)", borderRadius: 6, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  form: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "var(--t2)" },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", display: "flex" },
  switchText: { textAlign: "center", fontSize: 14, color: "var(--t2)", marginTop: 16 } as React.CSSProperties,
};   