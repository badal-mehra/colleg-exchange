import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logo from '@/assets/mycampuskart-logo.png';
import {
  ArrowLeft, MessageCircle, Heart, Share2, MapPin, Calendar, Eye,
  AlertCircle, Shield, AlertTriangle, DollarSign,
  Package, Key, LogIn, ChevronRight, X, Maximize2,
  Star, CheckCircle2, Clock, Tag, ChevronLeft, ZoomIn,
  Sparkles, TrendingUp, Users, IndianRupee
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';
import { BargainingDialog } from '@/components/BargainingDialog';

/* ─── WhatsApp SVG Icon ─────────────────────────────────────────────────── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ─── Cloudinary helpers ─────────────────────────────────────────────────── */
const getDetailImage = (url: string) =>
  url?.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/')
    : url;

const getThumbImage = (url: string) =>
  url?.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/f_auto,q_auto:low,w_120,h_120,c_fill/')
    : url;

/* ─── Interfaces ─────────────────────────────────────────────────────────── */
interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  is_verified: boolean; verification_status: string; avatar_url: string | null;
  mck_id: string; trust_seller_badge: boolean; campus_points: number; deals_completed: number;
}
interface Category { id: string; name: string; slug: string; icon: string; }
interface RentalMetadata { rental_duration?: string; rental_deposit?: number; }
interface Item {
  id: string; title: string; description: string; price: number;
  condition: string; images: string[]; location: string; is_sold: boolean;
  views: number; created_at: string; seller_id: string;
  categories: Category | null; profiles: Profile | null;
  rental_metadata?: RentalMetadata | null;
  is_negotiable?: boolean; whatsapp_number?: string | null;
}

