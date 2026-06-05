"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  FEED_QUERY,
  CREATE_POST_MUTATION,
  LIKE_POST_MUTATION,
  UNLIKE_POST_MUTATION,
  ADD_COMMENT_MUTATION,
  POST_COMMENTS_QUERY,
  FOLLOW_MUTATION,
  SEARCH_USERS_QUERY,
} from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconShare3,
  IconBookmark,
  IconBookmarkFilled,
  IconDots,
  IconWorld,
  IconPhoto,
  IconVideo,
  IconCode,
  IconBriefcase,
  IconLoader2,
  IconSend,
  IconX,
  IconTrendingUp,
  IconUsers,
  IconChevronRight,
  IconBuildingSkyscraper,
  IconSparkles,
} from "@tabler/icons-react";

/* ── Types ── */
interface Post {
  id: string;
  userId: string;
  caption: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  visibility: string;
  likeCount: number;
  commentCount: number;
}

/* ── Mock data (fallback while backend spins up) ── */
const MOCK_POSTS: Post[] = [
  {
    id: "1",
    userId: "me",
    caption:
      "Just shipped a GraphQL backend in Rust using async-graphql and sqlx.\nLoving the performance! 🚀\n#rustlang #graphql #backend #webdev",
    thumbnailUrl: "",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    visibility: "public",
    likeCount: 120,
    commentCount: 32,
  },
  {
    id: "2",
    userId: "priya",
    caption:
      "Automated my AWS infrastructure using Terraform and GitHub Actions.\nHere's how I reduced deployment time by 60% 👇",
    thumbnailUrl: "",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    visibility: "public",
    likeCount: 84,
    commentCount: 19,
  },
  {
    id: "3",
    userId: "manish",
    caption:
      "Open-sourced my Rust CLI tool for managing PostgreSQL migrations. Stars appreciated ⭐\ngithub.com/manish/pgmigrate\n#opensource #rust #postgres",
    thumbnailUrl: "",
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    visibility: "public",
    likeCount: 247,
    commentCount: 41,
  },
];

const MOCK_PEOPLE = [
  { id: "p1", username: "Priya Verma",   role: "Senior DevOps Engineer",  followerCount: 1200, initials: "PV", color: "#22c55e" },
  { id: "p2", username: "Manish Kumar",  role: "Backend Engineer",         followerCount: 3400, initials: "MK", color: "#6B4EFF" },
  { id: "p3", username: "Archi Talks",   role: "Tech Content Creator",     followerCount: 876,  initials: "AT", color: "#f59e0b" },
];

const TRENDING_TECH = [
  { label: "Rust",       color: "#ef4444", bg: "#fef2f2" },
  { label: "GraphQL",    color: "#ec4899", bg: "#fdf2f8" },
  { label: "Next.js",    color: "#1a1a1a", bg: "#f3f2ee" },
  { label: "TypeScript", color: "#3b82f6", bg: "#eff6ff" },
  { label: "Docker",     color: "#06b6d4", bg: "#ecfeff" },
  { label: "PostgreSQL", color: "#6B4EFF", bg: "#ede9ff" },
  { label: "Kubernetes", color: "#8b5cf6", bg: "#f5f3ff" },
  { label: "AI / ML",    color: "#f59e0b", bg: "#fffbeb" },
];

const HIRING = [
  { name: "Microsoft", roles: "1,234 open roles", color: "#00a4ef", logo: "MS" },
  { name: "Google",    roles: "856 open roles",   color: "#34a853", logo: "G" },
  { name: "Amazon",    roles: "1,023 open roles",  color: "#ff9900", logo: "A" },
  { name: "Swiggy",    roles: "312 open roles",    color: "#fc8019", logo: "S" },
];

const SUGGESTED_DEVS = [
  { id: "d1", username: "Keshav Sharma", role: "Rust Developer",     followerCount: 2100, initials: "KS", color: "#ef4444" },
  { id: "d2", username: "Ananya Singh",  role: "TypeScript Engineer", followerCount: 1800, initials: "AS", color: "#8b5cf6" },
];

const POST_COLORS: Record<string, string> = {
  me: "#6B4EFF", priya: "#22c55e", manish: "#3b82f6",
};

