import React, { useEffect, useState, useCallback, useRef, TouchEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/mycampuskart-logo.png';
import {
  ArrowLeft, MessageCircle, Heart, Share2, MapPin, Eye,
  AlertCircle, Shield, AlertTriangle, DollarSign,
  Package, Key, LogIn, ChevronRight, X, ChevronLeft,
  CheckCircle2, Clock, Tag, Star, Sparkles, TrendingUp,
  Users, ZoomIn,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';
import { BargainingDialog } from '@/components/BargainingDialog';

// ─── WhatsApp SVG Icon ────────────────────────────────────────────────────────
const WhatsAppIcon = ({ style = {} }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: 'currentColor', flexShrink: 0, ...style }} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── Cloudinary helpers ────────────────────────────────────────────────────────
const getDetailImage = (url: string) =>
  url?.includes('cloudinary.com') ? url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1400/') : url;
const getThumbImage = (url: string) =>
  url?.includes('cloudinary.com') ? url.replace('/upload/', '/upload/f_auto,q_auto:low,w_120,h_120,c_fill/') : url;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  is_verified: boolean; verification_status: string; avatar_url: string | null;
  mck_id: string; trust_seller_badge: boolean; campus_points: number; deals_completed: number;
}
interface Category { id: string; name: string; slug: string; icon: string; }
interface RentalMetadata { rental_duration?: string; rental_deposit?: number; }
interface Item {
  id: string; title: string; description: string; price: number; condition: string;
  images: string[]; location: string; is_sold: boolean; views: number; created_at: string;
  seller_id: string; categories: Category | null; profiles: Profile | null;
  rental_metadata?: RentalMetadata | null; is_negotiable?: boolean; whatsapp_number?: string | null;
}

const conditionMap: Record<string, { label: string; bg: string; text: string }> = {
  'Brand New': { label: 'Brand New', bg: '#dcfce7', text: '#166534' },
  'Like New':  { label: 'Like New',  bg: '#d1fae5', text: '#065f46' },
  'Good':      { label: 'Good',      bg: '#dbeafe', text: '#1e40af' },
  'Fair':      { label: 'Fair',      bg: '#fef9c3', text: '#854d0e' },
  'For Parts': { label: 'For Parts', bg: '#fee2e2', text: '#991b1b' },
};

// ─── Swipeable Image Gallery ──────────────────────────────────────────────────
interface GalleryProps {
  images: string[];
  currentIndex: number;
  onChange: (i: number) => void;
  onOpenLightbox: () => void;
  isSold: boolean;
  condition: string;
  isNegotiable?: boolean;
}

