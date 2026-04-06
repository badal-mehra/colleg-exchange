// Leaderboard.tsx — Redesigned: Dark Gamified Edition

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Award,
  Star,
  Target,
  ArrowLeft,
  Crown,
  Zap,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Locate,
  Users,
  ChevronDown,
  Flame,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/* ─────────────────────────────────────────
   Interfaces & Constants
───────────────────────────────────────── */
interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  university: string;
  campus_points: number;
  trust_seller_badge: boolean;
  avatar_url?: string | null;
  mck_id?: string;
}

const LOAD_INCREMENT = 10;
const MAX_VISIBLE_RANKS = 99;
const SCROLL_THRESHOLD = 200;

/* ─────────────────────────────────────────
   Inline Styles  (no Tailwind conflicts)
───────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .lb-root {
    min-height: 100vh;
    background: #08080f;
    color: #e8e8f0;
    font-family: 'DM Sans', sans-serif;
    padding-bottom: 6rem;
    position: relative;
    overflow-x: hidden;
  }

  /* Animated grid background */
  .lb-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .lb-container {
    max-width: 860px;
    margin: 0 auto;
    padding: 1.5rem 1rem 2rem;
    position: relative;
    z-index: 1;
  }

  /* ── Header ── */
  .lb-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .lb-back-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: #9898b0;
    border-radius: 10px;
    padding: 0.45rem 0.9rem;
    font-size: 0.82rem;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .lb-back-btn:hover {
    background: rgba(99,102,241,0.15);
    color: #a5b4fc;
  }
  .lb-title-block {
    flex: 1;
    text-align: center;
  }
  .lb-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.6rem, 5vw, 2.6rem);
    font-weight: 800;
    line-height: 1.1;
    background: linear-gradient(135deg, #f9d100 0%, #f97316 40%, #e040fb 80%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -0.5px;
  }
  .lb-subtitle {
    color: #6b6b88;
    font-size: 0.8rem;
    margin-top: 0.2rem;
    letter-spacing: 0.03em;
  }

  /* ── Podium ── */
  .podium-grid {
    display: grid;
    grid-template-columns: 1fr 1.15fr 1fr;
    gap: 0.6rem;
    align-items: end;
    margin-bottom: 2.5rem;
  }
  .podium-card {
    border-radius: 18px;
    padding: 1rem 0.75rem 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    position: relative;
    border: 1px solid transparent;
    overflow: hidden;
  }
  .podium-card:hover {
    transform: translateY(-4px);
  }
  .podium-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }
  /* Rank 1 */
  .podium-1 {
    background: linear-gradient(160deg, rgba(249,209,0,0.12) 0%, rgba(249,115,22,0.06) 100%);
    border-color: rgba(249,209,0,0.25);
    box-shadow: 0 0 40px rgba(249,209,0,0.10), 0 8px 32px rgba(0,0,0,0.4);
    padding-top: 1.5rem;
  }
  .podium-1:hover {
    box-shadow: 0 0 60px rgba(249,209,0,0.18), 0 12px 40px rgba(0,0,0,0.5);
  }
  /* Rank 2 */
  .podium-2 {
    background: linear-gradient(160deg, rgba(148,163,184,0.10) 0%, rgba(100,116,139,0.05) 100%);
    border-color: rgba(148,163,184,0.18);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }
  /* Rank 3 */
  .podium-3 {
    background: linear-gradient(160deg, rgba(194,120,50,0.10) 0%, rgba(161,98,38,0.05) 100%);
    border-color: rgba(194,120,50,0.18);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }

  .podium-crown {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.7rem;
    flex-shrink: 0;
  }
  .podium-crown-1 { background: linear-gradient(135deg, #f9d100, #f97316); box-shadow: 0 0 20px rgba(249,209,0,0.5); }
  .podium-crown-2 { background: linear-gradient(135deg, #94a3b8, #64748b); }
  .podium-crown-3 { background: linear-gradient(135deg, #c27832, #92500e); }

  .podium-avatar {
    border-radius: 50%;
    object-fit: cover;
    border: 2.5px solid;
    flex-shrink: 0;
  }
  .podium-avatar-1 { width: 64px; height: 64px; border-color: rgba(249,209,0,0.6); }
  .podium-avatar-2 { width: 54px; height: 54px; border-color: rgba(148,163,184,0.4); }
  .podium-avatar-3 { width: 54px; height: 54px; border-color: rgba(194,120,50,0.4); }

  .podium-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    line-height: 1.2;
    margin: 0.5rem 0 0.15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .podium-name-1 { font-size: clamp(0.8rem, 2.5vw, 1rem); color: #fde68a; }
  .podium-name-2 { font-size: clamp(0.72rem, 2.2vw, 0.9rem); color: #cbd5e1; }
  .podium-name-3 { font-size: clamp(0.72rem, 2.2vw, 0.9rem); color: #d4a76a; }

  .podium-uni {
    font-size: 0.65rem;
    color: #6b6b88;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    margin-bottom: 0.6rem;
  }
  .podium-points {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    line-height: 1;
  }
  .podium-points-1 { font-size: clamp(1.5rem, 4vw, 2rem); color: #fde68a; }
  .podium-points-2 { font-size: clamp(1.2rem, 3.5vw, 1.6rem); color: #cbd5e1; }
  .podium-points-3 { font-size: clamp(1.2rem, 3.5vw, 1.6rem); color: #d4a76a; }

  .podium-pts-label {
    font-size: 0.62rem;
    color: #6b6b88;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* Trusted badge in podium */
  .trusted-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(234,179,8,0.15);
    border: 1px solid rgba(234,179,8,0.3);
    color: #fbbf24;
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 100px;
    margin-top: 0.4rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ── Divider ── */
  .lb-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .lb-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }
  .lb-divider-label {
    font-size: 0.7rem;
    color: #6b6b88;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  /* ── List Items ── */
  .rank-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 1.5rem;
  }
  .rank-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: 14px;
    padding: 0.7rem 1rem;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, transform 0.18s;
    will-change: transform;
  }
  .rank-item:hover {
    background: rgba(99,102,241,0.07);
    border-color: rgba(99,102,241,0.2);
    transform: translateX(3px);
  }
  .rank-item-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    flex: 1;
  }
  .rank-num {
    width: 2rem;
    text-align: center;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: #4a4a66;
    flex-shrink: 0;
  }
  .rank-info {
    min-width: 0;
    flex: 1;
  }
  .rank-name-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .rank-name {
    font-weight: 600;
    font-size: 0.88rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #e0e0f0;
  }
  .rank-uni {
    font-size: 0.7rem;
    color: #6b6b88;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rank-zap {
    background: rgba(234,179,8,0.12);
    border: 1px solid rgba(234,179,8,0.25);
    border-radius: 6px;
    padding: 0.1rem 0.3rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
  .rank-points-col {
    text-align: right;
    flex-shrink: 0;
  }
  .rank-pts-val {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #a5b4fc;
  }
  .rank-pts-lbl {
    font-size: 0.62rem;
    color: #6b6b88;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── Load more ── */
  .load-more-btn {
    width: 100%;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    color: #a5b4fc;
    border-radius: 12px;
    padding: 0.7rem 1.2rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    transition: background 0.2s, border-color 0.2s;
    margin-top: 0.5rem;
  }
  .load-more-btn:hover {
    background: rgba(99,102,241,0.15);
    border-color: rgba(99,102,241,0.35);
  }
  .end-text {
    text-align: center;
    font-size: 0.75rem;
    color: #4a4a66;
    padding: 1rem 0 0.5rem;
    letter-spacing: 0.04em;
  }

  /* ── Bottom info cards ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 2rem;
  }
  @media (max-width: 560px) {
    .info-grid { grid-template-columns: 1fr; }
  }
  .info-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.065);
    border-radius: 18px;
    padding: 1.25rem;
  }
  .info-card-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.88rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    color: #c4c4e0;
  }
  .reward-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.8rem;
    border-radius: 10px;
    margin-bottom: 0.4rem;
    font-size: 0.8rem;
  }
  .reward-row-1 { background: rgba(249,209,0,0.06); border: 1px solid rgba(249,209,0,0.12); }
  .reward-row-2 { background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.12); }
  .reward-row-3 { background: rgba(194,120,50,0.06); border: 1px solid rgba(194,120,50,0.12); }
  .reward-label-1 { color: #fde68a; font-weight: 700; }
  .reward-label-2 { color: #cbd5e1; font-weight: 700; }
  .reward-label-3 { color: #d4a76a; font-weight: 700; }
  .reward-desc { color: #9898b0; font-size: 0.76rem; text-align: right; }

  .pts-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 0.78rem;
    color: #9898b0;
  }
  .pts-row:last-child { border-bottom: none; }
  .pts-badge {
    font-weight: 600;
    font-size: 0.75rem;
  }

  /* ── Sticky rank bar ── */
  .sticky-rank {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(12, 12, 24, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(99,102,241,0.25);
    padding: 0.9rem 1.5rem;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sticky-rank-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #9898b0;
  }
  .sticky-rank-num {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.5rem;
    color: #a5b4fc;
  }

  /* ── Jump button ── */
  .jump-btn {
    position: fixed;
    bottom: 5rem;
    right: 1.25rem;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 4px 24px rgba(99,102,241,0.4);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 51;
    animation: bounce 2s infinite;
    transition: transform 0.2s;
  }
  .jump-btn:hover { transform: scale(1.1); }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 4rem 1rem;
    color: #4a4a66;
  }
  .empty-state h3 {
    font-family: 'Syne', sans-serif;
    font-size: 1.2rem;
    color: #6b6b88;
    margin: 1rem 0 0.5rem;
  }

  /* ── Skeleton ── */
  .skel-pulse {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: skelpulse 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes skelpulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Flame animation for #1 ── */
  .flame-pulse {
    animation: flameglow 2s ease-in-out infinite;
  }
  @keyframes flameglow {
    0%, 100% { filter: drop-shadow(0 0 6px rgba(249,209,0,0.6)); }
    50% { filter: drop-shadow(0 0 14px rgba(249,115,22,0.9)); }
  }

  /* ── Avatar fallback ── */
  .av-fallback {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99,102,241,0.2);
    color: #a5b4fc;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
  }
`;

/* ─────────────────────────────────────────
   Small helpers
───────────────────────────────────────── */
const AV: React.FC<{ src?: string | null; name: string; size: number; cls?: string }> = ({ src, name, size, cls = '' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }} className={cls}>
    {src
      ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <div className="av-fallback" style={{ fontSize: size * 0.35 }}>{name?.charAt(0)?.toUpperCase() || '?'}</div>
    }
  </div>
);

/* ─────────────────────────────────────────
   Podium Card (top 3)
───────────────────────────────────────── */
const PodiumCard: React.FC<{ entry: LeaderboardEntry; rank: 1 | 2 | 3; onClick: () => void }> = React.memo(({ entry, rank, onClick }) => {
  const sz = rank === 1 ? 64 : 54;
  const crownCls = `podium-crown podium-crown-${rank}`;
  const cardCls = `podium-card podium-${rank}`;
  const nameCls = `podium-name podium-name-${rank}`;
  const ptsCls = `podium-points podium-points-${rank}`;
  const avBorderColor = rank === 1 ? 'rgba(249,209,0,0.6)' : rank === 2 ? 'rgba(148,163,184,0.4)' : 'rgba(194,120,50,0.4)';
  const CrownIcon = rank === 1 ? Crown : rank === 2 ? ShieldCheck : Award;

  return (
    <div className={cardCls} onClick={onClick} role="button" tabIndex={0}>
      <div className={crownCls}>
        <CrownIcon size={rank === 1 ? 16 : 14} color="white" strokeWidth={2.5} className={rank === 1 ? 'flame-pulse' : ''} />
      </div>

      <div style={{ width: sz, height: sz, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${avBorderColor}`, flexShrink: 0 }}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="av-fallback" style={{ fontSize: sz * 0.35 }}>{entry.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
        }
      </div>

      <p className={nameCls}>{entry.full_name}</p>
      <p className="podium-uni">{entry.university || entry.mck_id}</p>

      <div className={ptsCls}>{entry.campus_points}</div>
      <div className="podium-pts-label">campus pts</div>

      {entry.trust_seller_badge && (
        <div className="trusted-pill">
          <Zap size={9} fill="currentColor" /> Trusted Seller
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────
   List item (rank 4+)
───────────────────────────────────────── */
const RankItem: React.FC<{ entry: LeaderboardEntry; rank: number; onClick: () => void }> = React.memo(({ entry, rank, onClick }) => (
  <div id={`rank-${rank}`} className="rank-item" onClick={onClick} role="button" tabIndex={0}>
    <div className="rank-item-left">
      <span className="rank-num">#{rank}</span>
      <AV src={entry.avatar_url} name={entry.full_name} size={38} />
      <div className="rank-info">
        <div className="rank-name-row">
          <span className="rank-name">{entry.full_name}</span>
          {entry.trust_seller_badge && (
            <span className="rank-zap"><Zap size={9} color="#fbbf24" fill="#fbbf24" /></span>
          )}
        </div>
        <div className="rank-uni">{entry.university || entry.mck_id}</div>
      </div>
    </div>
    <div className="rank-points-col">
      <div className="rank-pts-val">{entry.campus_points}</div>
      <div className="rank-pts-lbl">pts</div>
    </div>
  </div>
));

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
const LoadingSkeleton: React.FC = () => (
  <div className="lb-root">
    <div className="lb-container">
      <div style={{ height: 32, width: 120, marginBottom: '2rem' }} className="skel-pulse" />
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ height: 44, width: '60%', margin: '0 auto 0.5rem' }} className="skel-pulse" />
        <div style={{ height: 16, width: '40%', margin: '0 auto' }} className="skel-pulse" />
      </div>
      <div className="podium-grid" style={{ marginBottom: '2.5rem' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ borderRadius: 18, minHeight: i === 1 ? 260 : 220 }} className="skel-pulse" />
        ))}
      </div>
      <div className="rank-list">
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 60, borderRadius: 14 }} className="skel-pulse" />
        ))}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const Leaderboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT);
  const [pendingJumpRank, setPendingJumpRank] = useState<number | null>(null);
  const [disableAutoLoad, setDisableAutoLoad] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCardClick = useCallback((entry: LeaderboardEntry) => {
    if (!entry.mck_id) {
      toast({ title: 'Profile Unavailable', description: 'User profile link is currently missing a public ID.', variant: 'destructive' });
      return;
    }
    navigate(`/profile/${entry.mck_id}`);
  }, [navigate, toast]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const [{ data: boardData, error: boardError }, { data: userData }] = await Promise.all([
      supabase.rpc('get_monthly_leaderboard'),
      supabase.auth.getUser(),
    ]);

    if (boardError) {
      toast({ title: 'Error', description: 'Failed to load leaderboard', variant: 'destructive' });
      setLeaderboard([]);
    } else {
      const fullList = boardData || [];
      const currentUserId = userData?.user?.id;
      if (currentUserId) {
        const userIndex = fullList.findIndex((u: LeaderboardEntry) => u.user_id === currentUserId);
        setGlobalRank(userIndex !== -1 ? userIndex + 1 : null);
      }
      setLeaderboard(fullList.slice(0, MAX_VISIBLE_RANKS));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (pendingJumpRank) {
      const el = document.getElementById(`rank-${pendingJumpRank}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setPendingJumpRank(null);
        setTimeout(() => setDisableAutoLoad(false), 500);
      }
    }
  }, [visibleCount, pendingJumpRank]);

  useEffect(() => {
    if (loading || leaderboard.length <= 3 + visibleCount) return;
    const handleScroll = () => {
      if (disableAutoLoad) return;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - SCROLL_THRESHOLD) {
          setVisibleCount(prev => Math.min(prev + LOAD_INCREMENT, leaderboard.length - 3));
        }
      }, 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [loading, leaderboard.length, visibleCount, disableAutoLoad]);

  useEffect(() => { fetchLeaderboard(); }, []);

  const handleJumpToRank = () => {
    if (globalRank && globalRank > 3) {
      setDisableAutoLoad(true);
      if (globalRank <= MAX_VISIBLE_RANKS) {
        const newVisibleCount = Math.min(globalRank - 3 + 5, leaderboard.length - 3);
        setVisibleCount(newVisibleCount);
        setPendingJumpRank(globalRank);
      } else {
        setTimeout(() => setDisableAutoLoad(false), 500);
      }
    }
  };

  if (loading) return <LoadingSkeleton />;

  const topThree = leaderboard.slice(0, 3);
  const remainingRanksToDisplay = leaderboard.slice(3, 3 + visibleCount);
  const totalRanksFetched = leaderboard.length;
  const hasMoreToLoad = totalRanksFetched > 3 + visibleCount;
  const showJumpButton = globalRank && globalRank > 3 && globalRank <= MAX_VISIBLE_RANKS && globalRank > 3 + visibleCount;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lb-root">
        <div className="lb-container">

          {/* Header */}
          <div className="lb-header">
            <button className="lb-back-btn" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={14} /> Back
            </button>
            <div className="lb-title-block">
              <h1 className="lb-title">Campus Elite</h1>
              <p className="lb-subtitle">Monthly Top Performers · Ranked by Campus Points</p>
            </div>
          </div>

          {/* Podium (Top 3) */}
          {topThree.length > 0 && (
            <div className="podium-grid">
              {/* 2nd — left */}
              {topThree[1]
                ? <PodiumCard entry={topThree[1]} rank={2} onClick={() => handleCardClick(topThree[1])} />
                : <div />}
              {/* 1st — center */}
              {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} onClick={() => handleCardClick(topThree[0])} />}
              {/* 3rd — right */}
              {topThree[2]
                ? <PodiumCard entry={topThree[2]} rank={3} onClick={() => handleCardClick(topThree[2])} />
                : <div />}
            </div>
          )}

          {/* Empty state */}
          {leaderboard.length === 0 && (
            <div className="empty-state">
              <Trophy size={52} strokeWidth={1.2} />
              <h3>Leaderboard is empty</h3>
              <p style={{ fontSize: '0.82rem' }}>Be the first to earn points and claim the #1 spot!</p>
            </div>
          )}

          {/* Rank 4+ list */}
          {remainingRanksToDisplay.length > 0 && (
            <>
              <div className="lb-divider">
                <div className="lb-divider-line" />
                <div className="lb-divider-label">
                  <Users size={11} />
                  Ranks 4 – {3 + remainingRanksToDisplay.length}
                </div>
                <div className="lb-divider-line" />
              </div>

              <div className="rank-list">
                {remainingRanksToDisplay.map((entry, index) => (
                  <RankItem
                    key={entry.user_id}
                    entry={entry}
                    rank={index + 4}
                    onClick={() => handleCardClick(entry)}
                  />
                ))}
              </div>

              {hasMoreToLoad && (
                <button
                  className="load-more-btn"
                  onClick={() => setVisibleCount(prev => Math.min(prev + LOAD_INCREMENT, totalRanksFetched - 3))}
                >
                  Load More <ChevronDown size={14} />
                </button>
              )}
              {!hasMoreToLoad && (
                <p className="end-text">— Top {MAX_VISIBLE_RANKS} shown —</p>
              )}
            </>
          )}

          {/* Info Grid */}
          <div className="info-grid">
            {/* Monthly Rewards */}
            <div className="info-card">
              <div className="info-card-title">
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                Monthly Rewards
              </div>
              <div className="reward-row reward-row-1">
                <span className="reward-label-1">🥇 1st</span>
                <span className="reward-desc">Campus Ambassador</span>
              </div>
              <div className="reward-row reward-row-2">
                <span className="reward-label-2">🥈 2nd</span>
                <span className="reward-desc">Elite Intern Certificate</span>
              </div>
              <div className="reward-row reward-row-3">
                <span className="reward-label-3">🥉 3rd</span>
                <span className="reward-desc">Top Contributor Cert.</span>
              </div>
            </div>

            {/* Points Breakdown */}
            <div className="info-card">
              <div className="info-card-title">
                <Target size={14} color="#a5b4fc" />
                Points Breakdown
              </div>
              <div className="pts-row">
                <span>Complete a sale</span>
                <span className="pts-badge" style={{ color: '#4ade80' }}>+10 pts</span>
              </div>
              <div className="pts-row">
                <span>Make a purchase</span>
                <span className="pts-badge" style={{ color: '#60a5fa' }}>+5 pts</span>
              </div>
              <div className="pts-row">
                <span>Get verified</span>
                <span className="pts-badge" style={{ color: '#fbbf24' }}>+20 pts</span>
              </div>
              <div className="pts-row">
                <span>First listing</span>
                <span className="pts-badge" style={{ color: '#c084fc' }}>+15 pts</span>
              </div>
              <div className="pts-row">
                <span>7+ deals</span>
                <span className="pts-badge" style={{ color: '#fbbf24' }}>Trusted Badge</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sticky "My Rank" bar */}
        {globalRank !== null && globalRank > 3 && (
          <div className="sticky-rank">
            <div className="sticky-rank-left">
              <Crown size={16} color="#a5b4fc" fill="#a5b4fc" />
              Your Global Rank
            </div>
            <span className="sticky-rank-num">#{globalRank}</span>
          </div>
        )}

        {/* Jump to my rank button */}
        {showJumpButton && (
          <button className="jump-btn" onClick={handleJumpToRank} title="Jump to my rank">
            <Locate size={18} />
          </button>
        )}
      </div>
    </>
  );
};

export default Leaderboard;
