"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  SEARCH_USERS_QUERY,
  FOLLOW_MUTATION,
  UNFOLLOW_MUTATION,
} from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  IconSearch, IconUserPlus, IconUserCheck,
  IconLoader2, IconUsers, IconTrendingUp,
  IconRefresh, IconAlertCircle,
} from "@tabler/icons-react";

const SUGGESTED_TAGS = ["Rust", "TypeScript", "GraphQL", "Go", "Python", "PostgreSQL", "React", "Kubernetes"];
const TAG_COLORS: Record<string, string> = {
  Rust: "#ef4444", TypeScript: "#3b82f6", GraphQL: "#ec4899",
  Go: "#06b6d4", Python: "#f59e0b", PostgreSQL: "#6B4EFF",
  React: "#22c55e", Kubernetes: "#8b5cf6",
};
const AVA_COLORS = ["#6B4EFF","#ec4899","#22c55e","#f59e0b","#8b5cf6","#06b6d4","#ef4444","#f97316"];

export default function NetworkPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingIds,  setLoadingIds]  = useState<Set<string>>(new Set());

  // ── THE FIX ──────────────────────────────────────────────────────────────
  // 1. Never skip the query (only gate on !user so we have a token).
  // 2. When nothing is typed, send "a" — matches every username that has at
  //    least one letter, which is all of them. Backend uses ILIKE '%a%'.
  //    This is the same default used in the original code, but now skip=false.
  // 3. fetchPolicy: "network-only" so we don't serve a stale empty cache.
  // ─────────────────────────────────────────────────────────────────────────
  const queryStr = activeTag || search.trim() || "a";

  const { data, loading, error, refetch } = useQuery(SEARCH_USERS_QUERY, {
    variables: { query: queryStr, limit: 50 },
    skip: !user,                    // only skip when no auth token
    fetchPolicy: "network-only",    // always hit the server on mount
    onError: () => {},
  });

  const [followUser]   = useMutation(FOLLOW_MUTATION,   { onError: () => {} });
  const [unfollowUser] = useMutation(UNFOLLOW_MUTATION, { onError: () => {} });

  if (!isLoading && !user) { router.push("/login"); return null; }

  // exclude yourself from the list
  const allUsers: any[] = data?.searchUsers ?? [];
  const filtered = allUsers.filter((u) => u.id !== user?.id);

  const handleFollow = async (targetId: string) => {
    setLoadingIds((p) => new Set(p).add(targetId));
    try {
      if (followedIds.has(targetId)) {
        // Unfollow
        await unfollowUser({ variables: { followingId: targetId } });
        setFollowedIds((p) => { const s = new Set(p); s.delete(targetId); return s; });
      } else {
        try {
          await followUser({ variables: { followingId: targetId } });
          setFollowedIds((p) => new Set(p).add(targetId));
        } catch (err: any) {
          const msg: string = err?.message ?? "";
          // Backend says already following → sync UI button to "Following"
          if (msg.toLowerCase().includes("already following")) {
            setFollowedIds((p) => new Set(p).add(targetId));
          }
          // Any other error: silently swallow (no crash)
        }
      }
    } finally {
      setLoadingIds((p) => { const s = new Set(p); s.delete(targetId); return s; });
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "var(--nav-h)", background: "var(--bg)", minHeight: "100vh", padding: "24px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px" }}>

          {/* ── Header ── */}
          <div style={s.header}>
            <div>
              <h1 style={s.pageTitle}>Grow Your Network</h1>
              <p style={{ fontSize: 14, color: "var(--t3)", marginTop: 2 }}>
                Discover engineers, follow their work, build connections
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { icon: IconUsers,      label: "Followers",  value: user?.followerCount  ?? 0 },
                { icon: IconTrendingUp, label: "Following",  value: user?.followingCount ?? 0 },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={18} color="var(--purple)" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t1)" }}>{value}</div>
                    <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", marginBottom: 14 }}>
            <IconSearch size={16} color="var(--t3)" />
            <input
              placeholder="Search engineers by name…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTag(null); }}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, flex: 1, color: "var(--t1)", fontFamily: "inherit" }}
            />
            {(search || activeTag) && (
              <button onClick={() => { setSearch(""); setActiveTag(null); }}
                style={{ fontSize: 12, color: "var(--t3)", background: "transparent", padding: "2px 8px" }}>
                Clear
              </button>
            )}
            <button onClick={() => refetch()} title="Refresh"
              style={{ background: "transparent", border: "none", display: "flex", cursor: "pointer", padding: 4, borderRadius: 6 }}>
              <IconRefresh size={15} color={loading ? "var(--purple)" : "var(--t3)"}
                style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>

          {/* ── Skill tags ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 600, whiteSpace: "nowrap" as const }}>Browse by skill:</span>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {SUGGESTED_TAGS.map((tag) => {
                const color = TAG_COLORS[tag] ?? "var(--purple)";
                const active = activeTag === tag;
                return (
                  <button key={tag}
                    onClick={() => { setActiveTag(active ? null : tag); setSearch(""); }}
                    style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: active ? color : color + "15", color: active ? "#fff" : color,
                      border: `1px solid ${color}30`, transition: "all 0.15s" }}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #fcc", color: "var(--red)", borderRadius: 8,
              padding: "12px 16px", marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
              <IconAlertCircle size={16} />
              <span>Failed to load users: <strong>{error.message}</strong></span>
              <button onClick={() => refetch()}
                style={{ marginLeft: "auto", color: "var(--purple)", background: "transparent", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>
                Retry
              </button>
            </div>
          )}

          {/* ── Results count ── */}
          {!loading && !error && (
            <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 12, fontWeight: 600 }}>
              {filtered.length} {filtered.length === 1 ? "engineer" : "engineers"} found
            </div>
          )}

          {/* ── Loading spinner ── */}
          {loading && (
            <div style={{ textAlign: "center", padding: 48 }}>
              <IconLoader2 size={24} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 10 }}>Loading engineers…</div>
            </div>
          )}

          {/* ── User grid ── */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {filtered.map((u: any, i: number) => {
                const isFollowing  = followedIds.has(u.id);
                const isBtnLoading = loadingIds.has(u.id);
                const color   = AVA_COLORS[i % AVA_COLORS.length];
                const initials = u.username?.slice(0, 2).toUpperCase() ?? "??";

                return (
                  <div key={u.id} className="card fade" style={{ padding: 16 }}>
                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div className="ava"
                        style={{ width: 48, height: 48, background: color + "20", color, fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                          {u.username}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <IconUsers size={11} />
                          {(u.followerCount ?? 0).toLocaleString()} followers
                        </div>
                      </div>
                    </div>

                    {/* Follow button */}
                    <button
                      onClick={() => handleFollow(u.id)}
                      disabled={isBtnLoading}
                      className={isFollowing ? "btn-outline" : "btn-primary"}
                      style={{ width: "100%", justifyContent: "center", padding: "8px", borderRadius: 8, fontSize: 13 }}>
                      {isBtnLoading
                        ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        : isFollowing
                        ? <><IconUserCheck size={14} /> Following</>
                        : <><IconUserPlus size={14} /> Follow</>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 48 }}>
              <IconUsers size={40} color="var(--border2)" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t2)", marginBottom: 6 }}>
                {search || activeTag ? "No engineers match your search" : "No other users yet"}
              </div>
              <div style={{ fontSize: 13, color: "var(--t3)" }}>
                {search || activeTag ? "Try a different name or skill" : "Be the first to invite engineers!"}
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  header:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.02em" },
};