const ImageGallery: React.FC<GalleryProps> = ({ images, currentIndex, onChange, onOpenLightbox, isSold, condition, isNegotiable }) => {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging  = useRef(false);
  const cond = conditionMap[condition] ?? { label: condition, bg: '#f3f4f6', text: '#374151' };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 8) isDragging.current = true;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && currentIndex < images.length - 1) onChange(currentIndex + 1);
    if (dx > 0 && currentIndex > 0) onChange(currentIndex - 1);
  };

  return (
    <div style={{ position: 'relative', background: '#0c0c0c', overflow: 'hidden' }}>
      {/* Sliding strip */}
      <div
        style={{ display: 'flex', transition: 'transform 0.32s cubic-bezier(.4,0,.2,1)', transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, idx) => (
          <div key={idx} style={{ flexShrink: 0, width: '100%', aspectRatio: '1/1', position: 'relative', cursor: 'zoom-in' }} onClick={onOpenLightbox}>
            <img
              src={getDetailImage(img)}
              alt={`Photo ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Sold stamp */}
      {isSold && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: '#ef4444', color: '#fff', fontWeight: 900, fontSize: 22, padding: '10px 28px', borderRadius: 100, letterSpacing: '0.12em', transform: 'rotate(-8deg)', boxShadow: '0 8px 32px rgba(239,68,68,0.4)' }}>SOLD</div>
        </div>
      )}

      {/* Top gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, background: 'linear-gradient(to bottom,rgba(0,0,0,0.4),transparent)', pointerEvents: 'none' }} />

      {/* Chips */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: cond.bg, color: cond.text }}>
          {cond.label}
        </span>
        {isNegotiable && !isSold && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={10} /> Negotiable
          </span>
        )}
      </div>

      {/* Zoom hint */}
      <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ZoomIn size={14} color="#fff" />
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
          {images.map((_, idx) => (
            <button key={idx} onClick={() => onChange(idx)}
              style={{ border: 'none', cursor: 'pointer', padding: 0, borderRadius: 100, height: 5, transition: 'all .22s', background: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.38)', width: idx === currentIndex ? 18 : 5 }} />
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>
          {currentIndex + 1}/{images.length}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ItemDetail = () => {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const { toast }   = useToast();

  const [item,         setItem]        = useState<Item | null>(null);
  const [similar,      setSimilar]     = useState<Item[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [imgIdx,       setImgIdx]      = useState(0);
  const [userProfile,  setProfile]     = useState<Profile | null>(null);
  const [isFav,        setIsFav]       = useState(false);
  const [favLoading,   setFavLoading]  = useState(false);
  const [reportOpen,   setReportOpen]  = useState(false);
  const [bargainOpen,  setBargainOpen] = useState(false);
  const [lightboxOpen, setLbOpen]      = useState(false);
  const [pendingMine,  setPMine]       = useState(false);
  const [pendingOther, setPOther]      = useState(false);
  const [buying,       setBuying]      = useState(false);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); if (id) fetchItem(); }, [id]);
  useEffect(() => { if (user && id) { fetchProfile(); checkFav(); } else { setProfile(null); setIsFav(false); } }, [user, id]);

  const checkPending = useCallback(async (itemId: string, uid: string) => {
    const { data, error } = await supabase.from('orders').select('buyer_id')
      .eq('item_id', itemId).eq('status', 'pending').maybeSingle();
    if (error) { setPMine(false); setPOther(false); return; }
    if (data) { setPMine(data.buyer_id === uid); setPOther(data.buyer_id !== uid); }
    else { setPMine(false); setPOther(false); }
  }, []);

  useEffect(() => {
    if (!user?.id || !item?.id) return;
    checkPending(item.id, user.id);
    const ch = supabase.channel(`item_${item.id}_orders`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `item_id=eq.${item.id}` },
        () => checkPending(item.id, user.id)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, item?.id, checkPending]);

  useEffect(() => {
    if (!lightboxOpen || !item) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setImgIdx(i => (i + 1) % item.images.length);
      if (e.key === 'ArrowLeft')  setImgIdx(i => (i - 1 + item.images.length) % item.images.length);
      if (e.key === 'Escape') setLbOpen(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightboxOpen, item]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchItem = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('items').select('*, categories (*), profiles (*)').eq('id', id).single();
    if (!error) {
      setItem(data as Item);
      if ((data as Item).categories?.id) fetchSimilar((data as Item).categories!.id, data.id);
      const key = `viewed_${id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        supabase.from('items').update({ views: (data.views || 0) + 1 }).eq('id', id).then(() => {});
      }
    } else setItem(null);
    setLoading(false);
  };

  const fetchSimilar = async (catId: string, curId: string) => {
    const { data } = await supabase.from('items').select('id, title, price, images, condition')
      .eq('category_id', catId).neq('id', curId).eq('is_sold', false).limit(8);
    if (data) setSimilar(data as any);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (!error) setProfile(data as Profile);
  };

  const checkFav = async () => {
    if (!user || !id) return;
    const { data, error } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('item_id', id).maybeSingle();
    setIsFav(!error && !!data);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const toggleFav = async () => {
    if (!user) { navigate('/auth'); return; }
    setFavLoading(true);
    try {
      if (isFav) { await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_id', id); setIsFav(false); sonnerToast.success('Removed from wishlist'); }
      else { await supabase.from('favorites').insert({ user_id: user.id, item_id: id }); setIsFav(true); sonnerToast.success('❤️ Saved to wishlist!'); }
    } finally { setFavLoading(false); }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/auth');
    const ok = userProfile?.is_verified && userProfile?.verification_status === 'approved';
    if (!ok) { toast({ title: 'KYC Required', variant: 'destructive' }); return navigate('/kyc'); }
    if (!item || user.id === item.seller_id || item.is_sold) return;
    setBuying(true);
    const { data: res, error } = await supabase.rpc('create_new_order', {
      item_id_input: item.id, buyer_id_input: user.id, seller_id_input: item.seller_id, agreed_price_input: item.price,
    });
    setBuying(false);
    if (error) { sonnerToast.error('Order failed. Try again.'); return; }
    const r = res as { success?: boolean; error?: string } | null;
    if (!r?.success) { sonnerToast.error(r?.error || 'Order failed.'); return navigate('/my-orders'); }
    sonnerToast.success('🎉 Reserved! Go to My Orders.');
    setPMine(true); setPOther(false); navigate('/my-orders');
  };

  const handleChat = async (offerPrice?: number) => {
    if (!user) { navigate('/auth'); return; }
    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({ title: 'KYC Required', variant: 'destructive' }); return navigate('/kyc');
    }
    if (!item) return;
    try {
      const { data: ex } = await supabase.from('conversations').select('id').eq('item_id', item.id).eq('buyer_id', user.id).eq('seller_id', item.seller_id).maybeSingle();
      if (ex) { if (offerPrice) await sendOffer(ex.id, offerPrice); return navigate(`/chat/${ex.id}`); }
      const { data: nw, error } = await supabase.from('conversations').insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id }).select().single();
      if (error) throw error;
      if (offerPrice) await sendOffer(nw.id, offerPrice);
      navigate(`/chat/${nw.id}`);
    } catch { toast({ title: 'Error', description: 'Could not start chat', variant: 'destructive' }); }
  };

  const sendOffer = async (convId: string, price: number) => {
    await supabase.from('messages').insert({ conversation_id: convId, sender_id: user!.id, content: `Hi! Interested in "${item?.title}". My offer: ₹${price.toLocaleString()}. Let's talk!` });
  };

  const handleWhatsApp = () => {
    if (!item?.whatsapp_number) return;
    let phone = item.whatsapp_number.replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi! I'm interested in "${item.title}" on MyCampusKart. Still available?`)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: item?.title, url: window.location.href }); } catch {} }
    else { navigator.clipboard.writeText(window.location.href); sonnerToast.success('🔗 Link copied!'); }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f4f2', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #ebebeb' }} />
      <div style={{ aspectRatio: '1/1', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0.7, 0.35, 1, 0.5].map((w, i) => (
          <div key={i} style={{ height: i === 2 ? 64 : 24, width: `${w * 100}%`, borderRadius: 12, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))}
      </div>
    </div>
  );

  if (!item) return (
    <div style={{ minHeight: '100vh', background: '#f5f4f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>Item Not Found</div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>This listing may have been removed or doesn't exist.</div>
      <button onClick={() => navigate('/')} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 100, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Back to Home
      </button>
    </div>
  );

  const isOwner    = user?.id === item.seller_id;
  const isVerified = !!(user && userProfile?.is_verified && userProfile?.verification_status === 'approved');
  const isDisabled = !user || (!isVerified && !isOwner) || item.is_sold || pendingMine || pendingOther;
  const isRental   = !!item.rental_metadata?.rental_duration;
  const daysAgo    = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);
  const listedText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
  const images     = item.images?.length ? item.images : [];
  const buyLabel   = item.is_sold ? 'Sold Out' : pendingOther ? 'Reserved' : pendingMine ? 'Reserved ✓' : buying ? '…' : isRental ? 'Reserve' : 'Buy Now';

  /* ─────────────────────────────── STYLES ─────────────────────────────────── */
  const S = {
    page: { minHeight: '100vh', background: '#f5f4f2', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" } as React.CSSProperties,
    inkBtn: (extra: React.CSSProperties = {}): React.CSSProperties => ({ background: '#111', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', transition: 'background .15s', ...extra }),
    ghostBtn: (extra: React.CSSProperties = {}): React.CSSProperties => ({ background: '#fff', color: '#111', border: '1.5px solid #ddd', borderRadius: 100, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', transition: 'border-color .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...extra }),
    waBtn: (extra: React.CSSProperties = {}): React.CSSProperties => ({ background: '#25D366', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...extra }),
    iconBtn: (extra: React.CSSProperties = {}): React.CSSProperties => ({ background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...extra }),
    card: { background: '#fff', borderRadius: 20, border: '1px solid #ebebeb' } as React.CSSProperties,
    badge: (extra: React.CSSProperties = {}): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, ...extra }),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
        .no-sb::-webkit-scrollbar{display:none}.no-sb{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes floatUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .float-up{animation:floatUp .38s ease both}
        .ib:hover{background:#1a1a1a!important}
        .ib:active{transform:scale(.97)}
        .ib:disabled{opacity:.4;cursor:not-allowed}
        .gb:hover{border-color:#111!important}
        .gb:disabled{opacity:.4;cursor:not-allowed}
        .wab:hover{background:#1ebe5d!important}
        .wab:disabled{opacity:.4;cursor:not-allowed}
        .sim-card:hover img{transform:scale(1.06)}
        .sim-card img{transition:transform .3s}
        @media(min-width:1024px){
          .mobile-bar{display:none!important}
          .desktop-actions{display:flex!important}
          .page-inner{display:grid!important;grid-template-columns:7fr 5fr;gap:48px;padding:32px 24px}
          .img-col{position:static}
          .info-col{padding:0!important}
          .thumbs{display:flex!important}
          .detail-sticky{position:sticky;top:72px}
          .mob-breadcrumb{display:none!important}
          .desktop-safety{display:block!important}
        }
        @media(max-width:1023px){
          .desktop-actions{display:none!important}
          .page-inner{display:block}
          .thumbs{display:none!important}
          .desktop-safety{display:none!important}
        }
      `}</style>

      <div style={S.page}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <button onClick={() => navigate(-1)} style={S.iconBtn({ width: 36, height: 36 })}>
              <ArrowLeft size={16} color="#111" />
            </button>
            <img src={logo} alt="MyCampusKart" style={{ height: 26, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleShare} style={S.iconBtn({ width: 36, height: 36 })} title="Share"><Share2 size={15} color="#555" /></button>
              <button onClick={() => setReportOpen(true)} style={S.iconBtn({ width: 36, height: 36, borderColor: '#fecaca' })} title="Report"><AlertTriangle size={14} color="#ef4444" /></button>
            </div>
          </div>
        </header>

        {/* ── Page Grid ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="page-inner">

            {/* ── IMAGE COLUMN ─────────────────────────────────────────── */}
            <div className="img-col">
              <div style={{ background: '#0c0c0c', overflow: 'hidden' }}>
                {images.length > 0 ? (
                  <ImageGallery images={images} currentIndex={imgIdx} onChange={setImgIdx}
                    onOpenLightbox={() => setLbOpen(true)} isSold={item.is_sold}
                    condition={item.condition} isNegotiable={item.is_negotiable} />
                ) : (
                  <div style={{ aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 56 }}>📷</span>
                    <span style={{ fontSize: 13, color: '#666' }}>No images available</span>
                  </div>
                )}
              </div>

              {/* Desktop thumbnail strip */}
              <div className="thumbs no-sb" style={{ display: 'none', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 4, flexWrap: 'nowrap' }}>
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setImgIdx(idx)} style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 12, overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer', outline: idx === imgIdx ? '2.5px solid #111' : '2px solid transparent', outlineOffset: 2, opacity: idx === imgIdx ? 1 : 0.5, transition: 'all .2s' }}>
                    <img src={getThumbImage(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>

              {/* Desktop safety */}
              <div className="desktop-safety" style={{ display: 'none', marginTop: 16, background: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={13} color="#059669" /> Campus Safety
                </div>
                {['Meet in public, lit campus areas', 'Inspect the item before paying', 'Keep all chats on MyCampusKart'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
                    <CheckCircle2 size={12} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── INFO COLUMN ───────────────────────────────────────────── */}
            <div className="info-col detail-sticky float-up" style={{ padding: '16px 16px 0' }}>

              {/* Mobile breadcrumbs */}
              <nav className="mob-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#aaa', marginBottom: 12, flexWrap: 'wrap' }}>
                <Link to="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</Link>
                {item.categories && (<><ChevronRight size={11} /><span style={{ color: '#888' }}>{item.categories.name}</span></>)}
                <ChevronRight size={11} />
                <span style={{ color: '#666', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
              </nav>

              {/* Desktop breadcrumbs */}
              <nav style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#aaa', marginBottom: 14, flexWrap: 'wrap' }} className="desktop-only">
                <Link to="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</Link>
                {item.categories && (<><ChevronRight size={11} /><Link to={`/category/${item.categories.slug}`} style={{ color: '#aaa', textDecoration: 'none' }}>{item.categories.name}</Link></>)}
                <ChevronRight size={11} />
                <span style={{ color: '#666', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
              </nav>

              {/* Sold banner */}
              {item.is_sold && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 22 }}>🚫</span>
                  <div><div style={{ fontWeight: 700, fontSize: 13, color: '#b91c1c' }}>This item has been sold</div><div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Check similar items below</div></div>
                </div>
              )}

              {/* Category */}
              {item.categories && (
                <div style={{ marginBottom: 10 }}>
                  <span style={S.badge({ background: '#f0f0f0', color: '#555' })}>
                    <Tag size={10} /> {item.categories.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(22px,5.5vw,32px)', fontWeight: 400, color: '#111', lineHeight: 1.2, margin: '0 0 10px', letterSpacing: '-0.2px' }}>
                {item.title}
              </h1>

              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px', marginBottom: 16, fontSize: 12, color: '#999' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {item.views.toLocaleString()} views</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {listedText}</span>
                {item.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                    <MapPin size={12} /> {item.location}
                  </span>
                )}
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px,8vw,44px)', color: '#111', lineHeight: 1 }}>
                  ₹{item.price.toLocaleString()}
                </span>
                {isRental && item.rental_metadata?.rental_duration && (
                  <span style={{ fontSize: 15, color: '#888', marginBottom: 4, fontWeight: 500 }}>
                    /{item.rental_metadata.rental_duration.replace('per_', '')}
                  </span>
                )}
                {item.is_negotiable && (
                  <span style={S.badge({ background: '#d1fae5', color: '#065f46', marginBottom: 4 })}>Negotiable</span>
                )}
              </div>

              {/* Rental details */}
              {isRental && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Key size={16} color="#15803d" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#15803d', marginBottom: 4 }}>Rental Item</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#166534' }}>
                      <span>Security deposit</span>
                      <span style={{ fontWeight: 700 }}>{item.rental_metadata?.rental_deposit ? `₹${item.rental_metadata.rental_deposit.toLocaleString()}` : 'None'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: '#ebebeb', margin: '0 0 16px' }} />

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 8 }}>About this item</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>{item.description}</p>
              </div>

              <div style={{ height: 1, background: '#ebebeb', margin: '0 0 16px' }} />

              {/* Seller */}
              <button onClick={() => item.profiles?.mck_id && navigate(`/profile/${item.profiles.mck_id}`)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: 'inherit' }}>
                <Avatar style={{ width: 44, height: 44, border: '2px solid #f0f0f0', flexShrink: 0 } as any}>
                  <AvatarImage src={item.profiles?.avatar_url || undefined} />
                  <AvatarFallback style={{ background: '#f0f0f0', color: '#555', fontWeight: 700, fontSize: 16 } as any}>
                    {item.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{item.profiles?.full_name || 'Campus User'}</span>
                    {item.profiles?.verification_status === 'approved' && (
                      <span style={S.badge({ background: '#dbeafe', color: '#1d4ed8', padding: '2px 7px' })}><CheckCircle2 size={9} /> Verified</span>
                    )}
                    {item.profiles?.trust_seller_badge && (
                      <span style={S.badge({ background: '#fef9c3', color: '#854d0e', padding: '2px 7px' })}><Star size={9} /> Trusted</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {item.profiles?.mck_id}{item.profiles?.deals_completed ? ` · ${item.profiles.deals_completed} deals` : ''}
                  </div>
                </div>
                <ChevronRight size={15} color="#ccc" style={{ flexShrink: 0 }} />
              </button>

              {/* ── DESKTOP ACTIONS ────────────────────────────────────── */}
              <div className="desktop-actions" style={{ display: 'none', flexDirection: 'column', gap: 10, marginTop: 22 }}>

                {!user && (
                  <>
                    <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f5f4f2', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogIn size={20} color="#111" /></div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 4 }}>Login to Continue</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Free account to buy or chat with seller.</div>
                    </div>
                    <button className="ib" style={S.inkBtn({ width: '100%', height: 50, fontSize: 15 })} onClick={() => navigate('/auth')}>Login / Sign Up</button>
                  </>
                )}

                {user && !isVerified && !isOwner && (
                  <>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10 }}>
                      <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div><div style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>KYC Verification Needed</div><div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Complete student verification to buy or chat.</div></div>
                    </div>
                    <button className="ib" style={S.inkBtn({ width: '100%', height: 50, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 })} onClick={() => navigate('/kyc')}>
                      <Shield size={15} /> Verify Student ID
                    </button>
                  </>
                )}

                {user && (isVerified || isOwner) && !isOwner && (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="ib" style={S.inkBtn({ flex: 1, height: 52, fontSize: 16 })} onClick={handleBuyNow} disabled={isDisabled || buying}>{buyLabel}</button>
                      <button onClick={toggleFav} disabled={favLoading} style={S.iconBtn({ width: 52, height: 52, border: isFav ? '2px solid #f43f5e' : '1.5px solid #e5e5e5', background: isFav ? '#fff1f2' : '#fff' })}>
                        <Heart size={20} color={isFav ? '#f43f5e' : '#aaa'} fill={isFav ? '#f43f5e' : 'none'} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button className="gb" style={S.ghostBtn({ height: 46, fontSize: 13 })} onClick={() => setBargainOpen(true)} disabled={isDisabled}><DollarSign size={14} /> Make Offer</button>
                      <button className="gb" style={S.ghostBtn({ height: 46, fontSize: 13 })} onClick={() => handleChat()} disabled={isDisabled}><MessageCircle size={14} /> Chat</button>
                    </div>
                    {item.whatsapp_number && (
                      <button className="wab" style={S.waBtn({ width: '100%', height: 48, fontSize: 14 })} onClick={handleWhatsApp} disabled={isDisabled}>
                        <WhatsAppIcon /> WhatsApp Seller
                      </button>
                    )}
                  </>
                )}

                {isOwner && (
                  <button className="gb" style={S.ghostBtn({ width: '100%', height: 48, fontSize: 14 })} onClick={() => navigate('/dashboard')}>
                    <Sparkles size={14} /> Manage Your Listing
                  </button>
                )}
              </div>

              {/* Mobile safety card (inside info col, below CTA on mobile) */}
              <div style={{ marginTop: 24, background: '#fafafa', border: '1px solid #ebebeb', borderRadius: 16, padding: '14px 16px', marginBottom: 8 }} className="desktop-safety">
                <div style={{ fontWeight: 700, fontSize: 12, color: '#111', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={12} color="#059669" /> Safety Tips</div>
                {['Meet in public campus spots only', 'Check item before paying', 'Chat only on MyCampusKart'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}><CheckCircle2 size={11} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} /><span style={{ fontSize: 11, color: '#666' }}>{t}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Similar Items ──────────────────────────────────────────────── */}
          {user && similar.length > 0 && (
            <div style={{ padding: '8px 16px 48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Users size={16} color="#111" />
                <span style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>You might also like</span>
              </div>
              <div className="no-sb" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {similar.map(s => (
                  <Link to={`/item/${s.id}`} key={s.id} className="sim-card" style={{ flexShrink: 0, width: 136, textDecoration: 'none', display: 'block' }}>
                    <div style={{ width: 136, height: 136, borderRadius: 16, overflow: 'hidden', background: '#f0f0f0', marginBottom: 8, border: '1px solid #ebebeb' }}>
                      <img src={getThumbImage(s.images[0])} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{s.title}</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#111', marginTop: 2 }}>₹{s.price.toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE STICKY BAR ─────────────────────────────────────────── */}
        {!isOwner && (
          <div className="mobile-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 -8px 40px rgba(0,0,0,0.07)', paddingBottom: 'env(safe-area-inset-bottom)', display: 'flex' }}>
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>

              {/* Price */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 21, color: '#111', lineHeight: 1.1 }}>₹{item.price.toLocaleString()}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', gap: 7, justifyContent: 'flex-end', alignItems: 'center' }}>

                {/* NOT LOGGED IN */}
                {!user && (
                  <button className="ib" style={S.inkBtn({ flex: 1, height: 46, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 })} onClick={() => navigate('/auth')}>
                    <LogIn size={15} /> Login
                  </button>
                )}

                {/* UNVERIFIED */}
                {user && !isVerified && (
                  <button style={{ flex: 1, height: 46, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => navigate('/kyc')}>
                    <Shield size={14} /> Verify to Buy
                  </button>
                )}

                {/* VERIFIED */}
                {user && isVerified && (
                  <>
                    <button onClick={toggleFav} disabled={favLoading} style={{ width: 46, height: 46, borderRadius: '50%', border: isFav ? '2px solid #f43f5e' : '1.5px solid #e5e5e5', background: isFav ? '#fff1f2' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Heart size={18} color={isFav ? '#f43f5e' : '#aaa'} fill={isFav ? '#f43f5e' : 'none'} />
                    </button>
                    <button onClick={() => setBargainOpen(true)} disabled={isDisabled} style={S.iconBtn({ width: 46, height: 46 })}>
                      <DollarSign size={16} color={isDisabled ? '#ddd' : '#333'} />
                    </button>
                    <button onClick={() => handleChat()} disabled={isDisabled} style={S.iconBtn({ width: 46, height: 46 })}>
                      <MessageCircle size={16} color={isDisabled ? '#ddd' : '#333'} />
                    </button>
                    {item.whatsapp_number && (
                      <button onClick={handleWhatsApp} disabled={isDisabled} style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px solid #a7f3d0', background: isDisabled ? '#f0fdf4' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDisabled ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: isDisabled ? 0.5 : 1, color: '#25D366' }}>
                        <WhatsAppIcon />
                      </button>
                    )}
                    <button className="ib" style={S.inkBtn({ height: 46, padding: '0 18px', fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 })} onClick={handleBuyNow} disabled={isDisabled || buying}>
                      {buyLabel}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Lightbox ──────────────────────────────────────────────────── */}
        {lightboxOpen && images.length > 0 && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'floatUp .2s ease' }}
            onClick={e => e.target === e.currentTarget && setLbOpen(false)}>
            <button onClick={() => setLbOpen(false)} style={S.iconBtn({ position: 'absolute', top: 16, right: 16, width: 40, height: 40, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', zIndex: 2 } as any)}>
              <X size={18} color="#fff" />
            </button>
            <div style={{ position: 'absolute', top: 18, left: 18, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, zIndex: 2 }}>
              {imgIdx + 1} / {images.length}
            </div>
            {images.length > 1 && (
              <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); }}
                style={S.iconBtn({ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 2 } as any)}>
                <ChevronLeft size={20} color="#fff" />
              </button>
            )}
            <img key={imgIdx} src={getDetailImage(images[imgIdx])} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'floatUp .22s ease' }} />
            {images.length > 1 && (
              <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); }}
                style={S.iconBtn({ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 2 } as any)}>
                <ChevronRight size={20} color="#fff" />
              </button>
            )}
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7 }}>
                {images.map((_, idx) => (
                  <button key={idx} onClick={e => { e.stopPropagation(); setImgIdx(idx); }}
                    style={{ border: 'none', cursor: 'pointer', borderRadius: 100, height: 5, transition: 'all .2s', background: idx === imgIdx ? '#fff' : 'rgba(255,255,255,0.3)', width: idx === imgIdx ? 22 : 5, padding: 0 }} />
                ))}
              </div>
            )}
          </div>
        )}

        <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} reportType="listing" targetId={item?.id} targetName={item?.title} />
        <BargainingDialog isOpen={bargainOpen} onClose={() => setBargainOpen(false)} originalPrice={item?.price || 0} onSubmit={price => handleChat(price)} itemTitle={item?.title || ''} />
      </div>
    </>
  );
};

export default ItemDetail;
