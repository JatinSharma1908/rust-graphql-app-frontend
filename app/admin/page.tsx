"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ADMIN_USERS_QUERY, ADMIN_POSTS_QUERY, JOBS_QUERY, SUSPEND_USER_MUTATION, DELETE_POST_MUTATION, DELETE_JOB_MUTATION } from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { IconTrendingUp, IconTrendingDown, IconBan, IconTrash, IconRefresh, IconUsers, IconArticle, IconBriefcase, IconAlertTriangle } from "@tabler/icons-react";

const kpis = [
  { label: "Total Users",  value: "12,483", trend: "+8%",  up: true,  icon: IconUsers,         color: "#6B4EFF", bg: "#ede9ff" },
  { label: "Posts",        value: "84,312", trend: "+15%", up: true,  icon: IconArticle,        color: "#ec4899", bg: "#fce7f3" },
  { label: "Job Listings", value: "5,201",  trend: "+3%",  up: true,  icon: IconBriefcase,      color: "#22c55e", bg: "#dcfce7" },
  { label: "Suspended",    value: "47",     trend: "−2",   up: false, icon: IconAlertTriangle,  color: "#f59e0b", bg: "#fef3c7" },
];

const mockUsers = [
  { id: "1", username: "rahul_sharma", email: "rs@gmail.com",   role: "user",      status: "active",    followerCount: 1200 },
  { id: "2", username: "anika_k",      email: "ak@outlook.com", role: "user",      status: "active",    followerCount: 340 },
  { id: "3", username: "spam_bot99",   email: "bot@fake.io",    role: "user",      status: "suspended", followerCount: 0 },
  { id: "4", username: "priya_v",      email: "pv@proton.me",   role: "recruiter", status: "active",    followerCount: 2800 },
];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Users");

  const { data: usersData, refetch: refetchUsers } = useQuery(ADMIN_USERS_QUERY, { skip: !user, onError: () => {} });
  const { data: postsData }  = useQuery(ADMIN_POSTS_QUERY, { skip: !user, onError: () => {} });
  const { data: jobsData }   = useQuery(JOBS_QUERY,        { skip: !user, onError: () => {} });

  const [suspendUser] = useMutation(SUSPEND_USER_MUTATION,  { onCompleted: () => refetchUsers(), onError: () => {} });
  const [deletePost]  = useMutation(DELETE_POST_MUTATION,   { onError: () => {} });
  const [deleteJob]   = useMutation(DELETE_JOB_MUTATION,    { onError: () => {} });

  if (!isLoading && !user) { router.push("/login"); return null; }

  const users = usersData?.adminUsers ?? mockUsers;
  const posts = postsData?.adminPosts ?? [];
  const jobs  = jobsData?.jobs        ?? [];

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "var(--nav-h)", background: "var(--bg)", minHeight: "100vh", padding: "24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>

          <div style={s.pageHeader}>
            <div>
              <h1 style={s.pageTitle}>Admin Dashboard</h1>
              <p style={{ fontSize: 13, color: "var(--t3)" }}>Brewlink platform management</p>
            </div>
            <div style={s.adminBadge}>ADMIN</div>
          </div>

          {/* KPIs */}
          <div style={s.kpiGrid}>
            {kpis.map((k) => {
              const KIcon = k.icon;
              return (
                <div key={k.label} className="card fade" style={s.kpi}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <KIcon size={18} color={k.color} />
                    </div>
                    <div style={{ ...s.trendBadge, background: k.up ? "#dcfce7" : "#fee2e2", color: k.up ? "#16a34a" : "#dc2626" }}>
                      {k.up ? <IconTrendingUp size={11} /> : <IconTrendingDown size={11} />} {k.trend}
                    </div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.02em" }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginTop: 2 }}>{k.label}</div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="card fade fade-1" style={{ overflow: "hidden" }}>
            <div style={s.tableHeader}>
              <div style={s.tabs}>
                {["Users", "Posts", "Jobs"].map((t) => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}>{t}</button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "var(--t3)" }}>
                {activeTab === "Users" ? users.length : activeTab === "Posts" ? posts.length : jobs.length} records
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              {activeTab === "Users" && (
                <table style={s.table}>
                  <thead><tr>{["User", "Email", "Role", "Followers", "Status", "Actions"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: u.status === "suspended" ? "#fee2e2" : "var(--purple-light)", color: u.status === "suspended" ? "#dc2626" : "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{u.username[0].toUpperCase()}</div>
                            <span style={{ fontWeight: 600 }}>{u.username}</span>
                          </div>
                        </td>
                        <td style={{ ...s.td, color: "var(--t3)" }}>{u.email}</td>
                        <td style={s.td}><span style={s.roleBadge}>{u.role}</span></td>
                        <td style={{ ...s.td, color: "var(--t3)" }}>{u.followerCount?.toLocaleString() ?? 0}</td>
                        <td style={s.td}><span style={{ ...s.statusBadge, ...(u.status === "active" ? s.badgeGreen : s.badgeRed) }}>{u.status}</span></td>
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={s.actionBtn} title={u.status === "active" ? "Suspend" : "Restore"}
                              onClick={() => suspendUser({ variables: { userId: u.id, status: u.status === "active" ? "suspended" : "active" } })}>
                              {u.status === "active" ? <IconBan size={14} color="#f59e0b" /> : <IconRefresh size={14} color="#22c55e" />}
                            </button>
                            <button style={s.actionBtn}><IconTrash size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "Posts" && (
                <table style={s.table}>
                  <thead><tr>{["Post ID", "User ID", "Caption", "Visibility", "Likes", "Actions"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {posts.length === 0
                      ? <tr><td colSpan={6} style={{ ...s.td, textAlign: "center" as const, padding: 32, color: "var(--t3)" }}>No posts loaded</td></tr>
                      : posts.map((p: any) => (
                        <tr key={p.id}>
                          <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "var(--t3)" }}>{p.id?.slice(0, 8)}…</td>
                          <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "var(--t3)" }}>{p.userId?.slice(0, 8)}…</td>
                          <td style={s.td}>{p.caption?.slice(0, 45) ?? "—"}</td>
                          <td style={s.td}><span style={{ ...s.statusBadge, ...(p.visibility === "public" ? s.badgeGreen : s.badgeRed) }}>{p.visibility}</span></td>
                          <td style={{ ...s.td, color: "var(--t3)" }}>{p.likeCount ?? 0}</td>
                          <td style={s.td}><button style={s.actionBtn} onClick={() => deletePost({ variables: { postId: p.id } })}><IconTrash size={14} color="#ef4444" /></button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}

              {activeTab === "Jobs" && (
                <table style={s.table}>
                  <thead><tr>{["Title", "Company", "Location", "Type", "Posted", "Actions"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {jobs.length === 0
                      ? <tr><td colSpan={6} style={{ ...s.td, textAlign: "center" as const, padding: 32, color: "var(--t3)" }}>No jobs loaded</td></tr>
                      : jobs.map((j: any) => (
                        <tr key={j.id}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{j.title}</td>
                          <td style={{ ...s.td, color: "var(--t3)" }}>{j.companyName}</td>
                          <td style={{ ...s.td, color: "var(--t3)" }}>{j.location}</td>
                          <td style={s.td}><span style={s.roleBadge}>{j.jobType}</span></td>
                          <td style={{ ...s.td, color: "var(--t3)", fontSize: 11 }}>{j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "—"}</td>
                          <td style={s.td}><button style={s.actionBtn} onClick={() => deleteJob({ variables: { jobId: j.id } })}><IconTrash size={14} color="#ef4444" /></button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.02em", marginBottom: 2 },
  adminBadge: { padding: "5px 14px", borderRadius: 6, background: "var(--purple-light)", color: "var(--purple)", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", border: "1px solid rgba(107,78,255,0.2)" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 },
  kpi: { padding: 16 },
  trendBadge: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 },
  tableHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" },
  tabs: { display: "flex", gap: 4 },
  tab: { fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "none", background: "transparent", color: "var(--t3)", cursor: "pointer" },
  tabActive: { background: "var(--purple-light)", color: "var(--purple)" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--t3)", textAlign: "left" as const, padding: "10px 16px", background: "var(--bg)", borderBottom: "1px solid var(--border)" },
  td: { fontSize: 13, color: "var(--t1)", padding: "11px 16px", borderBottom: "1px solid var(--border)" },
  roleBadge: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--t2)" },
  statusBadge: { display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  badgeGreen: { background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" },
  badgeRed: { background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" },
  actionBtn: { width: 30, height: 30, borderRadius: 7, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" },
};