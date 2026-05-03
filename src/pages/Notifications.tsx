import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

/* ─── Injected styles ──────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  .notif-root {
    --bg: #0a0b10;
    --surface: rgba(255,255,255,0.04);
    --surface-hover: rgba(255,255,255,0.07);
    --surface-unread: rgba(110,86,255,0.08);
    --border: rgba(255,255,255,0.08);
    --border-unread: rgba(110,86,255,0.35);
    --accent: #6e56ff;
    --accent-glow: rgba(110,86,255,0.4);
    --accent2: #a78bfa;
    --text-primary: rgba(255,255,255,0.93);
    --text-secondary: rgba(255,255,255,0.5);
    --text-tertiary: rgba(255,255,255,0.3);
    --dot-from: #6e56ff;
    --dot-to: #a78bfa;
    --header-h: 64px;
    font-family: 'DM Sans', sans-serif;
    min-height: 100svh;
    background: var(--bg);
    color: var(--text-primary);
    overscroll-behavior: none;
  }

  /* noise layer */
  .notif-root::before {
    content:'';
    position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity:.6;
  }

  /* ambient orb */
  .notif-orb {
    position:fixed;top:-180px;left:50%;transform:translateX(-50%);
    width:600px;height:400px;border-radius:50%;
    background: radial-gradient(ellipse at center, rgba(110,86,255,0.15) 0%, transparent 70%);
    pointer-events:none;z-index:0;
  }

  /* ── header ── */
  .notif-header {
    position: sticky;top:0;z-index:50;
    height: var(--header-h);
    display:flex;align-items:center;justify-content:space-between;
    padding: 0 20px;
    background: rgba(10,11,16,0.8);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 0.5px solid var(--border);
  }

  .notif-header-left {
    display:flex;align-items:center;gap:12px;
  }

  .notif-back-btn {
    width:38px;height:38px;border-radius:12px;
    background: var(--surface);
    border: 0.5px solid var(--border);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;transition:background .15s, transform .15s;
    color: var(--text-secondary);
  }
  .notif-back-btn:hover { background: var(--surface-hover); transform:scale(1.05); }
  .notif-back-btn:active { transform:scale(0.95); }

  .notif-title {
    font-family:'Syne',sans-serif;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .notif-count-badge {
    display:inline-flex;align-items:center;justify-content:center;
    min-width:20px;height:20px;padding:0 6px;
    border-radius:20px;
    background: linear-gradient(135deg, var(--dot-from), var(--dot-to));
    font-size:11px;font-weight:600;color:#fff;
    font-family:'Syne',sans-serif;
    animation: badgePop .3s cubic-bezier(.34,1.56,.64,1) both;
  }

  .notif-mark-btn {
    display:flex;align-items:center;gap:6px;
    padding: 8px 14px;
    border-radius:12px;
    background: var(--surface);
    border: 0.5px solid var(--border);
    cursor:pointer;
    font-family:'DM Sans',sans-serif;
    font-size:13px;font-weight:500;
    color: var(--text-secondary);
    transition: all .15s;
    white-space:nowrap;
  }
  .notif-mark-btn:hover { background: var(--surface-hover); color: var(--text-primary); border-color:var(--accent); }
  .notif-mark-btn:active { transform:scale(0.97); }
  .notif-mark-btn.marking { color: var(--accent2); }

  /* ── main ── */
  .notif-main {
    position:relative;z-index:1;
    max-width: 680px;
    margin: 0 auto;
    padding: 20px 16px 80px;
  }

  /* ── section label ── */
  .notif-section-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    padding: 0 4px;
    margin: 24px 0 10px;
  }
  .notif-section-label:first-child { margin-top: 4px; }

  /* ── list ── */
  .notif-list { display:flex;flex-direction:column;gap:6px; }

  /* ── item ── */
  .notif-item {
    position:relative;
    width:100%;text-align:left;
    padding: 14px 16px 14px 16px;
    border-radius:16px;
    background: var(--surface);
    border: 0.5px solid var(--border);
    cursor:pointer;
    transition: background .15s, border-color .15s, transform .15s;
    overflow:hidden;
    animation: slideUp .4s cubic-bezier(.22,1,.36,1) both;
  }
  .notif-item:hover { background: var(--surface-hover); transform: translateY(-1px); }
  .notif-item:active { transform: translateY(0) scale(0.99); }

  .notif-item.unread {
    background: var(--surface-unread);
    border-color: var(--border-unread);
  }
  .notif-item.unread::before {
    content:'';
    position:absolute;inset:0;
    background: linear-gradient(90deg, rgba(110,86,255,0.06) 0%, transparent 60%);
    pointer-events:none;
  }

  .notif-item.reading { animation: readPulse .4s ease; }

  .notif-item-inner { display:flex;align-items:flex-start;gap:12px; }

  /* dot */
  .notif-dot-wrap {
    flex-shrink:0;margin-top:4px;
    width:8px;height:8px;
    display:flex;align-items:center;justify-content:center;
  }
  .notif-dot {
    width:8px;height:8px;border-radius:50%;
    background: linear-gradient(135deg, var(--dot-from), var(--dot-to));
    box-shadow: 0 0 8px var(--accent-glow);
    animation: dotPulse 2.5s ease-in-out infinite;
  }

  /* icon */
  .notif-icon {
    flex-shrink:0;
    width:40px;height:40px;border-radius:12px;
    display:flex;align-items:center;justify-content:center;
    background: rgba(110,86,255,0.12);
    border: 0.5px solid rgba(110,86,255,0.2);
    font-size:16px;
  }
  .notif-icon.type-like    { background:rgba(239,68,68,0.1);  border-color:rgba(239,68,68,0.2); }
  .notif-icon.type-comment { background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.2); }
  .notif-icon.type-follow  { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.2); }
  .notif-icon.type-system  { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.2); }

  /* content */
  .notif-content { flex:1;min-width:0; }
  .notif-item-title {
    font-size:14px;font-weight:500;
    color: var(--text-primary);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    line-height:1.4;
  }
  .notif-item.unread .notif-item-title { font-weight:600; }
  .notif-item-body {
    font-size:13px;color: var(--text-secondary);
    margin-top:3px;line-height:1.5;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  }
  .notif-item-time {
    font-size:11px;color: var(--text-tertiary);
    margin-top:6px;
    display:flex;align-items:center;gap:5px;
  }

  /* chevron */
  .notif-chevron {
    flex-shrink:0;
    color: var(--text-tertiary);
    margin-top:2px;
    transition: transform .15s, color .15s;
  }
  .notif-item:hover .notif-chevron { transform:translateX(2px); color: var(--accent2); }

  /* ── empty state ── */
  .notif-empty {
    display:flex;flex-direction:column;align-items:center;
    padding: 80px 20px 40px;
    text-align:center;
    animation: fadeIn .5s ease both;
  }
  .notif-empty-bell {
    width:72px;height:72px;
    border-radius:20px;
    background: var(--surface);
    border: 0.5px solid var(--border);
    display:flex;align-items:center;justify-content:center;
    margin-bottom:20px;
    animation: bellFloat 3s ease-in-out infinite;
    font-size:28px;
  }
  .notif-empty-title {
    font-family:'Syne',sans-serif;
    font-size:17px;font-weight:600;
    color: var(--text-primary);
    margin-bottom:8px;
  }
  .notif-empty-sub {
    font-size:14px;color: var(--text-secondary);
    line-height:1.6;max-width:260px;
  }

  /* ── skeleton ── */
  .notif-skeleton { display:flex;flex-direction:column;gap:6px; }
  .notif-skel-item {
    height:80px;border-radius:16px;
    background: var(--surface);
    border: 0.5px solid var(--border);
    overflow:hidden;position:relative;
    animation: slideUp .3s cubic-bezier(.22,1,.36,1) both;
  }
  .notif-skel-item::after {
    content:'';position:absolute;inset:0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
    animation: shimmer 1.8s infinite;
  }

  /* ── divider ── */
  .notif-divider {
    height:0.5px;
    background: var(--border);
    margin: 12px 0;
  }

  /* ── animations ── */
  @keyframes slideUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes shimmer {
    from { transform:translateX(-100%); }
    to   { transform:translateX(100%); }
  }
  @keyframes dotPulse {
    0%,100% { transform:scale(1); opacity:1; }
    50%      { transform:scale(1.3); opacity:.7; }
  }
  @keyframes bellFloat {
    0%,100% { transform:translateY(0) rotate(0deg); }
    25%      { transform:translateY(-6px) rotate(-4deg); }
    75%      { transform:translateY(-3px) rotate(3deg); }
  }
  @keyframes badgePop {
    from { transform:scale(0); opacity:0; }
    to   { transform:scale(1); opacity:1; }
  }
  @keyframes readPulse {
    0%   { background: rgba(110,86,255,0.15); }
    100% { background: var(--surface); }
  }
  @keyframes markAllFlash {
    0%   { background: rgba(110,86,255,0.15); }
    100% { background: var(--surface); }
  }

  /* ── bottom safe area ── */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .notif-main { padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
  }
