"use client";

/**
 * /app/messages/page.tsx
 *
 * Full messaging page with:
 *  - Conversations list (CONVERSATIONS_QUERY)
 *  - Chat view with message history (MESSAGES_QUERY)
 *  - Real-time new messages via WebSocket (MESSAGE_RECEIVED_SUBSCRIPTION)
 *  - Send message (SEND_MESSAGE_MUTATION)
 *  - Mark as read (MARK_READ_MUTATION)
 *  - New conversation modal (CREATE_CONVERSATION_MUTATION + SEARCH_USERS_QUERY)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";
import {
  CONVERSATIONS_QUERY,
  MESSAGES_QUERY,
  SEND_MESSAGE_MUTATION,
  MARK_READ_MUTATION,
  CREATE_CONVERSATION_MUTATION,
  MESSAGE_RECEIVED_SUBSCRIPTION,
  SEARCH_USERS_QUERY,
} from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  IconSend,
  IconSearch,
  IconPlus,
  IconLoader2,
  IconMessage,
  IconX,
  IconCheck,
  IconChecks,
  IconDots,
} from "@tabler/icons-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Participant {
  username: string;
  profilePic?: string;
}

interface Conversation {
  id: string;
  conversationType: string;
  unreadCount: number;
  lastMessagePreview?: string;
  participants: Participant[];
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  isDeleted?: boolean;
  createdAt: string;
  messageType: string;
  mediaUrl?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const AVA_COLORS = [
  "#6B4EFF", "#ec4899", "#22c55e", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ef4444", "#f97316",
];

function colorFor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVA_COLORS[Math.abs(h) % AVA_COLORS.length];
}

function initials(username: string) {
  return username?.slice(0, 2).toUpperCase() ?? "??";
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getConvName(conv: Conversation, myUsername?: string) {
  const others = conv.participants.filter((p) => p.username !== myUsername);
  return others.length > 0 ? others.map((p) => p.username).join(", ") : conv.participants[0]?.username ?? "Unknown";
}

/* ─── Avatar component ───────────────────────────────────────────────────── */
function Avatar({ username, size = 40 }: { username: string; size?: number }) {
  const color = colorFor(username);
  return (
    <div
      className="ava"
      style={{
        width: size, height: size,
        background: color + "20", color,
        fontSize: size * 0.35, fontWeight: 800, flexShrink: 0,
      }}
    >
      {initials(username)}
    </div>
  );
}

