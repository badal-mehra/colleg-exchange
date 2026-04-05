import React, { useEffect, useState, useCallback } from 'react';
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
  Package, Key, LogIn, ChevronRight, X, Maximize2, Phone,
  Star, CheckCircle2, Clock, Tag, ChevronLeft, ZoomIn,
  Sparkles, TrendingUp, Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ReportModal } from '@/components/ReportModal';
import { BargainingDialog } from '@/components/BargainingDialog';

// ─── Cloudinary helpers ────────────────────────────────────────────────────────
const getDetailImage = (url: string) =>
  url?.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/f_auto,q_auto:best,w_1200/')
    : url;

const getThumbImage = (url: string) =>
  url?.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/f_auto,q_auto:low,w_120,h_120,c_fill/')
    : url;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  verification_status: string;
  avatar_url: string | null;
  mck_id: string;
  trust_seller_badge: boolean;
  campus_points: number;
  deals_completed: number;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}
interface RentalMetadata {
  rental_duration?: string;
  rental_deposit?: number;
}
interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  location: string;
  is_sold: boolean;
  views: number;
  created_at: string;
  seller_id: string;
  categories: Category | null;
  profiles: Profile | null;
  rental_metadata?: RentalMetadata | null;
  is_negotiable?: boolean;
  whatsapp_number?: string | null;
}

