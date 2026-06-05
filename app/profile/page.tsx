"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { ME_QUERY, USER_POSTS_QUERY } from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { IconEdit, IconShare, IconMapPin, IconBriefcase, IconHeart, IconMessageCircle, IconLoader2 } from "@tabler/icons-react";

const techColors = ["#6B4EFF","#ec4899","#22c55e","#f59e0b","#8b5cf6","#06b6d4","#ef4444"];
const tabs = ["Posts", "Experience", "Projects", "Certificates", "Skills"];

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Posts");
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  const { data: meData } = useQuery(ME_QUERY, { skip: !user, onError: () => {} });
  const me = meData?.me ?? user;

  const { data: postsData, loading: postsLoading } = useQuery(USER_POSTS_QUERY, {
    variables: { userId: me?.id ?? "" },
    skip: !me?.id,
    onError: () => {},
  });

  if (!isLoading && !user) { router.push("/login"); return null; }

  const posts = postsData?.userPosts ?? [];
  const initials = me?.username?.slice(0, 2).toUpperCase() ?? "JD";

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "var(--nav-h)", background: "var(--bg)", minHeight: "100vh", padding: "20px 0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>

          {/* Profile card */}
          <div className="card fade" style={{ overflow: "hidden", marginBottom: 12 }}>
            {/* Banner */}
            <div style={s.banner} />

            <div style={s.profileBody}>
              {/* Avatar */}
              <div style={s.avaWrap}>
                <div className="ava" style={{ width: 80, height: 80, background: "var(--purple-light)", color: "var(--purple)", fontSize: 24, fontWeight: 800, border: "4px solid #fff", boxShadow: "0 0 0 2px var(--purple-light)" }}>
                  {initials}
                </div>
              </div>

              <div style={s.profileTop}>
                <div>
                  <h1 style={s.profileName}>{me?.username ?? "Loading..."}</h1>
                  <p style={s.profileRole}>Full Stack Developer · Backend Engineer</p>
                  <p style={s.profileLocation}><IconMapPin size={13} /> Ludhiana, Punjab · <span style={{ color: "var(--purple)", fontWeight: 600 }}>500+ connections</span></p>
                </div>
                <div style={s.profileActions}>
                  <button className="btn-primary" style={{ borderRadius: 6 }}><IconEdit size={14} /> Edit Profile</button>
                  <button className="btn-outline" style={{ borderRadius: 6 }}><IconShare size={14} /> Share</button>
                </div>
              </div>

              {/* Stats */}
              <div style={s.statsRow}>
                {[["Posts", "142"], ["Followers", me?.followerCount ?? "0"], ["Following", me?.followingCount ?? "0"]].map(([label, val]) => (
                  <div key={label} style={s.stat}>
                    <strong style={s.statVal}>{val}</strong>
                    <span style={s.statLabel}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Tech stack */}
              <div style={{ padding: "0 20px 20px", display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {["Rust", "PostgreSQL", "GraphQL", "async-graphql", "axum", "Next.js", "TypeScript"].map((t, i) => (
                  <span key={t} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: techColors[i % techColors.length] + "18", color: techColors[i % techColors.length], border: `1px solid ${techColors[i % techColors.length]}30` }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Content tabs */}
          <div className="card fade fade-1" style={{ overflow: "hidden" }}>
            <div style={s.tabs}>
              {tabs.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}>{t}</button>
              ))}
            </div>

            {activeTab === "Posts" && (
              postsLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}><IconLoader2 size={22} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} /></div>
              ) : posts.length > 0 ? (
                <div style={s.grid}>
                  {posts.map((p: any) => (
                    <div key={p.id} style={s.gridPost} onMouseEnter={() => setHoveredPost(p.id)} onMouseLeave={() => setHoveredPost(null)}>
                      <div style={s.gridPostBg} />
                      {hoveredPost === p.id && (
                        <div style={s.gridOverlay}>
                          <span style={s.overlayStat}><IconHeart size={14} fill="white" color="white" /> {p.likeCount}</span>
                          <span style={s.overlayStat}><IconMessageCircle size={14} color="white" /> {p.commentCount}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={s.emptyTab}>No posts yet. Share your first post!</div>
              )
            )}

            {activeTab === "Experience" && (
              <div style={{ padding: 20 }}>
                {[
                  { role: "Senior Backend Engineer", company: "Stealth Startup", period: "2024 – Present", desc: "Building high-throughput APIs in Rust + axum + async-graphql." },
                  { role: "Backend Developer",        company: "TechFlow Inc.",   period: "2022 – 2024",    desc: "GraphQL APIs, PostgreSQL optimization, team of 8 engineers." },
                ].map((e, i) => (
                  <div key={i} style={s.expItem}>
                    <div style={s.expIcon}><IconBriefcase size={16} color="var(--purple)" /></div>
                    <div>
                      <strong style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", display: "block" }}>{e.role}</strong>
                      <span style={{ fontSize: 13, color: "var(--purple)", fontWeight: 600 }}>{e.company}</span>
                      <span style={{ fontSize: 12, color: "var(--t3)", marginLeft: 8 }}>{e.period}</span>
                      <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 4, lineHeight: 1.6 }}>{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(activeTab === "Projects" || activeTab === "Certificates" || activeTab === "Skills") && (
              <div style={s.emptyTab}>No {activeTab.toLowerCase()} added yet.</div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  banner: { height: 120, background: "linear-gradient(135deg, #6B4EFF 0%, #a78bfa 60%, #ec4899 100%)" },
  profileBody: {},
  avaWrap: { padding: "0 20px", marginTop: -40, marginBottom: 12 },
  profileTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 20px", flexWrap: "wrap" as const, gap: 12, marginBottom: 12 },
  profileName: { fontSize: 22, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.02em", marginBottom: 4 },
  profileRole: { fontSize: 14, color: "var(--t2)", marginBottom: 4 },
  profileLocation: { fontSize: 13, color: "var(--t3)", display: "flex", alignItems: "center", gap: 4 },
  profileActions: { display: "flex", gap: 8 },
  statsRow: { display: "flex", gap: 0, padding: "0 20px 16px", borderBottom: "1px solid var(--border)" },
  stat: { display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1, borderRight: "1px solid var(--border)", padding: "8px 0" },
  statVal: { fontSize: 20, fontWeight: 800, color: "var(--t1)" },
  statLabel: { fontSize: 11, color: "var(--t3)", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  tabs: { display: "flex", borderBottom: "1px solid var(--border)", padding: "0 16px" },
  tab: { fontSize: 13, fontWeight: 600, padding: "12px 16px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "var(--t3)", cursor: "pointer", marginBottom: -1, transition: "all 0.15s" },
  tabActive: { color: "var(--purple)", borderBottomColor: "var(--purple)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, padding: 8 },
  gridPost: { aspectRatio: "1", borderRadius: 6, overflow: "hidden", cursor: "pointer", position: "relative" },
  gridPostBg: { position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a1d2e,#2d1b4e)" },
  gridOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 },
  overlayStat: { fontSize: 13, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 },
  emptyTab: { padding: 40, textAlign: "center" as const, color: "var(--t3)", fontSize: 14 },
  expItem: { display: "flex", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" },
  expIcon: { width: 38, height: 38, borderRadius: 10, background: "var(--purple-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};