/* ─── New Conversation Modal ─────────────────────────────────────────────── */
function NewConvModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (convId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; username: string } | null>(null);

  const { data, loading } = useQuery(SEARCH_USERS_QUERY, {
    variables: { query: search || "a", limit: 20 },
    skip: search.length === 0 && true, // always run with fallback
    fetchPolicy: "network-only",
    onError: () => {},
  });

  const [createConv, { loading: creating }] = useMutation(CREATE_CONVERSATION_MUTATION, {
    onCompleted: (d) => onCreated(d.createConversation.id),
    onError: () => {},
  });

  const users: any[] = data?.searchUsers ?? [];

  return (
    <div style={ms.modalOverlay} onClick={onClose}>
      <div style={ms.modal} onClick={(e) => e.stopPropagation()}>
        <div style={ms.modalHead}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>New Message</span>
          <button onClick={onClose} style={ms.iconBtn}><IconX size={16} color="var(--t2)" /></button>
        </div>

        {/* Search */}
        <div style={ms.searchRow}>
          <IconSearch size={14} color="var(--t3)" />
          <input
            autoFocus
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={ms.searchInput}
          />
        </div>

        {/* Selected user pill */}
        {selected && (
          <div style={ms.selectedPill}>
            <Avatar username={selected.username} size={22} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.username}</span>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", display: "flex", padding: 2 }}>
              <IconX size={12} color="var(--t3)" />
            </button>
          </div>
        )}

        {/* User list */}
        <div style={ms.userList}>
          {loading && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <IconLoader2 size={18} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {!loading && users.slice(0, 8).map((u: any) => (
            <div
              key={u.id}
              onClick={() => setSelected(u)}
              style={{
                ...ms.userRow,
                background: selected?.id === u.id ? "var(--purple-light)" : "transparent",
              }}
            >
              <Avatar username={u.username} size={34} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{u.username}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>{u.followerCount?.toLocaleString()} followers</div>
              </div>
              {selected?.id === u.id && <IconCheck size={14} color="var(--purple)" style={{ marginLeft: "auto" }} />}
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          disabled={!selected || creating}
          onClick={() => {
            if (!selected) return;
            createConv({
              variables: {
                input: { participantIds: [selected.id], conversationType: "dm" },
              },
            });
          }}
          style={{ width: "100%", justifyContent: "center", borderRadius: 8, padding: "10px" }}
        >
          {creating
            ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : "Start conversation"}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────────────── */
function Bubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (msg.isDeleted) {
    return (
      <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--t3)", fontStyle: "italic", padding: "6px 12px" }}>
          Message deleted
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 4 }}>
      <div
        style={{
          maxWidth: "68%",
          padding: "9px 14px",
          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isMine ? "var(--purple)" : "var(--surface)",
          color: isMine ? "#fff" : "var(--t1)",
          fontSize: 14,
          lineHeight: 1.5,
          border: isMine ? "none" : "1px solid var(--border)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            textAlign: "right",
            color: isMine ? "rgba(255,255,255,0.65)" : "var(--t3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 3,
          }}
        >
          {fmtTime(msg.createdAt)}
          {isMine && <IconChecks size={11} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Chat panel ─────────────────────────────────────────────────────────── */
function ChatPanel({
  conv,
  myUserId,
  myUsername,
}: {
  conv: Conversation;
  myUserId: string;
  myUsername: string;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  /* Fetch history */
  const { data, loading } = useQuery(MESSAGES_QUERY, {
    variables: { input: { conversationId: conv.id, limit: 50 } },
    fetchPolicy: "network-only",
    onError: () => {},
  });

  /* Live subscription — only active when this conversation is open */
  const { data: subData } = useSubscription(MESSAGE_RECEIVED_SUBSCRIPTION, {
    variables: { conversationId: conv.id },
    onError: () => {},
  });

  /* Mark read */
  const [markRead] = useMutation(MARK_READ_MUTATION, { onError: () => {} });
  useEffect(() => {
    if (conv.id) markRead({ variables: { conversationId: conv.id } });
  }, [conv.id]);

  /* Merge history + live messages (deduplicate by id) */
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Reset live messages when conversation changes
    setLiveMessages([]);
  }, [conv.id]);

  useEffect(() => {
    if (subData?.messageReceived) {
      const incoming: Message = subData.messageReceived;
      setLiveMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    }
  }, [subData]);

  const historyMsgs: Message[] = data?.messages ?? [];

  // Merge: history first, then live messages not already in history
  const historyIds = new Set(historyMsgs.map((m) => m.id));
  const allMessages = [
    ...historyMsgs,
    ...liveMessages.filter((m) => !historyIds.has(m.id)),
  ];

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  /* Send */
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: (d) => {
      // Optimistically add our own sent message to live list
      const sent: Message = d.sendMessage;
      setLiveMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    },
    onError: () => {},
  });

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    sendMessage({
      variables: {
        input: { conversationId: conv.id, content, messageType: "text" },
      },
    });
    inputRef.current?.focus();
  }, [text, sending, conv.id, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = getConvName(conv, myUsername);

  return (
    <div style={ms.chatPanel}>
      {/* Header */}
      <div style={ms.chatHeader}>
        <Avatar username={otherName} size={36} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{otherName}</div>
          <div style={{ fontSize: 11, color: "var(--t3)" }}>
            {conv.conversationType === "dm" ? "Direct message" : "Group chat"}
          </div>
        </div>
        <button style={{ ...ms.iconBtn, marginLeft: "auto" }}>
          <IconDots size={18} color="var(--t2)" />
        </button>
      </div>

      {/* Messages */}
      <div style={ms.messageArea}>
        {loading && (
          <div style={{ textAlign: "center", padding: 32 }}>
            <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {!loading && allMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--t3)", fontSize: 13 }}>
            No messages yet. Say hi! 👋
          </div>
        )}

        {allMessages.map((msg) => (
          <Bubble key={msg.id} msg={msg} isMine={msg.senderId === myUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={ms.inputArea}>
        <input
          ref={inputRef}
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={ms.msgInput}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{ borderRadius: "50%", width: 40, height: 40, padding: 0, justifyContent: "center", flexShrink: 0 }}
        >
          {sending
            ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <IconSend size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [convSearch, setConvSearch] = useState("");

  const { data, loading: convsLoading, refetch } = useQuery(CONVERSATIONS_QUERY, {
    skip: !user,
    fetchPolicy: "network-only",
    onError: () => {},
  });

  if (!isLoading && !user) { router.push("/login"); return null; }

  const allConvs: Conversation[] = data?.conversations ?? [];
  const convs = convSearch.trim()
    ? allConvs.filter((c) =>
        getConvName(c, user?.username).toLowerCase().includes(convSearch.toLowerCase())
      )
    : allConvs;

  const handleConvCreated = (convId: string) => {
    setShowNewModal(false);
    refetch().then(({ data }) => {
      const created = data?.conversations?.find((c: Conversation) => c.id === convId);
      if (created) setSelectedConv(created);
    });
  };

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "var(--nav-h)", background: "var(--bg)", height: "calc(100vh - var(--nav-h))", display: "flex", overflow: "hidden" }}>

        {/* ── Left: Conversations sidebar ── */}
        <div style={ms.sidebar}>
          {/* Sidebar header */}
          <div style={ms.sideHead}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)" }}>Messages</span>
            <button
              className="btn-primary"
              onClick={() => setShowNewModal(true)}
              style={{ borderRadius: "50%", width: 34, height: 34, padding: 0, justifyContent: "center" }}
              title="New conversation"
            >
              <IconPlus size={16} />
            </button>
          </div>

          {/* Search conversations */}
          <div style={ms.sideSearch}>
            <IconSearch size={13} color="var(--t3)" />
            <input
              placeholder="Search conversations…"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              style={ms.searchInput}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {convsLoading && (
              <div style={{ textAlign: "center", padding: 32 }}>
                <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}

            {!convsLoading && convs.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "var(--t3)", fontSize: 13 }}>
                {convSearch ? "No results" : "No conversations yet"}
              </div>
            )}

            {convs.map((conv) => {
              const name  = getConvName(conv, user?.username);
              const active = selectedConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    ...ms.convRow,
                    background: active ? "var(--purple-light)" : "transparent",
                    borderLeft: active ? "3px solid var(--purple)" : "3px solid transparent",
                  }}
                >
                  <Avatar username={name} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: conv.unreadCount > 0 ? 700 : 600, color: active ? "var(--purple)" : "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </span>
                      {conv.lastMessagePreview && (
                        <span style={{ fontSize: 10, color: "var(--t3)", flexShrink: 0, marginLeft: 4 }}>
                          {/* last message timestamp not in API, omit */}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: conv.unreadCount > 0 ? "var(--t1)" : "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: conv.unreadCount > 0 ? 600 : 400 }}>
                      {conv.lastMessagePreview ?? "No messages yet"}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={ms.unreadBadge}>{conv.unreadCount > 99 ? "99+" : conv.unreadCount}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Chat panel or empty state ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedConv && user ? (
            <ChatPanel
              key={selectedConv.id}     // remount when conversation changes
              conv={selectedConv}
              myUserId={user.id}
              myUsername={user.username}
            />
          ) : (
            <div style={ms.emptyState}>
              <div style={ms.emptyIcon}><IconMessage size={36} color="var(--purple)" /></div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>Your Messages</h2>
              <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 20, textAlign: "center", maxWidth: 280 }}>
                Select a conversation or start a new one to begin messaging.
              </p>
              <button className="btn-primary" onClick={() => setShowNewModal(true)} style={{ borderRadius: 8 }}>
                <IconPlus size={16} /> New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      {showNewModal && (
        <NewConvModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleConvCreated}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const ms: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 320,
    borderRight: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  sideHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 12px",
    borderBottom: "1px solid var(--border)",
  },
  sideSearch: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "10px 12px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 13,
    color: "var(--t1)",
    flex: 1,
    fontFamily: "inherit",
  },
  convRow: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "11px 14px",
    cursor: "pointer",
    transition: "background 0.12s",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    background: "var(--purple)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
    flexShrink: 0,
  },

  /* Chat */
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "var(--bg)",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px",
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  messageArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
  },
  inputArea: {
    display: "flex",
    gap: 10,
    padding: "12px 16px",
    background: "var(--surface)",
    borderTop: "1px solid var(--border)",
    alignItems: "center",
    flexShrink: 0,
  },
  msgInput: {
    flex: 1,
    background: "var(--bg)",
    border: "1.5px solid var(--border2)",
    borderRadius: 24,
    padding: "10px 18px",
    fontSize: 14,
    color: "var(--t1)",
    outline: "none",
    fontFamily: "inherit",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "transparent",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "var(--purple-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  /* Modal */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    background: "var(--surface)",
    borderRadius: 14,
    padding: 20,
    width: 380,
    maxWidth: "90vw",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
  },
  selectedPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--purple-light)",
    border: "1px solid rgba(107,78,255,0.25)",
    borderRadius: 20,
    padding: "4px 10px",
    width: "fit-content",
    color: "var(--purple)",
  },
  userList: {
    maxHeight: 240,
    overflowY: "auto",
    borderRadius: 8,
    border: "1px solid var(--border)",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background 0.1s",
    borderBottom: "1px solid var(--border)",
  },
};