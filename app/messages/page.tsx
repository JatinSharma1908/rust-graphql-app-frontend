"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";
import {
  CONVERSATIONS_QUERY,
  MESSAGES_QUERY,
  SEND_MESSAGE_MUTATION,
  MARK_READ_MUTATION,
  CREATE_CONVERSATION_MUTATION,
  MESSAGE_RECEIVED_SUBSCRIPTION,
} from "@/lib/graphql";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  IconSend,
  IconLoader2,
  IconMessageCircle,
  IconSearch,
  IconPlus,
  IconCheck,
  IconChecks,
} from "@tabler/icons-react";

/* ── helpers ── */
const fmt = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const AVA_COLORS = [
  "#6B4EFF", "#ec4899", "#22c55e",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444",
];
const avaColor = (str: string) =>
  AVA_COLORS[
    str.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVA_COLORS.length
  ];

/* ─────────────────────────────────────────────
   MessagesPage
───────────────────────────────────────────── */
export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [messageText, setMessageText]     = useState("");
  const [convSearch, setConvSearch]       = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  /* ── Conversations list ── */
  const {
    data: convData,
    loading: convLoading,
    refetch: refetchConvs,
  } = useQuery(CONVERSATIONS_QUERY, {
    skip: !user,
    fetchPolicy: "network-only",
    onError: () => {},
  });

  /* ── Messages for active conversation ── */
  const { data: msgData, loading: msgLoading } = useQuery(MESSAGES_QUERY, {
    variables: { input: { conversationId: activeConvId, limit: 50 } },
    skip: !activeConvId,
    fetchPolicy: "network-only",
    onError: () => {},
  });

  /* ── Mark as read when conversation opened ── */
  const [markRead] = useMutation(MARK_READ_MUTATION, { onError: () => {} });

  /* ── Send message ── */
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION, {
    onError: () => {},
  });

  /* ── Real-time subscription — only active when a conversation is open ──
   *
   * Because ApolloWrapper now uses lazy: true, the WebSocket connection
   * is only opened HERE when this hook actually runs with a real
   * conversationId. On all other pages the WS stays closed.
   */
  const { data: subData } = useSubscription(MESSAGE_RECEIVED_SUBSCRIPTION, {
    variables: { conversationId: activeConvId },
    skip: !activeConvId, // ← never subscribe if no conversation is selected
    onError: () => {},
  });

  /* ── Sync server messages into local state ── */
  useEffect(() => {
    if (msgData?.messages) {
      setLocalMessages([...msgData.messages].reverse()); // backend returns newest-first
    }
  }, [msgData]);

  /* ── Append real-time message from subscription ── */
  useEffect(() => {
    if (!subData?.messageReceived) return;
    const incoming = subData.messageReceived;
    setLocalMessages((prev) => {
      // deduplicate by id
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
    refetchConvs(); // refresh sidebar preview + unread count
  }, [subData]);

  /* ── Scroll to bottom whenever messages change ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  /* ── Mark read on open ── */
  useEffect(() => {
    if (activeConvId) {
      markRead({ variables: { conversationId: activeConvId } });
      inputRef.current?.focus();
    }
  }, [activeConvId]);

  /* ── Reset local messages when switching conversations ── */
  useEffect(() => {
    setLocalMessages([]);
  }, [activeConvId]);

  if (!isLoading && !user) { router.push("/login"); return null; }

  const conversations: any[] = convData?.conversations ?? [];
  const filtered = conversations.filter((c) => {
    const other = c.participants?.find((p: any) => p.username !== user?.username);
    return other?.username?.toLowerCase().includes(convSearch.toLowerCase());
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = activeConv?.participants?.find(
    (p: any) => p.username !== user?.username
  );

  /* ── Send handler ── */
  const handleSend = async () => {
    const content = messageText.trim();
    if (!content || !activeConvId || sending) return;
    setMessageText("");

    // Optimistic update — append immediately so it feels instant
    const optimistic = {
      id:        `opt-${Date.now()}`,
      senderId:  user?.id,
      content,
      messageType: "text",
      createdAt: new Date().toISOString(),
      isDeleted: false,
      __optimistic: true,
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    try {
      const { data } = await sendMessage({
        variables: {
          input: {
            conversationId: activeConvId,
            content,
            messageType: "text",
          },
        },
      });
      // Replace optimistic message with real one from server
      if (data?.sendMessage) {
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? data.sendMessage : m
          )
        );
        refetchConvs();
      }
    } catch {
      // Remove optimistic on failure
      setLocalMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Render ── */
  return (
    <>
      <Navbar />
      <div style={s.page}>

        {/* ── LEFT: conversation sidebar ── */}
        <div style={s.sidebar} className="card">

          {/* Sidebar header */}
          <div style={s.sidebarHead}>
            <h2 style={s.sidebarTitle}>Messages</h2>
            <button style={s.newBtn} title="New conversation">
              <IconPlus size={16} color="var(--purple)" />
            </button>
          </div>

          {/* Search */}
          <div style={s.sidebarSearch}>
            <IconSearch size={13} color="var(--t3)" />
            <input
              placeholder="Search conversations…"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              style={s.sidebarSearchInput}
            />
          </div>

          {/* List */}
          <div style={s.convList}>
            {convLoading && (
              <div style={s.centerPad}>
                <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}

            {!convLoading && filtered.length === 0 && (
              <div style={s.emptyConv}>No conversations yet</div>
            )}

            {filtered.map((conv: any) => {
              const other = conv.participants?.find(
                (p: any) => p.username !== user?.username
              );
              const name     = other?.username ?? "Unknown";
              const color    = avaColor(name);
              const initials = name.slice(0, 2).toUpperCase();
              const active   = conv.id === activeConvId;
              const unread   = conv.unreadCount > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    ...s.convItem,
                    background: active ? "var(--purple-light)" : "transparent",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="ava"
                    style={{
                      width: 42, height: 42,
                      background: color + "20",
                      color,
                      fontSize: 14, fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={s.convInfo}>
                    <div style={s.convRow}>
                      <span style={{ ...s.convName, color: active ? "var(--purple)" : "var(--t1)" }}>
                        {name}
                      </span>
                      {conv.participants?.[0]?.createdAt && (
                        <span style={s.convTime}>{fmt(conv.participants[0].createdAt)}</span>
                      )}
                    </div>
                    <div style={s.convRow}>
                      <span style={{ ...s.convPreview, fontWeight: unread ? 700 : 400, color: unread ? "var(--t1)" : "var(--t3)" }}>
                        {conv.lastMessagePreview ?? "No messages yet"}
                      </span>
                      {unread && (
                        <span style={s.unreadBadge}>{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: chat area ── */}
        {activeConvId ? (
          <div style={s.chatWrap} className="card">

            {/* Chat header */}
            <div style={s.chatHead}>
              <div
                className="ava"
                style={{
                  width: 38, height: 38,
                  background: avaColor(otherParticipant?.username ?? "") + "20",
                  color: avaColor(otherParticipant?.username ?? ""),
                  fontSize: 13, fontWeight: 700,
                }}
              >
                {otherParticipant?.username?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>
                  {otherParticipant?.username ?? "Unknown"}
                </div>
                <div style={{ fontSize: 12, color: "var(--t3)" }}>
                  {activeConv?.conversationType === "dm" ? "Direct Message" : "Group"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={s.msgList}>
              {msgLoading && (
                <div style={s.centerPad}>
                  <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              )}

              {!msgLoading && localMessages.length === 0 && (
                <div style={s.emptyChat}>
                  <IconMessageCircle size={32} color="var(--border2)" />
                  <p style={{ marginTop: 10, fontSize: 14, color: "var(--t3)" }}>
                    No messages yet. Say hello!
                  </p>
                </div>
              )}

              {localMessages.map((msg: any, i: number) => {
                const isMine = msg.senderId === user?.id;
                const showDate =
                  i === 0 ||
                  new Date(localMessages[i - 1].createdAt).toDateString() !==
                    new Date(msg.createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={s.dateDivider}>
                        <span style={s.dateDividerText}>
                          {new Date(msg.createdAt).toLocaleDateString([], {
                            weekday: "long", month: "short", day: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 6 }}>
                      <div style={{ maxWidth: "68%" }}>
                        <div
                          style={{
                            ...s.bubble,
                            background:   isMine ? "var(--purple)" : "var(--bg)",
                            color:        isMine ? "#fff"           : "var(--t1)",
                            borderRadius: isMine
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            opacity: msg.__optimistic ? 0.7 : 1,
                          }}
                        >
                          {msg.isDeleted ? (
                            <span style={{ fontStyle: "italic", opacity: 0.6 }}>
                              Message deleted
                            </span>
                          ) : (
                            msg.content
                          )}
                        </div>

                        <div style={{ ...s.msgMeta, textAlign: isMine ? "right" : "left" }}>
                          {fmt(msg.createdAt)}
                          {isMine && (
                            <span style={{ marginLeft: 4 }}>
                              {msg.__optimistic
                                ? <IconCheck size={11} color="var(--t3)" />
                                : <IconChecks size={11} color="var(--purple)" />
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={s.inputBar}>
              <input
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${otherParticipant?.username ?? ""}...`}
                style={s.msgInput}
              />
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                style={{
                  ...s.sendBtn,
                  background: messageText.trim() ? "var(--purple)" : "var(--border2)",
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
          /* ── Empty state ── */
          <div style={{ ...s.chatWrap, ...s.emptyState }} className="card">
            <IconMessageCircle size={48} color="var(--border2)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--t2)", marginTop: 12 }}>
              Select a conversation
            </h3>
            <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 4, textAlign: "center" }}>
              Choose a conversation from the left, or start a new one.
            </p>
          </div>
        )}
      </div>

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
    gap: 0,
    background: "var(--bg)",
    padding: 16,
    gap: 12,
    boxSizing: "border-box",
  } as React.CSSProperties,

  /* Sidebar */
  sidebar: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
  } as React.CSSProperties,

  sidebarHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 10px",
    borderBottom: "1px solid var(--border)",
  },
  sidebarTitle: { fontSize: 16, fontWeight: 800, color: "var(--t1)" },
  newBtn: {
    width: 30, height: 30, borderRadius: 8,
    background: "var(--purple-light)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: "pointer",
  },

  sidebarSearch: {
    display: "flex", alignItems: "center", gap: 8,
    margin: "10px 12px",
    padding: "8px 12px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
  },
  sidebarSearchInput: {
    border: "none", background: "transparent",
    outline: "none", fontSize: 13,
    color: "var(--t1)", fontFamily: "inherit", flex: 1,
  },

  convList: { flex: 1, overflowY: "auto" as const, padding: "4px 0" },

  convItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", cursor: "pointer",
    transition: "background 0.12s",
    borderRadius: 8, margin: "1px 6px",
  },
  convInfo: { flex: 1, minWidth: 0 },
  convRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  convName: { fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  convTime: { fontSize: 11, color: "var(--t3)", flexShrink: 0 },
  convPreview: { fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1 },
  unreadBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    background: "var(--purple)", color: "#fff",
    fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 5px", flexShrink: 0,
  },

  /* Chat area */
  chatWrap: {
    display: "flex", flexDirection: "column" as const,
    height: "100%", overflow: "hidden",
  },

  chatHead: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },

  msgList: {
    flex: 1, overflowY: "auto" as const,
    padding: "16px 20px",
    display: "flex", flexDirection: "column" as const,
  },

  bubble: {
    padding: "10px 14px",
    fontSize: 14, lineHeight: 1.5,
    wordBreak: "break-word" as const,
  },

  msgMeta: {
    fontSize: 11, color: "var(--t3)",
    marginTop: 3, display: "flex", alignItems: "center",
  },

  dateDivider: {
    display: "flex", alignItems: "center",
    justifyContent: "center", margin: "12px 0",
  },
  dateDividerText: {
    fontSize: 11, color: "var(--t3)", fontWeight: 600,
    background: "var(--bg)", padding: "3px 12px",
    borderRadius: 20, border: "1px solid var(--border)",
  },

  inputBar: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 16px",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  msgInput: {
    flex: 1, border: "1.5px solid var(--border2)",
    borderRadius: 24, padding: "10px 16px",
    fontSize: 14, color: "var(--t1)",
    fontFamily: "inherit", outline: "none",
    background: "var(--bg)",
    transition: "border 0.15s",
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: "50%",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.15s",
  },

  /* Shared empty/loading states */
  centerPad: { display: "flex", justifyContent: "center", padding: 32 },
  emptyConv: { padding: 24, textAlign: "center" as const, fontSize: 13, color: "var(--t3)" },
  emptyChat: {
    flex: 1, display: "flex",
    flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center",
  },
  emptyState: {
    alignItems: "center", justifyContent: "center",
    flexDirection: "column" as const,
  },
};