/* ─── Condition config ───────────────────────────────────────────────────── */
const conditionConfig: Record<string, { label: string; color: string; dot: string }> = {
  'Brand New':  { label: 'Brand New', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Like New':   { label: 'Like New',  color: 'bg-teal-100 text-teal-700 border-teal-200',          dot: 'bg-teal-500' },
  'Good':       { label: 'Good',      color: 'bg-sky-100 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
  'Fair':       { label: 'Fair',      color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  'For Parts':  { label: 'For Parts', color: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500' },
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`rounded-xl ${className}`}
    style={{
      background: 'linear-gradient(90deg, #efefef 25%, #f9f9f9 50%, #efefef 75%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.6s ease-in-out infinite',
    }}
  />
);

const ItemDetailSkeleton = () => (
  <div className="min-h-screen bg-[#F3F4F6]">
    <style>{`@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>
    <div className="h-14 bg-white border-b" />
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-32">
      <SkeletonBlock className="h-4 w-48 mb-6" />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-3">
          <SkeletonBlock className="aspect-[4/3] w-full" />
          <div className="flex gap-2">{[1,2,3].map(i => <SkeletonBlock key={i} className="w-20 h-20" />)}</div>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <SkeletonBlock className="h-8 w-3/4" />
          <SkeletonBlock className="h-10 w-1/3" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [bargainingDialogOpen, setBargainingDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [isPendingBySomeoneElse, setIsPendingBySomeoneElse] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Touch swipe refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  /* ── Effects ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (id) fetchItem();
  }, [id]);

  useEffect(() => {
    if (user && id) { fetchUserProfile(); checkIfFavorited(); }
    else { setUserProfile(null); setIsFavorited(false); }
  }, [user, id]);

  const checkPendingOrder = useCallback(async (itemId: string, currentUserId: string) => {
    const { data, error } = await supabase
      .from('orders').select('buyer_id')
      .eq('item_id', itemId).eq('status', 'pending').maybeSingle();
    if (error) { setHasPendingOrder(false); setIsPendingBySomeoneElse(false); return; }
    if (data) {
      setHasPendingOrder(data.buyer_id === currentUserId);
      setIsPendingBySomeoneElse(data.buyer_id !== currentUserId);
    } else { setHasPendingOrder(false); setIsPendingBySomeoneElse(false); }
  }, []);

  useEffect(() => {
    if (!user?.id || !item?.id) return;
    checkPendingOrder(item.id, user.id);
    const ch = supabase.channel(`item_${item.id}_orders`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `item_id=eq.${item.id}` },
        () => checkPendingOrder(item.id, user.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, item?.id, checkPendingOrder]);

  useEffect(() => {
    if (!lightboxOpen || !item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, item]);

  /* ── Image navigation ───────────────────────────────────────────────────── */
  const nextImage = () => {
    if (!item) return;
    setCurrentImageIndex(i => (i + 1) % item.images.length);
  };
  const prevImage = () => {
    if (!item) return;
    setCurrentImageIndex(i => (i - 1 + item.images.length) % item.images.length);
  };

  /* ── Touch handlers ─────────────────────────────────────────────────────── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 10) isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!item || item.images.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (isDragging.current && Math.abs(diff) > 40) {
      if (diff > 0) nextImage(); else prevImage();
    }
  };

  /* ── Fetch fns ──────────────────────────────────────────────────────────── */
  const fetchItem = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items').select('*, categories (*), profiles (*)')
      .eq('id', id).single();
    if (!error) {
      setItem(data as Item);
      if ((data as Item).categories?.id) fetchSimilarItems((data as Item).categories!.id, data.id);
      const key = `item_viewed_${id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, 'true');
        supabase.from('items').update({ views: (data.views || 0) + 1 }).eq('id', id).then(() => {});
      }
    } else { setItem(null); }
    setLoading(false);
  };

  const fetchSimilarItems = async (categoryId: string, currentId: string) => {
    const { data } = await supabase.from('items')
      .select('id, title, price, images, condition, created_at')
      .eq('category_id', categoryId).neq('id', currentId)
      .eq('is_sold', false).limit(6);
    if (data) setSimilarItems(data as any);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (!error) setUserProfile(data as Profile);
  };

  const checkIfFavorited = async () => {
    if (!user || !id) return;
    const { data, error } = await supabase.from('favorites').select('id')
      .eq('user_id', user.id).eq('item_id', id).maybeSingle();
    setIsFavorited(!error && !!data);
  };

  /* ── Actions ────────────────────────────────────────────────────────────── */
  const toggleFavorite = async () => {
    if (!user) { navigate('/auth'); return; }
    setIsTogglingFav(true);
    try {
      if (isFavorited) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_id', id);
        setIsFavorited(false);
        sonnerToast.success('Removed from wishlist');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, item_id: id });
        setIsFavorited(true);
        sonnerToast.success('❤️ Added to wishlist!');
      }
    } catch { /* noop */ }
    setIsTogglingFav(false);
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/auth');
    const verified = userProfile?.is_verified && userProfile?.verification_status === 'approved';
    if (!verified) {
      toast({ title: 'KYC Required', description: 'Complete student verification first', variant: 'destructive' });
      return navigate('/kyc');
    }
    if (!item || user.id === item.seller_id || item.is_sold) return;
    setIsBuying(true);
    const { data: rpcResponse, error: rpcError } = await supabase.rpc('create_new_order', {
      item_id_input: item.id, buyer_id_input: user.id,
      seller_id_input: item.seller_id, agreed_price_input: item.price
    });
    setIsBuying(false);
    if (rpcError) {
      const t = JSON.stringify(rpcError).toLowerCase();
      sonnerToast.error(t.includes('duplicate') || t.includes('reserved')
        ? 'Item reserved by another buyer.' : 'Order failed. Try again.');
      return;
    }
    const res = rpcResponse as { success?: boolean; error?: string } | null;
    if (!res?.success) { sonnerToast.error(res?.error || 'Order failed.'); return navigate('/my-orders'); }
    sonnerToast.success('🎉 Item reserved! Check My Orders.');
    setHasPendingOrder(true); setIsPendingBySomeoneElse(false);
    navigate('/my-orders');
  };

  const handleChatClick = async (offerPrice?: number) => {
    if (!user) { navigate('/auth'); return; }
    if (!userProfile?.is_verified || userProfile?.verification_status !== 'approved') {
      toast({ title: 'Verification Required', description: 'Please complete KYC', variant: 'destructive' });
      return navigate('/kyc');
    }
    if (!item) return;
    try {
      const { data: existing } = await supabase.from('conversations').select('id')
        .eq('item_id', item.id).eq('buyer_id', user.id).eq('seller_id', item.seller_id).maybeSingle();
      if (existing) {
        if (offerPrice) await sendOfferMessage(existing.id, offerPrice);
        return navigate(`/chat/${existing.id}`);
      }
      const { data: newConv, error } = await supabase.from('conversations')
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id }).select().single();
      if (error) throw error;
      if (offerPrice) await sendOfferMessage(newConv.id, offerPrice);
      navigate(`/chat/${newConv.id}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to start conversation', variant: 'destructive' });
    }
  };

  const sendOfferMessage = async (conversationId: string, price: number) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId, sender_id: user!.id,
      content: `Hi! I'm interested in "${item?.title}". I'd like to offer ₹${price.toLocaleString()}. Can we discuss?`
    });
  };

  const handleWhatsAppClick = () => {
    if (!item?.whatsapp_number) return;
    let phone = item.whatsapp_number.replace(/\D/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    const text = `Hi! I'm interested in "${item.title}" listed on MyCampusKart. Is it still available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: item?.title, text: item?.description, url: window.location.href }); }
      catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      sonnerToast.success('🔗 Link copied!');
    }
  };

  /* ── Loading / not found ─────────────────────────────────────────────────── */
  if (loading) return <ItemDetailSkeleton />;

  if (!item) return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm">
        <Package className="h-10 w-10 text-gray-300" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h1>
      <p className="text-gray-500 mb-6">This listing may have been removed.</p>
      <Button onClick={() => navigate('/')} className="rounded-full px-8 bg-gray-900 hover:bg-gray-800">
        Back to Home
      </Button>
    </div>
  );

  /* ── Derived state ───────────────────────────────────────────────────────── */
  const isOwner   = user?.id === item.seller_id;
  const isVerified = user && userProfile?.is_verified && userProfile?.verification_status === 'approved';
  const isDisabled = !user || (!isVerified && !isOwner) || item.is_sold || hasPendingOrder || isPendingBySomeoneElse;
  const cond      = conditionConfig[item.condition] ?? { label: item.condition, color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  const isRental  = !!item.rental_metadata?.rental_duration;
  const daysAgo   = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);
  const listedText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
  const images    = item.images || [];

  const buttonLabel = item.is_sold        ? '🚫 Sold Out'
    : isPendingBySomeoneElse              ? '⏳ Reserved'
    : hasPendingOrder                     ? '✓ Reserved'
    : isBuying                            ? 'Reserving…'
    : isRental                            ? 'Reserve Rental'
    : 'Buy Now';

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.32s cubic-bezier(.4,0,.2,1) both; }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.4); }
          70%  { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        .heart-pop { animation: heartPop 0.38s ease; }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .img-slide { transition: opacity 0.22s ease; }
      `}</style>

      <div className="min-h-screen bg-[#F3F4F6]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <img src={logo} alt="MyCampusKart" className="h-7 absolute left-1/2 -translate-x-1/2" />

            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 active:scale-95"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setReportModalOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-400 active:scale-95"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 pt-5 pb-36 lg:pb-12">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 overflow-hidden whitespace-nowrap">
            <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
            {item.categories && (
              <>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <Link to={`/category/${item.categories.slug}`} className="hover:text-gray-600 transition-colors">
                  {item.categories.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <span className="truncate text-gray-600 font-medium">{item.title}</span>
          </nav>

          {/* Sold banner */}
          {item.is_sold && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm">This item has been sold</p>
                <p className="text-xs text-red-500">Check out similar items below</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">

            {/* ══ LEFT: IMAGE GALLERY ════════════════════════════════════════ */}
            <div className="lg:col-span-7 space-y-3 fade-up">

              {/* ── Main swipeable image ── */}
              <div
                className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm select-none"
                style={{ aspectRatio: '4/3' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <>
                    <img
                      key={currentImageIndex}
                      src={getDetailImage(images[currentImageIndex])}
                      alt={item.title}
                      className="w-full h-full object-contain img-slide cursor-zoom-in"
                      onClick={() => setLightboxOpen(true)}
                      draggable={false}
                    />

                    {/* Zoom hint on desktop */}
                    <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/5">
                      <div className="bg-black/60 text-white rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-lg pointer-events-auto cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                        <ZoomIn className="h-3.5 w-3.5" /> View Full Size
                      </div>
                    </div>

                    {/* Prev / Next arrows — desktop only */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full items-center justify-center text-gray-700 transition-all hover:scale-105 active:scale-95 z-10"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full items-center justify-center text-gray-700 transition-all hover:scale-105 active:scale-95 z-10"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Swipe dots (mobile) */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`rounded-full transition-all duration-200 ${
                              idx === currentImageIndex
                                ? 'w-5 h-1.5 bg-gray-900'
                                : 'w-1.5 h-1.5 bg-gray-900/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Counter pill */}
                    {images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium tabular-nums">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                    <Eye className="h-12 w-12" />
                    <p className="text-sm">No images available</p>
                  </div>
                )}

                {/* Condition badge */}
                <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${cond.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
                  {cond.label}
                </div>

                {/* Negotiable badge */}
                {item.is_negotiable && !item.is_sold && (
                  <div className="absolute bottom-3 right-3 bg-gray-900/80 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1 lg:flex hidden">
                    <TrendingUp className="h-3 w-3" /> Negotiable
                  </div>
                )}
              </div>

{/* ── Thumbnail Slider Strip ── */}
{images.length > 1 && (
  /* 1. STRICT PARENT BOUNDARY: 
    flex-none: Prevents nested flex layouts from squishing/expanding this container.
    min-w-0: Stops CSS grid/flex blowouts.
    max-w-[calc(100vw-32px)]: Hard physical limits for mobile viewports.
  */
  <div className="relative mt-3 w-full min-w-0 flex-none max-w-[calc(100vw-32px)] lg:max-w-full mx-auto">
    
    {/* 2. SWIPEABLE TRACK:
      overscroll-y-none: Kills Android vertical bounce on diagonal/aggressive horizontal swipes.
      hide-scroll: Uses the global CSS utility.
    */}
    <div 
      className="flex gap-2.5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x overscroll-x-contain overscroll-y-none hide-scroll pb-2 px-1 items-center"
      style={{ 
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        transform: 'translateZ(0)',   /* Forces GPU layer for 60fps scrolling */
        willChange: 'scroll-position' /* Optimizes scroll repaints on low-end devices */
      }}
    >
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={(e) => {
            setCurrentImageIndex(idx);
            e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }}
          className={`relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 snap-center active:scale-95 ${
            idx === currentImageIndex
              ? 'border-gray-900 ring-2 ring-gray-200 shadow-md w-[72px] h-[72px]'
              : 'border-transparent opacity-50 hover:opacity-100 w-[64px] h-[64px]'
          }`}
        >
          <img 
            src={getThumbImage(img)} 
            alt={`Thumbnail ${idx + 1}`} 
            className="w-full h-full object-cover" 
            loading="lazy"
            decoding="async"
          />
        </button>
      ))}
    </div>

    {/* 3. EDGE FADES:
      Added transform-gpu (Tailwind's equivalent of translateZ(0)) to hardware-accelerate 
      the gradients so they don't cause layout thrashing while the track scrolls beneath them.
    */}
    <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#F3F4F6] lg:from-white to-transparent pointer-events-none z-10 transform-gpu" />
    <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#F3F4F6] lg:from-white to-transparent pointer-events-none z-10 transform-gpu" />
  </div>
)}
              {/* ── Safety Card ── */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm mb-3">
                  <Shield className="h-4 w-4 text-blue-500" /> Safety Tips
                </div>
                <div className="space-y-2">
                  {[
                    'Meet in a public, well-lit campus area',
                    'Inspect the item carefully before paying',
                    'Use MyCampusKart chat — avoid outside contact',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ RIGHT: DETAILS + ACTIONS ═══════════════════════════════════ */}
            <div className="lg:col-span-5 space-y-4 fade-up" style={{ animationDelay: '0.08s' }}>

              {/* ── Main info card ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

                {/* Category chip */}
                {item.categories && (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                    <span>{item.categories.icon}</span> {item.categories.name}
                  </span>
                )}

                {/* Title */}
                <h1 className="text-2xl md:text-[1.75rem] font-bold text-gray-900 leading-tight tracking-tight">
                  {item.title}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {item.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {listedText}
                  </span>
                  {item.location && (
                    <span className="flex items-center gap-1 text-gray-600 font-medium">
                      <MapPin className="h-3.5 w-3.5" /> {item.location}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 py-1">
                  <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    ₹{item.price.toLocaleString()}
                  </span>
                  {isRental && item.rental_metadata?.rental_duration && (
                    <span className="text-base text-gray-400 font-medium">
                      /{item.rental_metadata.rental_duration.replace('per_', '')}
                    </span>
                  )}
                  {item.is_negotiable && (
                    <span className="ml-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      Negotiable
                    </span>
                  )}
                </div>

                {/* Rental box */}
                {isRental && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Key className="h-4 w-4 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-900 mb-1">Rental Item</p>
                      <div className="flex justify-between text-xs text-amber-700">
                        <span>Security deposit</span>
                        <span className="font-bold">
                          {item.rental_metadata?.rental_deposit
                            ? `₹${item.rental_metadata.rental_deposit.toLocaleString()}`
                            : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-px bg-gray-100" />

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">About this item</h3>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Seller */}
                <button
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  onClick={() => item.profiles?.mck_id && navigate(`/profile/${item.profiles.mck_id}`)}
                >
                  <Avatar className="h-11 w-11 border-2 border-gray-100 flex-shrink-0">
                    <AvatarImage src={item.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-base">
                      {item.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{item.profiles?.full_name || 'Campus User'}</span>
                      {item.profiles?.verification_status === 'approved' && (
                        <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-blue-200">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                      {item.profiles?.trust_seller_badge && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-200">
                          <Star className="h-2.5 w-2.5" /> Trusted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {item.profiles?.mck_id}
                      {item.profiles?.deals_completed ? ` · ${item.profiles.deals_completed} deals` : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </button>
              </div>

              {/* ── DESKTOP Action Area ── */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

                {/* NOT LOGGED IN */}
                {!user && (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                      <LogIn className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Login to Continue</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Create a free account to buy or chat with the seller.</p>
                    </div>
                    <Button
                      className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                      onClick={() => navigate('/auth')}
                    >
                      <LogIn className="h-4 w-4 mr-2" /> Login / Sign Up
                    </Button>
                  </div>
                )}

                {/* UNVERIFIED */}
                {user && !isVerified && !isOwner && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-sm">KYC Required</p>
                        <p className="text-xs text-amber-700 mt-0.5">Complete student verification to buy or chat.</p>
                      </div>
                    </div>
                    <Button
                      className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                      onClick={() => navigate('/kyc')}
                    >
                      <Shield className="h-4 w-4 mr-2" /> Verify My Student ID
                    </Button>
                  </div>
                )}

                {/* VERIFIED */}
                {user && (isVerified || isOwner) && !isOwner && (
                  <div className="space-y-3">
                    {/* Buy + Wishlist row */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 h-12 rounded-xl font-bold text-base bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
                        onClick={handleBuyNow}
                        disabled={isDisabled || isBuying}
                      >
                        <Package className="h-5 w-5 mr-2" /> {buttonLabel}
                      </Button>
                      <button
                        onClick={toggleFavorite}
                        disabled={isTogglingFav}
                        className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isFavorited
                            ? 'border-red-400 bg-red-50 text-red-500'
                            : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`h-5 w-5 transition-all ${isFavorited ? 'fill-current heart-pop' : ''}`} />
                      </button>
                    </div>

                    {/* Secondary actions */}
                    <div className={`grid gap-2 ${item.whatsapp_number ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                        onClick={() => setBargainingDialogOpen(true)}
                        disabled={isDisabled}
                      >
                        <DollarSign className="h-4 w-4 mr-1.5" /> Make Offer
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                        onClick={() => handleChatClick()}
                        disabled={isDisabled}
                      >
                        <MessageCircle className="h-4 w-4 mr-1.5" /> Chat
                      </Button>
                      {item.whatsapp_number && (
                        <Button
                          className="col-span-2 h-11 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold"
                          onClick={handleWhatsAppClick}
                          disabled={isDisabled}
                        >
                          <WhatsAppIcon className="h-4 w-4 mr-2" /> WhatsApp Seller
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* OWNER */}
                {isOwner && (
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl font-semibold border-gray-200"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" /> Manage Your Listing
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ══ SIMILAR ITEMS ══════════════════════════════════════════════════ */}
          {similarItems.length > 0 && (
            <div className="mt-10 fade-up" style={{ animationDelay: '0.18s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" /> You might also like
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {similarItems.map((s) => (
                  <Link
                    to={`/item/${s.id}`}
                    key={s.id}
                    className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={getThumbImage(s.images[0])}
                        alt={s.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-medium text-gray-800 text-xs truncate">{s.title}</h3>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">₹{s.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ MOBILE STICKY ACTION BAR ═══════════════════════════════════════ */}
        {!isOwner && (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-[0_-8px_24px_rgba(0,0,0,0.07)]">
            <div className="px-4 py-3 flex items-center gap-2.5 max-w-lg mx-auto">

              {/* Price */}
              <div className="flex flex-col flex-shrink-0 min-w-0 mr-1">
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">Price</span>
                <span className="font-extrabold text-lg text-gray-900 leading-tight tabular-nums">
                  ₹{item.price.toLocaleString()}
                </span>
              </div>

              <div className="flex-1 flex items-center gap-2 justify-end overflow-hidden">

                {/* NOT LOGGED IN */}
                {!user && (
                  <Button
                    className="flex-1 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm"
                    onClick={() => navigate('/auth')}
                  >
                    <LogIn className="h-4 w-4 mr-2 flex-shrink-0" /> Login to Buy
                  </Button>
                )}

                {/* UNVERIFIED */}
                {user && !isVerified && (
                  <Button
                    className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
                    onClick={() => navigate('/kyc')}
                  >
                    <Shield className="h-4 w-4 mr-2 flex-shrink-0" /> Verify to Buy
                  </Button>
                )}

                {/* VERIFIED */}
                {user && isVerified && (
                  <>
                    {/* Wishlist */}
                    <button
                      onClick={toggleFavorite}
                      disabled={isTogglingFav}
                      className={`h-11 w-11 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-95 ${
                        isFavorited ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>

                    {/* Make offer */}
                    <button
                      onClick={() => setBargainingDialogOpen(true)}
                      disabled={isDisabled}
                      className="h-11 w-11 rounded-xl border-2 border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 disabled:opacity-40 active:scale-95 transition-all"
                    >
                      <DollarSign className="h-5 w-5" />
                    </button>

                    {/* Chat */}
                    <button
                      onClick={() => handleChatClick()}
                      disabled={isDisabled}
                      className="h-11 w-11 rounded-xl border-2 border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 disabled:opacity-40 active:scale-95 transition-all"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>

                    {/* WhatsApp */}
                    {item.whatsapp_number && (
                      <button
                        onClick={handleWhatsAppClick}
                        disabled={isDisabled}
                        className="h-11 w-11 rounded-xl border-2 border-[#25D366]/50 bg-[#25D366]/10 flex-shrink-0 flex items-center justify-center text-[#25D366] disabled:opacity-40 active:scale-95 transition-all"
                      >
                        <WhatsAppIcon className="h-5 w-5" />
                      </button>
                    )}

                    {/* Buy Now */}
                    <Button
                      className="h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 flex-shrink-0 disabled:opacity-50 active:scale-95 transition-all text-sm"
                      onClick={handleBuyNow}
                      disabled={isDisabled || isBuying}
                    >
                      {item.is_sold ? 'Sold' : isPendingBySomeoneElse ? 'Reserved' : hasPendingOrder ? 'Reserved ✓' : isBuying ? '…' : 'Buy Now'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        )}

        {/* ══ LIGHTBOX ═══════════════════════════════════════════════════════ */}
        {lightboxOpen && images.length > 0 && (
          <div
            className="fixed inset-0 z-[60] bg-black/96 flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && setLightboxOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => {
              if (!item) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) { if (diff > 0) nextImage(); else prevImage(); }
            }}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/60 text-sm font-medium tabular-nums">
              {currentImageIndex + 1} / {images.length}
            </div>

            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Image */}
            <img
              key={currentImageIndex}
              src={getDetailImage(images[currentImageIndex])}
              alt={`Photo ${currentImageIndex + 1}`}
              className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl img-slide"
              draggable={false}
            />

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10 active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Dot nav */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`rounded-full transition-all duration-200 ${
                      idx === currentImageIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MODALS ══════════════════════════════════════════════════════════ */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportType="listing"
          targetId={item?.id}
          targetName={item?.title}
        />
        <BargainingDialog
          isOpen={bargainingDialogOpen}
          onClose={() => setBargainingDialogOpen(false)}
          originalPrice={item?.price || 0}
          onSubmit={(offerPrice) => handleChatClick(offerPrice)}
          itemTitle={item?.title || ''}
        />
      </div>
    </>
  );
};

export default ItemDetail;