// ─── Condition config ─────────────────────────────────────────────────────────
const conditionConfig: Record<string, { label: string; color: string; dot: string }> = {
  'Brand New':    { label: 'Brand New',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-500' },
  'Like New':     { label: 'Like New',     color: 'bg-teal-100 text-teal-700 border-teal-200',           dot: 'bg-teal-500' },
  'Good':         { label: 'Good',         color: 'bg-blue-100 text-blue-700 border-blue-200',           dot: 'bg-blue-500' },
  'Fair':         { label: 'Fair',         color: 'bg-amber-100 text-amber-700 border-amber-200',         dot: 'bg-amber-500' },
  'For Parts':    { label: 'For Parts',    color: 'bg-red-100 text-red-700 border-red-200',              dot: 'bg-red-500' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:400%_100%] rounded-xl ${className}`}
    style={{ animation: 'shimmer 1.6s ease-in-out infinite', backgroundSize: '400% 100%' }} />
);

const ItemDetailSkeleton = () => (
  <div className="min-h-screen bg-[#f8f7f5]">
    <style>{`@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>
    <div className="h-14 bg-white border-b" />
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-32">
      <SkeletonBlock className="h-4 w-48 mb-6" />
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-3">
          <SkeletonBlock className="aspect-[4/3] w-full" />
          <div className="flex gap-2">
            {[1,2,3].map(i => <SkeletonBlock key={i} className="w-20 h-20" />)}
          </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // ── Effects ──────────────────────────────────────────────────────────────────
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
    } else {
      setHasPendingOrder(false); setIsPendingBySomeoneElse(false);
    }
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

  // ── Keyboard nav for lightbox ─────────────────────────────────────────────
  useEffect(() => {
    if (!lightboxOpen || !item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentImageIndex(i => (i + 1) % item.images.length);
      if (e.key === 'ArrowLeft')  setCurrentImageIndex(i => (i - 1 + item.images.length) % item.images.length);
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, item]);

  // ── Fetch fns ─────────────────────────────────────────────────────────────
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

  // ── Actions ───────────────────────────────────────────────────────────────
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
    if (!verified) { toast({ title: 'KYC Required', description: 'Complete student verification first', variant: 'destructive' }); return navigate('/kyc'); }
    if (!item || user.id === item.seller_id || item.is_sold) return;
    setIsBuying(true);
    const { data: rpcResponse, error: rpcError } = await supabase.rpc('create_new_order', {
      item_id_input: item.id, buyer_id_input: user.id,
      seller_id_input: item.seller_id, agreed_price_input: item.price
    });
    setIsBuying(false);
    if (rpcError) {
      const t = JSON.stringify(rpcError).toLowerCase();
      sonnerToast.error(t.includes('duplicate') || t.includes('reserved') ? 'Item reserved by another buyer.' : 'Order failed. Try again.');
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

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) return <ItemDetailSkeleton />;

  if (!item) return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Package className="h-10 w-10 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h1>
      <p className="text-gray-500 mb-6">This listing may have been removed or doesn't exist.</p>
      <Button onClick={() => navigate('/')} className="rounded-full px-8">Back to Home</Button>
    </div>
  );

  // ── Derived state ────────────────────────────────────────────────────────
  const isOwner   = user?.id === item.seller_id;
  const isVerified = user && userProfile?.is_verified && userProfile?.verification_status === 'approved';
  const isDisabled = !user || (!isVerified && !isOwner) || item.is_sold || hasPendingOrder || isPendingBySomeoneElse;
  const cond       = conditionConfig[item.condition] ?? { label: item.condition, color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  const isRental   = !!item.rental_metadata?.rental_duration;
  const daysAgo    = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);
  const listedText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  const buttonLabel = item.is_sold ? '🚫 Sold Out'
    : isPendingBySomeoneElse ? '⏳ Reserved by Another'
    : hasPendingOrder ? '✅ Already Reserved'
    : isBuying ? 'Reserving…'
    : isRental ? '📦 Reserve Rental'
    : '⚡ Buy Now';

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .heart-pop { animation: heartPop 0.4s ease; }
      `}</style>

      <div className="min-h-screen bg-[#f8f7f5] font-sans">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <img src={logo} alt="MyCampusKart" className="h-7 absolute left-1/2 -translate-x-1/2" />

            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setReportModalOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-400"
                title="Report"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 pt-5 pb-32 lg:pb-12">

          {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
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

          {/* ── Sold banner ─────────────────────────────────────────────── */}
          {item.is_sold && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm">This item has been sold</p>
                <p className="text-xs text-red-600">Check out similar items below</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">

            {/* ── LEFT col: Images ────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-3 fade-up">

              {/* Main image */}
              <div
                className="relative rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-sm cursor-zoom-in group"
                style={{ aspectRatio: '4/3' }}
                onClick={() => setLightboxOpen(true)}
              >
                {item.images?.length > 0 ? (
                  <>
                    <img
                      src={getDetailImage(item.images[currentImageIndex])}
                      alt={item.title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                      <div className="bg-black/60 text-white rounded-full px-4 py-2 text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                        <ZoomIn className="h-3.5 w-3.5" /> View Full Size
                      </div>
                    </div>
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
                  <div className="absolute top-3 right-3 bg-violet-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Negotiable
                  </div>
                )}

                {/* Image counter */}
                {item.images?.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {currentImageIndex + 1} / {item.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {item.images?.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        idx === currentImageIndex
                          ? 'border-violet-500 ring-2 ring-violet-200 shadow-md'
                          : 'border-gray-200 opacity-60 hover:opacity-90 hover:border-gray-300'
                      }`}
                    >
                      <img src={getThumbImage(img)} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* ── Safety Card ──────────────────────────────────────── */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 rounded-2xl p-4 mt-2">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-3">
                  <Shield className="h-4 w-4" /> Safety Reminder
                </div>
                <div className="space-y-2">
                  {[
                    'Meet in public, well-lit campus areas only',
                    'Inspect the item carefully before paying',
                    'Use MyCampusKart chat — avoid outside contact',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-blue-700/80">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT col: Details & Actions ────────────────────── */}
            <div className="lg:col-span-5 space-y-4 fade-up" style={{ animationDelay: '0.1s' }}>

              {/* ── Main info card ──────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-4">

                {/* Category chip */}
                {item.categories && (
                  <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 rounded-full text-xs font-medium">
                    <Tag className="h-3 w-3" /> {item.categories.name}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl md:text-[1.75rem] font-bold text-gray-900 leading-tight tracking-tight">
                  {item.title}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {item.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {listedText}
                  </span>
                  {item.location && (
                    <span className="flex items-center gap-1 text-violet-600 font-medium">
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
                    <span className="ml-1 text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      Negotiable
                    </span>
                  )}
                </div>

                {/* Rental box */}
                {isRental && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Key className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-800 mb-1">Rental Item</p>
                      <div className="flex justify-between text-xs text-emerald-700">
                        <span>Security deposit</span>
                        <span className="font-bold">
                          {item.rental_metadata?.rental_deposit ? `₹${item.rental_metadata.rental_deposit.toLocaleString()}` : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-px bg-gray-100" />

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">About this item</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Seller info */}
                <button
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  onClick={() => item.profiles?.mck_id && navigate(`/profile/${item.profiles.mck_id}`)}
                >
                  <Avatar className="h-11 w-11 border-2 border-gray-100 shadow-sm flex-shrink-0">
                    <AvatarImage src={item.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-base">
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
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                </button>
              </div>

              {/* ── DESKTOP Action Area ──────────────────────────────── */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">

                {/* NOT LOGGED IN */}
                {!user && (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
                      <LogIn className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Login to Continue</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Create a free account to buy or chat with the seller.</p>
                    </div>
                    <Button
                      className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm"
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
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-sm">KYC Required</p>
                        <p className="text-xs text-amber-700 mt-0.5">Complete student verification to buy items or chat with sellers.</p>
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

                {/* VERIFIED - not owner */}
                {user && (isVerified || isOwner) && !isOwner && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 h-12 rounded-xl font-bold text-base shadow-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60"
                        onClick={handleBuyNow}
                        disabled={isDisabled || isBuying}
                      >
                        <Package className="h-5 w-5 mr-2" /> {buttonLabel}
                      </Button>
                      <button
                        onClick={toggleFavorite}
                        disabled={isTogglingFav}
                        className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          isFavorited
                            ? 'border-red-400 bg-red-50 text-red-500'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-red-300 hover:text-red-400'
                        }`}
                      >
                        <Heart className={`h-5 w-5 transition-all ${isFavorited ? 'fill-current heart-pop' : ''}`} />
                      </button>
                    </div>

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
                          className="col-span-2 h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium"
                          onClick={handleWhatsAppClick}
                          disabled={isDisabled}
                        >
                          <Phone className="h-4 w-4 mr-2" /> WhatsApp Seller
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

          {/* ── Similar Items ──────────────────────────────────────────────── */}
          {user && similarItems.length > 0 && (
            <div className="mt-10 fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" /> You might also like
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {similarItems.map((s) => (
                  <Link
                    to={`/item/${s.id}`}
                    key={s.id}
                    className="group block bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:shadow-md hover:border-violet-200 transition-all duration-200"
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={getThumbImage(s.images[0])}
                        alt={s.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-medium text-gray-900 text-xs truncate leading-snug">{s.title}</h3>
                      <p className="font-bold text-violet-600 text-sm mt-0.5">₹{s.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE Sticky Action Bar ───────────────────────────────────── */}
        {!isOwner && (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <div className="px-4 py-3 flex items-center gap-3">
              {/* Price */}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Price</span>
                <span className="font-extrabold text-lg text-gray-900 leading-tight tracking-tight">
                  ₹{item.price.toLocaleString()}
                </span>
              </div>

              <div className="flex-1 flex items-center gap-2 justify-end">

                {/* NOT LOGGED IN */}
                {!user && (
                  <Button
                    className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-sm"
                    onClick={() => navigate('/auth')}
                  >
                    <LogIn className="h-4 w-4 mr-2" /> Login to Buy
                  </Button>
                )}

                {/* UNVERIFIED */}
                {user && !isVerified && (
                  <Button
                    className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                    onClick={() => navigate('/kyc')}
                  >
                    <Shield className="h-4 w-4 mr-2" /> Verify to Buy
                  </Button>
                )}

                {/* VERIFIED */}
                {user && isVerified && (
                  <>
                    {/* Wishlist */}
                    <button
                      onClick={toggleFavorite}
                      disabled={isTogglingFav}
                      className={`h-11 w-11 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isFavorited ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>

                    {/* Make Offer */}
                    <button
                      onClick={() => setBargainingDialogOpen(true)}
                      disabled={isDisabled}
                      className="h-11 w-11 rounded-xl border-2 border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 disabled:opacity-40"
                    >
                      <DollarSign className="h-5 w-5" />
                    </button>

                    {/* Chat */}
                    <button
                      onClick={() => handleChatClick()}
                      disabled={isDisabled}
                      className="h-11 w-11 rounded-xl border-2 border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 disabled:opacity-40"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>

                    {/* WhatsApp */}
                    {item.whatsapp_number && (
                      <button
                        onClick={handleWhatsAppClick}
                        disabled={isDisabled}
                        className="h-11 w-11 rounded-xl border-2 border-green-300 bg-green-50 flex-shrink-0 flex items-center justify-center text-green-600 disabled:opacity-40"
                      >
                        <Phone className="h-5 w-5" />
                      </button>
                    )}

                    {/* Buy Now */}
                    <Button
                      className="h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 shadow-sm flex-shrink-0 disabled:opacity-60"
                      onClick={handleBuyNow}
                      disabled={isDisabled || isBuying}
                    >
                      {item.is_sold ? 'Sold' : isPendingBySomeoneElse ? 'Reserved' : hasPendingOrder ? 'Reserved ✓' : isBuying ? '...' : 'Buy Now'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* Safe area spacing for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        )}

        {/* ── Lightbox ────────────────────────────────────────────────────── */}
        {lightboxOpen && item.images?.length > 0 && (
          <div
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
            style={{ animation: 'fadeUp 0.2s ease' }}
            onClick={(e) => e.target === e.currentTarget && setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            {item.images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i - 1 + item.images.length) % item.images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Image */}
            <img
              key={currentImageIndex}
              src={getDetailImage(item.images[currentImageIndex])}
              alt={`Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              style={{ animation: 'fadeUp 0.2s ease' }}
            />

            {/* Next */}
            {item.images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => (i + 1) % item.images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Dots */}
            {item.images.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {item.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`h-2 rounded-full transition-all duration-200 ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/70 text-sm font-medium">
              {currentImageIndex + 1} / {item.images.length}
            </div>
          </div>
        )}

        {/* ── Modals ──────────────────────────────────────────────────────── */}
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
