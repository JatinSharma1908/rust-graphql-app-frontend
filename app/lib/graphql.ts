"use client";

/**
 * app/messages/page.tsx
 *
 * Full real-time messaging page:
 * - Left panel  : conversation list (CONVERSATIONS_QUERY)
 * - Right panel : message history (MESSAGES_QUERY) + live updates (MESSAGE_RECEIVED_SUBSCRIPTION)
 * - Send bar    : SEND_MESSAGE_MUTATION
 * - Auto mark-read on open (MARK_READ_MUTATION)
 * - New DM modal: CREATE_CONVERSATION_MUTATION
 *
 * WebSocket subscription works because ApolloWrapper now has GraphQLWsLink.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";
import {
  CONVERSATIONS_QUERY,
  MESSAGES_QUERY,
  SEND_MESSAGE_MUTATION,
  MARK_READ_MUTATION,
  MESSAGE_RECEIVED_SUBSCRIPTION,
  CREATE_CONVERSATION_MUTATION,
  SEARCH_USERS_QUERY,
} from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  IconSend,
  IconLoader2,
  IconMessageCircle,
  IconPlus,
  IconSearch,
  IconX,
  IconWifi,
  IconWifiOff,
  IconCheck,
  IconChecks,
} from "@tabler/icons-react";

/* ── Types ── */
interface Message {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  isDeleted?: boolean;
}

interface Participant {
  username: string;
  profilePic?: string;
}

interface Conversation {
  id: string;
  conversationType: string;
  unreadCount: number;
  lastMessagePreview: string;
  participants: Participant[];
}

/* ── Helpers ── */
const avatarColors = [
  "#6B4EFF", "#ec4899", "#22c55e", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ef4444", "#f97316",
];

function getColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── New DM Modal ── */
function NewDMModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { user } = useAuth();

  const { data, loading } = useQuery(SEARCH_USERS_QUERY, {
    variables: { query: search || "a", limit: 10 },
    skip: !search && !user,
    onError: () => {},
  });

  const [createConv, { loading: creating }] = useMutation(CREATE_CONVERSATION_MUTATION, {
    onCompleted: (d) => {
      onCreated(d.createConversation);
      onClose();
    },
    onError: () => {},
    refetchQueries: [{ query: CONVERSATIONS_QUERY }],
  });

  const users: any[] = (data?.searchUsers ?? []).filter((u: any) => u.id !== user?.id);

  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={(e) => e.stopPropagation()}>
        <div style={modal.header}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>New Message</span>
          <button onClick={onClose} style={modal.closeBtn}><IconX size={16} /></button>
        </div>

        <div style={modal.searchRow}>
          <IconSearch size={14} color="var(--t3)" />
          <input
            autoFocus
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={modal.input}
          />
        </div>

        <div style={modal.list}>
          {loading && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <IconLoader2 size={18} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {users.map((u: any) => {
            const color = getColor(u.username);
            const selected = selectedId === u.id;
            return (
              <div
                key={u.id}
                onClick={() => setSelectedId(selected ? null : u.id)}
                style={{
                  ...modal.userRow,
                  background: selected ? "var(--purple-light)" : "transparent",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: color + "20", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{u.username}</div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>{u.followerCount ?? 0} followers</div>
                </div>
                {selected && <IconCheck size={16} color="var(--purple)" style={{ marginLeft: "auto" }} />}
              </div>
            );
          })}
          {!loading && search && users.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--t3)", fontSize: 13 }}>No users found</div>
          )}
        </div>

        <div style={{ padding: "12px 16px" }}>
          <button
            className="btn-primary"
            disabled={!selectedId || creating}
            onClick={() =>
              selectedId &&
              createConv({
                variables: {
                  input: { participantIds: [selectedId], conversationType: "dm" },
                },
              })
            }
            style={{ width: "100%", justifyContent: "center", padding: "10px", borderRadius: 8, fontSize: 14 }}
          >
            {creating
              ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              : "Start Conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Conversations list ── */
  const {
    data: convsData,
    loading: convsLoading,
    refetch: refetchConvs,
  } = useQuery(CONVERSATIONS_QUERY, {
    skip: !user,
    onError: () => {},
    pollInterval: 30000, // fallback poll every 30s
  });
  const conversations: Conversation[] = convsData?.conversations ?? [];

  /* ── Message history for active conversation ── */
  const { data: msgsData, loading: msgsLoading } = useQuery(MESSAGES_QUERY, {
    variables: { input: { conversationId: activeConvId, limit: 50 } },
    skip: !activeConvId,
    onError: () => {},
    onCompleted: (d) => {
      setLocalMessages(d?.messages ?? []);
    },
    fetchPolicy: "network-only",
  });

  /* ── WebSocket Subscription ──
   *
   * This is the core fix. useSubscription routes to GraphQLWsLink
   * because ApolloWrapper now has split() set up.
   *
   * onData fires every time the backend pushes a new message over WS.
   * We append it to localMessages so the UI updates instantly without
   * waiting for a refetch.
   */
  const { error: subError } = useSubscription(MESSAGE_RECEIVED_SUBSCRIPTION, {
    variables: { conversationId: activeConvId! },
    skip: !activeConvId,
    onData: ({ data }) => {
      const msg: Message = data.data?.messageReceived;
      if (!msg) return;
      setWsConnected(true);
      setLocalMessages((prev) => {
        // Avoid duplicate if send mutation already added it
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Refresh conversation list so unread counts / preview update
      refetchConvs();
    },
    onError: () => setWsConnected(false),
  });

  useEffect(() => {
    if (!subError) setWsConnected(true);
  }, [subError]);

  /* ── Mark read on conversation open ── */
  const [markRead] = useMutation(MARK_READ_MUTATION, { onError: () => {} });
  useEffect(() => {
    if (activeConvId) {
      markRead({ variables: { conversationId: activeConvId } });
      inputRef.current?.focus();
    }
  }, [activeConvId, markRead]);

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  /* ── Send message ── */
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: (d) => {
      const msg = d.sendMessage;
      // Optimistically add to local state (subscription will dedup)
      setLocalMessages((prev) =>
        prev.find((m) => m.id === msg.id) ? prev : [...prev, { ...msg, messageType: "text" }]
      );
      setMessageText("");
      refetchConvs();
    },
    onError: () => {},
  });

  const handleSend = useCallback(() => {
    const text = messageText.trim();
    if (!text || !activeConvId || sending) return;
    sendMessage({
      variables: {
        input: {
          conversationId: activeConvId,
          content: text,
          messageType: "text",
        },
      },
    });
  }, [messageText, activeConvId, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Auth guard ── */
  if (!isLoading && !user) {
    router.push("/login");
    return null;
  }

  /* ── Derived: active conversation info ── */
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = activeConv?.participants.find(
    (p) => p.username !== user?.username
  ) ?? activeConv?.participants[0];

  return (
    <>
      <Navbar />
      <div style={s.page}>

        {/* ── Left: Conversation List ── */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <span style={s.sidebarTitle}>Messages</span>
            <button
              className="btn-primary"
              onClick={() => setShowNewDM(true)}
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
            >
              <IconPlus size={13} /> New
            </button>
          </div>

          {convsLoading ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : conversations.length === 0 ? (
            <div style={s.emptyConvs}>
              <IconMessageCircle size={32} color="var(--border2)" />
              <p>No conversations yet.</p>
              <button
                className="btn-primary"
                onClick={() => setShowNewDM(true)}
                style={{ marginTop: 8, padding: "7px 16px", borderRadius: 8, fontSize: 13 }}
              >
                Start one
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = conv.participants.find((p) => p.username !== user?.username) ?? conv.participants[0];
              const color = getColor(other?.username ?? "");
              const active = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    ...s.convRow,
                    background: active ? "var(--purple-light)" : "transparent",
                    borderLeft: active ? "3px solid var(--purple)" : "3px solid transparent",
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: color + "20", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {other?.username?.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {other?.username ?? "Unknown"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {conv.lastMessagePreview ?? "No messages yet"}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={s.unreadBadge}>{conv.unreadCount}</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: Chat Panel ── */}
        {activeConvId ? (
          <div style={s.chatPanel}>
            {/* Chat header */}
            <div style={s.chatHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: getColor(otherParticipant?.username ?? "") + "20", color: getColor(otherParticipant?.username ?? ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                  {otherParticipant?.username?.slice(0, 2).toUpperCase() ?? "??"}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>
                    {otherParticipant?.username ?? "Unknown"}
                  </div>
                  {/* WebSocket status indicator */}
                  <div style={{ fontSize: 11, color: wsConnected ? "#22c55e" : "var(--t3)", display: "flex", alignItems: "center", gap: 4 }}>
                    {wsConnected
                      ? <><IconWifi size={11} /> Live</>
                      : <><IconWifiOff size={11} /> Connecting…</>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div style={s.messagesArea}>
              {msgsLoading ? (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : localMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--t3)", fontSize: 14 }}>
                  No messages yet. Say hello!
                </div>
              ) : (
                localMessages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{
                        ...s.bubble,
                        background: isMe ? "var(--purple)" : "var(--surface)",
                        color: isMe ? "#fff" : "var(--t1)",
                        borderBottomRightRadius: isMe ? 4 : 16,
                        borderBottomLeftRadius: isMe ? 16 : 4,
                        opacity: msg.isDeleted ? 0.5 : 1,
                      }}>
                        {msg.isDeleted ? (
                          <span style={{ fontStyle: "italic", fontSize: 12 }}>Message deleted</span>
                        ) : (
                          msg.content
                        )}
                        <div style={{
                          fontSize: 10,
                          marginTop: 4,
                          opacity: 0.7,
                          textAlign: "right",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 3,
                        }}>
                          {formatTime(msg.createdAt)}
                          {isMe && <IconChecks size={11} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Send bar */}
            <div style={s.sendBar}>
              <input
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                style={s.sendInput}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                style={{
                  ...s.sendBtn,
                  background: messageText.trim() ? "var(--purple)" : "var(--border)",
                  cursor: messageText.trim() ? "pointer" : "default",
                }}
              >
                {sending
                  ? <IconLoader2 size={16} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  : <IconSend size={16} color="#fff" />
                }
              </button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div style={s.emptyChat}>
            <IconMessageCircle size={48} color="var(--border2)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t2)", marginTop: 16 }}>
              Select a conversation
            </h2>
            <p style={{ fontSize: 14, color: "var(--t3)", marginTop: 6 }}>
              Choose from the left or start a new message
            </p>
            <button
              className="btn-primary"
              onClick={() => setShowNewDM(true)}
              style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, fontSize: 14 }}
            >
              <IconPlus size={14} /> New Message
            </button>
          </div>
        )}
      </div>

      {/* New DM Modal */}
      {showNewDM && (
        <NewDMModal
          onClose={() => setShowNewDM(false)}
          onCreated={(conv) => setActiveConvId(conv.id)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ── Styles ── */
const s: Record<string, React.CSSProperties> = {
  page: {
    marginTop: "var(--nav-h)",
    height: "calc(100vh - var(--nav-h))",
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    background: "var(--bg)",
    overflow: "hidden",
  },
  sidebar: {
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    background: "var(--surface)",
  },
  sidebarHeader: {
    padding: "16px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    background: "var(--surface)",
    zIndex: 1,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--t1)",
    letterSpacing: "-0.02em",
  },
  emptyConvs: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    color: "var(--t3)",
    fontSize: 13,
    textAlign: "center",
  },
  convRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
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
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
    flexShrink: 0,
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "12px 20px",
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
  },
  bubble: {
    maxWidth: "65%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  sendBar: {
    padding: "12px 16px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "var(--surface)",
    flexShrink: 0,
  },
  sendInput: {
    flex: 1,
    border: "1px solid var(--border)",
    borderRadius: 24,
    padding: "10px 16px",
    fontSize: 14,
    outline: "none",
    background: "var(--bg)",
    color: "var(--t1)",
    fontFamily: "inherit",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--t3)",
  },
};

/* ── Modal styles ── */
const modal: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  box: {
    background: "var(--surface)",
    borderRadius: 14,
    width: 380,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  header: {
    padding: "14px 16px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "var(--bg)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--t3)",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderBottom: "1px solid var(--border)",
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    color: "var(--t1)",
    fontFamily: "inherit",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 0",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    cursor: "pointer",
    transition: "background 0.12s",
  },
};