`;

/* ─── Icon helpers ─────────────────────────────────────────────────────────── */
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
    <path d="M20 12L9 23l-5-5" />
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notif-chevron">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconClock = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);

/* type → emoji icon */
const typeEmoji = (type) => {
  const map = { like: "♥", comment: "💬", follow: "✦", mention: "@", system: "⚙", message: "✉", alert: "!", update: "↑" };
  return map[type] ?? "✦";
};
const typeClass = (type) => {
  const map = { like: "type-like", comment: "type-comment", follow: "type-follow", system: "type-system" };
  return map[type] ?? "";
};

/* group notifications into Today / Yesterday / Earlier */
const groupItems = (items) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yestStart  = new Date(todayStart - 86400000);

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  items.forEach((n) => {
    const d = new Date(n.created_at);
    if (d >= todayStart) groups.Today.push(n);
    else if (d >= yestStart) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
};

/* ─── Component ────────────────────────────────────────────────────────────── */
const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [readingIds, setReadingIds] = useState(new Set());
  const styleInjected = useRef(false);

  /* inject styles once */
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, url, is_read, created_at, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
    const channel = supabase
      .channel(`notif-page-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, load, navigate]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || marking) return;
    setMarking(true);
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setTimeout(() => setMarking(false), 800);
  };

  const handleClick = async (n) => {
    if (!n.is_read) {
      setReadingIds((prev) => new Set(prev).add(n.id));
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
      setTimeout(() => setReadingIds((prev) => { const s = new Set(prev); s.delete(n.id); return s; }), 500);
    }
    if (n.url) navigate(n.url);
  };

  const groups = groupItems(items);

  return (
    <div className="notif-root">
      <div className="notif-orb" />

      {/* ── Header ── */}
      <header className="notif-header">
        <div className="notif-header-left">
          <button className="notif-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <IconBack />
          </button>
          <h1 className="notif-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="notif-count-badge" key={unreadCount}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className={`notif-mark-btn${marking ? " marking" : ""}`} onClick={markAllRead}>
            <IconCheck />
            {marking ? "Marking…" : "Mark all read"}
          </button>
        )}
      </header>

      {/* ── Main ── */}
      <main className="notif-main">
        {loading ? (
          <div className="notif-skeleton">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="notif-skel-item" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-bell">🔔</div>
            <p className="notif-empty-title">All caught up</p>
            <p className="notif-empty-sub">No notifications right now. We'll let you know when something new arrives.</p>
          </div>
        ) : (
          <>
            {Object.entries(groups).map(([label, group]) =>
              group.length === 0 ? null : (
                <div key={label}>
                  <p className="notif-section-label">{label}</p>
                  <ul className="notif-list">
                    {group.map((n, i) => (
                      <li key={n.id} style={{ animationDelay: `${i * 40}ms` }}>
                        <button
                          className={`notif-item${!n.is_read ? " unread" : ""}${readingIds.has(n.id) ? " reading" : ""}`}
                          onClick={() => handleClick(n)}
                        >
                          <div className="notif-item-inner">
                            {/* unread dot */}
                            <div className="notif-dot-wrap">
                              {!n.is_read && <span className="notif-dot" />}
                            </div>

                            {/* type icon */}
                            <div className={`notif-icon ${typeClass(n.type)}`}>
                              {typeEmoji(n.type)}
                            </div>

                            {/* text */}
                            <div className="notif-content">
                              <p className="notif-item-title">{n.title || "Notification"}</p>
                              {n.body && <p className="notif-item-body">{n.body}</p>}
                              <p className="notif-item-time">
                                <IconClock />
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </p>
                            </div>

                            {/* chevron only if navigable */}
                            {n.url && <IconChevron />}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Notifications;