/* ── Helpers ── */
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)  return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function parseCaption(caption: string) {
  return caption.split(/(\s)(#\w+)/g).map((part, i) =>
    part.startsWith("#")
      ? <span key={i} style={{ color: "var(--purple)", fontWeight: 600, cursor: "pointer" }}>{part}</span>
      : part
  );
}

/* ── Comment drawer ── */
function CommentDrawer({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, loading } = useQuery(POST_COMMENTS_QUERY, {
    variables: { postId },
    skip: !postId,
    onError: () => {},
  });

  const [addComment, { loading: adding }] = useMutation(ADD_COMMENT_MUTATION, {
    onCompleted: () => setText(""),
    onError: () => {},
    refetchQueries: [{ query: POST_COMMENTS_QUERY, variables: { postId } }],
  });

  const comments = data?.postComments ?? [];

  return (
    <div style={cd.overlay} onClick={onClose}>
      <div style={cd.panel} onClick={(e) => e.stopPropagation()}>
        <div style={cd.header}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>Comments</span>
          <button onClick={onClose} style={cd.closeBtn}><IconX size={16} color="var(--t2)" /></button>
        </div>
        <div style={cd.list}>
          {loading && <div style={{ textAlign: "center", padding: 24 }}><IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} /></div>}
          {comments.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--t3)", fontSize: 13 }}>No comments yet. Be the first!</div>
          )}
          {comments.map((c: any) => (
            <div key={c.id} style={cd.comment}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ede9ff", color: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {c.userId?.slice(0, 2).toUpperCase() ?? "??"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", marginBottom: 2 }}>{c.userId?.slice(0, 8)}</div>
                <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5 }}>{c.content}</div>
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>{timeAgo(c.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={cd.inputRow}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--purple-light)", color: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {user?.username?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                addComment({ variables: { input: { postId, content: text.trim() } } });
              }
            }}
            placeholder="Write a comment…"
            style={cd.input}
          />
          <button
            disabled={!text.trim() || adding}
            onClick={() => addComment({ variables: { input: { postId, content: text.trim() } } })}
            style={{ background: "transparent", color: text.trim() ? "var(--purple)" : "var(--t3)", display: "flex", alignItems: "center" }}
          >
            {adding ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <IconSend size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Post Box ── */
function CreatePostBox({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [visibility, setVisibility] = useState("public");

  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: () => { setText(""); setExpanded(false); onPosted(); },
    onError: () => {},
  });

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "SC";

  return (
    <div className="card" style={{ padding: "16px", marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div className="ava" style={{ width: 42, height: 42, background: "var(--purple-light)", color: "var(--purple)", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          {!expanded ? (
            <div
              onClick={() => setExpanded(true)}
              style={{ border: "1.5px solid var(--border)", borderRadius: 24, padding: "10px 18px", cursor: "text", color: "var(--t3)", fontSize: 14, background: "var(--bg)" }}
            >
              What's on your mind, {user?.username?.split("_")[0] ?? "there"}?
            </div>
          ) : (
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`What's on your mind, ${user?.username?.split("_")[0] ?? "there"}?`}
              style={{ width: "100%", border: "1.5px solid var(--purple)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "var(--t1)", background: "var(--bg)", outline: "none", resize: "none", minHeight: 90, fontFamily: "inherit", lineHeight: 1.6 }}
            />
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", alignItems: "center" }}>
        {[
          { icon: IconPhoto,    label: "Photo",     color: "#22c55e" },
          { icon: IconVideo,    label: "Video",     color: "#3b82f6" },
          { icon: IconCode,     label: "Project",   color: "#f59e0b" },
          { icon: IconBriefcase, label: "Job Share", color: "#8b5cf6" },
        ].map(({ icon: Icon, label, color }) => (
          <button key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6, background: "transparent", fontSize: 13, fontWeight: 600, color: "var(--t2)", transition: "background 0.12s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon size={16} color={color} /> {label}
          </button>
        ))}
        {expanded && (
          <button
            className="btn-primary"
            disabled={!text.trim() || loading}
            onClick={() => createPost({ variables: { input: { caption: text.trim(), visibility } } })}
            style={{ marginLeft: "auto", padding: "7px 20px", borderRadius: 6, fontSize: 13 }}
          >
            {loading ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Post"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Post Card ── */
function PostCard({ post, isMe, username, onComment }: {
  post: Post;
  isMe: boolean;
  username: string;
  onComment: (id: string) => void;
}) {
  const [liked, setLiked]           = useState(false);
  const [likeCount, setLikeCount]   = useState(post.likeCount);
  const [saved, setSaved]           = useState(false);

  const [likePost]   = useMutation(LIKE_POST_MUTATION,   { onError: () => {} });
  const [unlikePost] = useMutation(UNLIKE_POST_MUTATION, { onError: () => {} });

  const handleLike = async () => {
    if (liked) {
      setLiked(false); setLikeCount((c) => c - 1);
      await unlikePost({ variables: { postId: post.id } });
    } else {
      setLiked(true); setLikeCount((c) => c + 1);
      await likePost({ variables: { postId: post.id } });
    }
  };

  // Author avatar info
  const color = POST_COLORS[post.userId] ?? "#6B4EFF";
  const initials = isMe
    ? username.slice(0, 2).toUpperCase()
    : post.userId.slice(0, 2).toUpperCase();

  const displayName = isMe ? username :
    post.userId === "priya" ? "Priya Verma" :
    post.userId === "manish" ? "Manish Kumar" : post.userId;

  const displayRole = isMe ? "Full Stack Developer" :
    post.userId === "priya" ? "DevOps Engineer" :
    post.userId === "manish" ? "Backend Engineer" : "Engineer";

  // Parse caption and split off hashtags
  const lines = post.caption.split("\n");
  const mainText = lines.filter((l) => !l.trim().startsWith("#")).join("\n");
  const tagLine  = lines.find((l) => l.trim().startsWith("#")) ?? "";

  return (
    <div className="card fade post" style={{ marginBottom: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 0" }}>
        <div className="ava" style={{ width: 42, height: 42, background: color + "20", color, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{displayName}</div>
          <div style={{ fontSize: 12, color: "var(--t3)", display: "flex", alignItems: "center", gap: 6 }}>
            {displayRole} · {timeAgo(post.createdAt)}
            <IconWorld size={11} color="var(--t3)" />
          </div>
        </div>
        <button style={{ width: 30, height: 30, borderRadius: 6, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconDots size={16} color="var(--t3)" />
        </button>
      </div>

      {/* Caption */}
      <div style={{ padding: "12px 16px", fontSize: 14, color: "var(--t1)", lineHeight: 1.65 }}>
        <p style={{ marginBottom: tagLine ? 8 : 0, whiteSpace: "pre-line" }}>{mainText}</p>
        {tagLine && (
          <p>{tagLine.split(" ").map((w, i) =>
            w.startsWith("#")
              ? <span key={i} style={{ color: "var(--purple)", fontWeight: 600, marginRight: 6, cursor: "pointer" }}>{w}</span>
              : w + " "
          )}</p>
        )}
      </div>

      {/* Media placeholder (shown only for post id "1" as demo) */}
      {post.id === "1" && (
        <div style={{ margin: "0 16px 12px", borderRadius: 10, overflow: "hidden", background: "#0d0d1a", height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Rust logo placeholder */}
            <div style={{ width: 90, height: 90, borderRadius: "50%", border: "3px solid #888", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#888" }}>R</span>
            </div>
            <span style={{ fontSize: 28, color: "#555", fontWeight: 300 }}>+</span>
            {/* GraphQL logo placeholder */}
            <div style={{ width: 72, height: 72, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <polygon points="36,4 64,20 64,52 36,68 8,52 8,20" stroke="#e535ab" strokeWidth="2.5" fill="none"/>
                <circle cx="36" cy="4"  r="5" fill="#e535ab"/>
                <circle cx="64" cy="20" r="5" fill="#e535ab"/>
                <circle cx="64" cy="52" r="5" fill="#e535ab"/>
                <circle cx="36" cy="68" r="5" fill="#e535ab"/>
                <circle cx="8"  cy="52" r="5" fill="#e535ab"/>
                <circle cx="8"  cy="20" r="5" fill="#e535ab"/>
                <line x1="36" y1="4" x2="64" y2="52" stroke="#e535ab" strokeWidth="1.5" opacity="0.5"/>
                <line x1="36" y1="4" x2="8"  y2="52" stroke="#e535ab" strokeWidth="1.5" opacity="0.5"/>
                <line x1="8"  y1="20" x2="64" y2="20" stroke="#e535ab" strokeWidth="1.5" opacity="0.5"/>
                <line x1="8"  y1="52" x2="64" y2="52" stroke="#e535ab" strokeWidth="1.5" opacity="0.5"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{ padding: "0 8px", borderTop: "1px solid var(--border)", marginTop: 4 }}>
        <div className="post-actions" style={{ display: "flex" }}>
          <button className={liked ? "liked" : ""} onClick={handleLike} style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", padding: "10px 0", fontSize: 13, fontWeight: 600, color: liked ? "var(--red)" : "var(--t2)", background: "transparent", borderRadius: 4, transition: "all 0.12s" }}>
            {liked ? <IconHeartFilled size={17} /> : <IconHeart size={17} />}
            {likeCount}
          </button>
          <button onClick={() => onComment(post.id)} style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", padding: "10px 0", fontSize: 13, fontWeight: 600, color: "var(--t2)", background: "transparent", borderRadius: 4, transition: "all 0.12s" }}>
            <IconMessageCircle size={17} /> {post.commentCount}
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", padding: "10px 0", fontSize: 13, fontWeight: 600, color: "var(--t2)", background: "transparent", borderRadius: 4, transition: "all 0.12s" }}>
            <IconShare3 size={17} /> 18
          </button>
          <button onClick={() => setSaved((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", padding: "10px 0", fontSize: 13, fontWeight: 600, color: saved ? "var(--purple)" : "var(--t2)", background: "transparent", borderRadius: 4, transition: "all 0.12s" }}>
            {saved ? <IconBookmarkFilled size={17} /> : <IconBookmark size={17} />}
          </button>
        </div>
      </div>

      {/* Likers row */}
      {likeCount > 0 && (
        <div style={{ padding: "8px 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex" }}>
            {["#6B4EFF", "#22c55e", "#ec4899"].map((c, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c + "30", border: "2px solid var(--surface)", marginLeft: i > 0 ? -6 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: c }}>
                {["PV", "MK", "AT"][i]}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--t3)" }}>
            Priya Verma, Manish Kumar and {likeCount > 2 ? `${likeCount - 2} others` : "1 other"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--t3)", cursor: "pointer" }}>
            {post.commentCount} comments
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Left Sidebar ── */
function LeftSidebar({ user }: { user: any }) {
  const router = useRouter();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "SC";

  const navItems = [
    { icon: "🏠", label: "Feed",            href: "/feed",     active: true },
    { icon: "💼", label: "Jobs",            href: "/jobs" },
    { icon: "💬", label: "Messages",        href: "/messages", badge: 6 },
    { icon: "👤", label: "Profile",         href: "/profile" },
    { icon: "🔖", label: "Saved",           href: "/saved" },
    { icon: "📋", label: "My Applications", href: "/applications" },
    { icon: "⚙️",  label: "Settings",       href: "/settings" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Profile card */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ height: 60, background: "linear-gradient(135deg, #6B4EFF 0%, #a78bfa 60%, #ec4899 100%)" }} />
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ marginTop: -24, marginBottom: 8 }}>
            <div className="ava" style={{ width: 48, height: 48, background: "var(--purple-light)", color: "var(--purple)", fontSize: 16, fontWeight: 800, border: "3px solid #fff" }}>
              {initials}
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>{user?.username ?? "Sahil Chettri"}</div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 10 }}>Full Stack Developer</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {[["120", "Followers"], ["85", "Following"]].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)" }}>{val}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>{lbl}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="btn-outline"
            style={{ width: "100%", justifyContent: "center", borderRadius: 6, fontSize: 13, padding: "7px 0" }}
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Nav items */}
      <div className="card" style={{ padding: "8px 0" }}>
        {navItems.map(({ icon, label, href, active, badge }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", background: active ? "var(--purple-light)" : "transparent",
              color: active ? "var(--purple)" : "var(--t2)", fontSize: 14, fontWeight: active ? 700 : 500,
              borderRadius: 0, transition: "background 0.12s", justifyContent: "flex-start",
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
            {badge && (
              <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10, background: "var(--purple)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Upgrade card */}
      <div className="card" style={{ padding: "16px", textAlign: "center", border: "1px solid rgba(107,78,255,0.2)", background: "linear-gradient(135deg, rgba(107,78,255,0.04) 0%, rgba(167,139,250,0.06) 100%)" }}>
        <IconSparkles size={22} color="var(--purple)" style={{ margin: "0 auto 8px" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--purple)", marginBottom: 4 }}>Upgrade to Brewlink Pro</div>
        <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 12, lineHeight: 1.5 }}>Unlock premium features and stand out to recruiters.</div>
        <button className="btn-primary" style={{ width: "100%", justifyContent: "center", borderRadius: 6, fontSize: 13, padding: "8px 0" }}>
          Upgrade Now →
        </button>
      </div>
    </div>
  );
}

/* ── Right Sidebar ── */
function RightSidebar() {
  const router = useRouter();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const [followUser] = useMutation(FOLLOW_MUTATION, { onError: () => {} });

  const handleFollow = async (id: string) => {
    setFollowingIds((s) => new Set(s).add(id));
    await followUser({ variables: { followingId: id } });
    setFollowedIds((s) => new Set(s).add(id));
    setFollowingIds((s) => { const ns = new Set(s); ns.delete(id); return ns; });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* People you may know */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <div style={rs.sectionHead}>
          <span style={rs.sectionTitle}>People you may know</span>
          <button onClick={() => router.push("/network")} style={rs.seeAll}>See all</button>
        </div>
        {MOCK_PEOPLE.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: p.color + "20", color: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {p.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.username}</div>
              <div style={{ fontSize: 11, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.role}</div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>{(p.followerCount / 1000).toFixed(1)}k followers</div>
            </div>
            <button
              onClick={() => !followedIds.has(p.id) && handleFollow(p.id)}
              className={followedIds.has(p.id) ? "btn-outline" : "btn-outline"}
              style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, color: followedIds.has(p.id) ? "var(--t3)" : "var(--purple)", borderColor: followedIds.has(p.id) ? "var(--border)" : "var(--purple)" }}
            >
              {followingIds.has(p.id) ? "..." : followedIds.has(p.id) ? "Following" : "Connect"}
            </button>
          </div>
        ))}
      </div>

      {/* Trending Technologies */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <div style={rs.sectionHead}>
          <span style={rs.sectionTitle}>Trending Technologies</span>
          <button style={rs.seeAll}>See all</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TRENDING_TECH.map(({ label, color, bg }) => (
            <span key={label} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${color}25`, cursor: "pointer" }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Hiring Companies */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <div style={rs.sectionHead}>
          <span style={rs.sectionTitle}>Hiring Companies</span>
          <button onClick={() => router.push("/jobs")} style={rs.seeAll}>See all</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {HIRING.map((h) => (
            <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: h.color + "20", color: h.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                {h.logo}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)" }}>{h.name}</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>{h.roles}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Developers */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <div style={rs.sectionHead}>
          <span style={rs.sectionTitle}>Suggested Developers</span>
          <button onClick={() => router.push("/network")} style={rs.seeAll}>See all</button>
        </div>
        {SUGGESTED_DEVS.map((d) => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: d.color + "20", color: d.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {d.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{d.username}</div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>{d.role} · {(d.followerCount / 1000).toFixed(1)}k followers</div>
            </div>
            <button className="btn-outline" style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, flexShrink: 0 }}>
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Feed Page ── */
export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(FEED_QUERY, {
    variables: { input: { limit: 20 } },
    skip: !user,
    onError: () => {},
  });

  if (!isLoading && !user) { router.push("/login"); return null; }

  const posts: Post[] = data?.feed?.length ? data.feed : MOCK_POSTS;

  return (
    <>
      <Navbar />
      <div className="page-body" style={{ marginTop: "var(--nav-h)" }}>
        {/* Left col */}
        <div className="left-col">
          <LeftSidebar user={user} />
        </div>

        {/* Center feed */}
        <div>
          <CreatePostBox onPosted={refetch} />
          {loading && (
            <div style={{ textAlign: "center", padding: 32 }}>
              <IconLoader2 size={24} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isMe={post.userId === "me" || post.userId === user?.id}
              username={user?.username ?? "Sahil Chettri"}
              onComment={setCommentPostId}
            />
          ))}
          {!loading && posts.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>
              <IconUsers size={40} color="var(--border2)" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t2)", marginBottom: 6 }}>Your feed is empty</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Follow engineers to see their posts here.</div>
              <button className="btn-primary" onClick={() => router.push("/network")} style={{ margin: "0 auto", borderRadius: 6 }}>
                <IconUsers size={14} /> Discover Engineers
              </button>
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="right-col">
          <RightSidebar />
        </div>
      </div>

      {/* Comment drawer */}
      {commentPostId && (
        <CommentDrawer
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .post-actions button:hover { background: var(--bg) !important; }
      `}</style>
    </>
  );
}

/* ── Comment drawer styles ── */
const cd: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  panel: { background: "var(--surface)", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 600, maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" },
  header: { padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { width: 28, height: 28, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" },
  list: { flex: 1, overflowY: "auto", padding: "8px 0" },
  comment: { display: "flex", gap: 10, padding: "10px 16px" },
  inputRow: { padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" },
  input: { flex: 1, border: "1px solid var(--border)", borderRadius: 20, padding: "9px 14px", fontSize: 13, outline: "none", background: "var(--bg)", color: "var(--t1)", fontFamily: "inherit" },
};

/* ── Right sidebar styles ── */
const rs: Record<string, React.CSSProperties> = {
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "var(--t1)" },
  seeAll: { fontSize: 12, color: "var(--purple)", fontWeight: 600, background: "transparent" },
};