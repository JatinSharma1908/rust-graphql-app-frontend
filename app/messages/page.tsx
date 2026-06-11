"use client";

import { useState, useEffect, useRef } from "react";
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
  IconSend, IconLoader2, IconMessageCircle,
  IconSearch, IconPlus, IconX, IconCheck, IconChecks,
} from "@tabler/icons-react";

const AVA_COLORS = ["#6B4EFF","#ec4899","#22c55e","#f59e0b","#8b5cf6","#06b6d4","#ef4444","#f97316"];

function colorFor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return AVA_COLORS[h % AVA_COLORS.length];
}

function formatTime(ts: string | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── New DM modal ──────────────────────────────────────────────────────────────
function NewDMModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; username: string } | null>(null);

  const { data, loading } = useQuery(SEARCH_USERS_QUERY, {
    variables: { query: search || "a", limit: 20 },
    skip: !search && true,  // always fire — same trick as NetworkPage
    fetchPolicy: "network-only",
  });

  const [createConv, { loading: creating }] = useMutation(CREATE_CONVERSATION_MUTATION, {
    onCompleted: (d) => {
      onCreated(d.createConversation.id);
      onClose();
    },
    onError: (e) => alert(e.message),
    refetchQueries: [{ query: CONVERSATIONS_QUERY }],
  });

  const users: any[] = data?.searchUsers ?? [];

  return (
    <div style={ms.overlay} onClick={onClose}>
      <div style={ms.modal} onClick={(e) => e.stopPropagation()}>
        <div style={ms.modalHeader}>
          <span style={{ fontWeight: 700, color: "var(--t1)" }}>New Message</span>
          <button onClick={onClose} style={{ background: "transparent" }}><IconX size={16} color="var(--t3)" /></button>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={ms.searchRow}>
            <IconSearch size={14} color="var(--t3)" />
            <input
              autoFocus
              placeholder="Search engineers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, flex: 1, color: "var(--t1)", fontFamily: "inherit" }}
            />
          </div>
          {loading && <div style={{ textAlign: "center", padding: 12 }}><IconLoader2 size={16} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} /></div>}
          <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8 }}>
            {users.map((u: any) => {
              const color = colorFor(u.username);
              return (
                <div
                  key={u.id}
                  onClick={() => setSelected(u)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer",
                    background: selected?.id === u.id ? "var(--purple-light)" : "transparent",
                    borderRadius: 6, paddingLeft: selected?.id === u.id ? 8 : 0, transition: "all 0.12s" }}>
                  <div className="ava" style={{ width: 32, height: 32, background: color + "20", color, fontSize: 11, fontWeight: 800 }}>
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{u.username}</span>
                  {selected?.id === u.id && <IconCheck size={14} color="var(--purple)" style={{ marginLeft: "auto" }} />}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <button
            className="btn-primary"
            disabled={!selected || creating}
            style={{ width: "100%", justifyContent: "center", padding: "9px", borderRadius: 8, fontSize: 14 }}
            onClick={() => selected && createConv({ variables: { input: { participantIds: [selected.id], conversationType: "dm" } } })}>
            {creating ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : `Message ${selected?.username ?? "someone"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [showNewDM, setShowNewDM] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Conversations list ──────────────────────────────────────────────────────
  const { data: convData, loading: convLoading, refetch: refetchConvs } = useQuery(CONVERSATIONS_QUERY, {
    skip: !user,
    fetchPolicy: "network-only",
    onError: () => {},
  });
  const conversations: any[] = convData?.conversations ?? [];

  // ── Messages for active conversation ───────────────────────────────────────
  const { data: msgData, loading: msgLoading } = useQuery(MESSAGES_QUERY, {
    variables: { input: { conversationId: activeConvId, limit: 50 } },
    skip: !activeConvId,
    fetchPolicy: "network-only",
    onError: () => {},
  });

  // Keep local messages in sync when query reloads
  useEffect(() => {
    if (msgData?.messages) {
      // Query returns newest-first; reverse for display
      setLocalMessages([...msgData.messages].reverse());
    }
  }, [msgData]);

  // Reset local messages when switching conversations
  useEffect(() => {
    setLocalMessages([]);
  }, [activeConvId]);

  // ── Real-time subscription ──────────────────────────────────────────────────
  // FIX: subscription is only active when a conversation is selected.
  // The stream now uses futures_util::stream::unfold on the backend (Unpin),
  // so it stays alive across multiple messages instead of completing after one.
  useSubscription(MESSAGE_RECEIVED_SUBSCRIPTION, {
    variables: { conversationId: activeConvId },
    skip: !activeConvId,
    onData: ({ data }) => {
      const msg = data.data?.messageReceived;
      if (!msg) return;
      setLocalMessages((prev) => {
        // Deduplicate by id in case we already optimistically added it
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Refresh conversation list so unread counts / preview update
      refetchConvs();
    },
  });

  // ── Mark read when switching conversations ──────────────────────────────────
  const [markRead] = useMutation(MARK_READ_MUTATION, { onError: () => {} });
  useEffect(() => {
    if (activeConvId) markRead({ variables: { conversationId: activeConvId } });
  }, [activeConvId]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: (d) => {
      const msg = d.sendMessage;
      // Optimistic: add to local list immediately (subscription dedupes it)
      setLocalMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
      setText("");
    },
    onError: (e) => alert(e.message),
  });

  const send = () => {
    const content = text.trim();
    if (!content || !activeConvId) return;
    sendMessage({ variables: { input: { conversationId: activeConvId, content, messageType: "text" } } });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  if (!isLoading && !user) { router.push("/login"); return null; }

  const activeConv = conversations.find((c: any) => c.id === activeConvId);
  const otherParticipant = activeConv?.participants?.[0];
  const convName = otherParticipant?.username ?? activeConv?.name ?? "Conversation";

  return (
    <>
      <Navbar />
      <div style={{ marginTop: "var(--nav-h)", background: "var(--bg)", height: "calc(100vh - var(--nav-h))", display: "flex" }}>

        {/* ── Left panel: conversation list ── */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--t1)" }}>Messages</span>
            <button
              onClick={() => setShowNewDM(true)}
              className="btn-primary"
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
              <IconPlus size={14} /> New
            </button>
          </div>

          {convLoading && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}

          {!convLoading && conversations.length === 0 && (
            <div style={s.emptyConvs}>
              <IconMessageCircle size={36} color="var(--border2)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)" }}>No messages yet</div>
              <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>Start a conversation with an engineer</div>
            </div>
          )}

          {conversations.map((conv: any, i: number) => {
            const other = conv.participants?.[0];
            const name = other?.username ?? conv.name ?? "Unknown";
            const color = colorFor(name);
            const isActive = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  ...s.convItem,
                  background: isActive ? "var(--purple-light)" : "transparent",
                }}>
                <div className="ava" style={{ width: 42, height: 42, background: color + "20", color, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? "var(--purple)" : "var(--t1)" }}>{name}</span>
                    <span style={{ fontSize: 11, color: "var(--t3)" }}>{formatTime(conv.lastMessagePreview ? conv.lastMessageAt : null)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.lastMessagePreview ?? "No messages yet"}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div style={s.unreadBadge}>{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right panel: chat ── */}
        <div style={s.chat}>
          {!activeConvId ? (
            <div style={s.emptyChat}>
              <IconMessageCircle size={48} color="var(--border2)" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t2)" }}>Select a conversation</div>
              <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 6 }}>or start a new one</div>
              <button
                onClick={() => setShowNewDM(true)}
                className="btn-primary"
                style={{ marginTop: 20, borderRadius: 8 }}>
                <IconPlus size={15} /> New Message
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={s.chatHeader}>
                <div className="ava" style={{ width: 36, height: 36, background: colorFor(convName) + "20", color: colorFor(convName), fontSize: 12, fontWeight: 800 }}>
                  {convName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{convName}</div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>Active now</div>
                </div>
              </div>

              {/* Messages */}
              <div style={s.messageArea}>
                {msgLoading && (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <IconLoader2 size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                )}
                {localMessages.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
                      {!isMine && (
                        <div className="ava" style={{ width: 28, height: 28, background: colorFor(convName) + "20", color: colorFor(convName), fontSize: 10, fontWeight: 800, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                          {convName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{
                        maxWidth: "65%",
                        padding: "9px 13px",
                        borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: isMine ? "var(--purple)" : "var(--surface)",
                        color: isMine ? "#fff" : "var(--t1)",
                        fontSize: 14,
                        lineHeight: 1.5,
                        border: isMine ? "none" : "1px solid var(--border)",
                        boxShadow: isMine ? "0 2px 8px rgba(107,78,255,0.25)" : "var(--shadow)",
                      }}>
                        {msg.isDeleted
                          ? <em style={{ color: isMine ? "rgba(255,255,255,0.6)" : "var(--t3)", fontSize: 12 }}>Message deleted</em>
                          : msg.content}
                        <div style={{ fontSize: 10, marginTop: 4, textAlign: "right", color: isMine ? "rgba(255,255,255,0.6)" : "var(--t3)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
                          {formatTime(msg.createdAt)}
                          {isMine && <IconChecks size={11} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={s.inputRow}>
                <input
                  className="input"
                  placeholder="Type a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  style={{ flex: 1, borderRadius: 24, padding: "10px 18px", fontSize: 14 }}
                />
                <button
                  className="btn-primary"
                  onClick={send}
                  disabled={!text.trim() || sending}
                  style={{ width: 42, height: 42, borderRadius: "50%", padding: 0, justifyContent: "center", flexShrink: 0 }}>
                  {sending
                    ? <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    : <IconSend size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewDM && (
        <NewDMModal
          onClose={() => setShowNewDM(false)}
          onCreated={(id) => { setActiveConvId(id); refetchConvs(); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 300,
    borderRight: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflowY: "auto",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 16px 12px",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    background: "var(--surface)",
    zIndex: 1,
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background 0.12s",
    borderRadius: 0,
    position: "relative",
  },
  emptyConvs: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    textAlign: "center",
    flex: 1,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
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
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
    overflow: "hidden",
  },
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--t3)",
    textAlign: "center",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
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
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "var(--surface)",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
};

// ── New DM modal styles ───────────────────────────────────────────────────────
const ms: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "var(--surface)",
    borderRadius: 12,
    width: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border)",
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
};