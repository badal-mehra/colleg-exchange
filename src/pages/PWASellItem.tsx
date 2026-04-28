import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PWAPageWrapper from '@/components/PWAPageWrapper';
import ListingTypeSelector, { ListingType } from '@/components/ListingTypeSelector';
import PGListingForm from '@/components/PGListingForm';
import { useImageUpload } from '@/hooks/useImageUpload';
import {
  Camera,
  X,
  ChevronRight,
  Coins,
  Loader2,
  Tag,
  Star,
  Crown,
  Zap,
  MapPin,
  Check,
  MessageCircle,
  Image as ImageIcon,
  IndianRupee,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Category {
  id: string;
  name: string;
  icon: string;
}

interface AdPackage {
  id: string;
  name: string;
  ad_type: 'basic' | 'premium' | 'featured' | 'urgent';
  points_cost: number;
  duration_days: number;
}

const AD_PRIORITY_MAP: Record<AdPackage['ad_type'], number> = {
  featured: 3,
  premium: 2,
  urgent: 1,
  basic: 0,
};

/* ─────────────────────────────────────────────
   Step meta — order & labels
───────────────────────────────────────────── */
const STEPS = ['photos', 'details', 'package', 'review'] as const;
type Step = (typeof STEPS)[number] | 'type';

const STEP_LABELS: Record<string, string> = {
  photos: 'Photos',
  details: 'Details',
  package: 'Boost',
  review: 'Review',
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Animated progress bar with step labels */
const StepProgress = ({ currentStep }: { currentStep: Step }) => {
  const currentIdx = STEPS.indexOf(currentStep as any);
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="flex-1 h-1 rounded-full overflow-hidden bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: i <= currentIdx ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>
      <div className="flex">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <span
              className={`text-[10px] font-medium transition-colors duration-300 ${
                i <= currentIdx ? 'text-primary' : 'text-muted-foreground/50'
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Pill chip button — used for conditions, categories, durations */
const Chip = ({
  selected,
  onClick,
  children,
  color = 'primary',
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: 'primary' | 'blue';
  disabled?: boolean;
}) => {
  const base =
    'px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 select-none active:scale-95';
  const active =
    color === 'blue'
      ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
      : 'bg-primary text-primary-foreground shadow-sm';
  const idle = 'bg-muted text-muted-foreground hover:bg-muted/70';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${selected ? active : idle} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

/** Inline validation hint */
const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
    <AlertCircle className="h-3 w-3 shrink-0" />
    {children}
  </p>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const PWASellItem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('type');
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adPackages, setAdPackages] = useState<AdPackage[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const {
    localImages,
    previewUrls,
    uploading,
    addImages,
    removeLocalImage,
    uploadAllImages,
    imageCount,
    canAddMore,
  } = useImageUpload(5);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category_id: '',
    location: '',
    whatsapp_number: '',
    ad_type: 'basic' as AdPackage['ad_type'],
    is_negotiable: true,
    rental_duration: '',
    rental_deposit: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [categoriesRes, packagesRes, pointsRes] = await Promise.all([
      supabase.from('categories').select('id, name, icon').order('name'),
      supabase.from('ad_packages').select('*').order('points_cost'),
      user
        ? supabase
            .from('profiles')
            .select('campus_points')
            .eq('user_id', user.id)
            .single()
        : null,
    ]);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (packagesRes.data) {
      setAdPackages(packagesRes.data as AdPackage[]);
      const basic = (packagesRes.data as AdPackage[]).find(
        (p) => p.ad_type === 'basic'
      );
      if (basic) setFormData((prev) => ({ ...prev, ad_type: basic.ad_type }));
    }
    if (pointsRes?.data) setUserPoints(pointsRes.data.campus_points || 0);
  };

  const selectedPackage = useMemo(
    () => adPackages.find((pkg) => pkg.ad_type === formData.ad_type) || null,
    [adPackages, formData.ad_type]
  );

  const isRentalListing = listingType === 'rent';

  const conditions = [
    { value: 'new', label: 'Brand New', emoji: '✨' },
    { value: 'like-new', label: 'Like New', emoji: '🌟' },
    { value: 'good', label: 'Good', emoji: '👍' },
    { value: 'fair', label: 'Fair', emoji: '👌' },
    { value: 'poor', label: 'Poor', emoji: '⚠️' },
  ];

  const rentalDurations = [
    { value: 'per_hour', label: 'Per Hour', emoji: '⏱️' },
    { value: 'per_day', label: 'Per Day', emoji: '📅' },
    { value: 'per_week', label: 'Per Week', emoji: '🗓️' },
    { value: 'per_month', label: 'Per Month', emoji: '📆' },
  ];

  /* ── Validation ── */
  const canProceedToDetails = imageCount > 0;
  const canProceedToPackage =
    formData.title.trim().length >= 3 &&
    formData.description.trim().length >= 10 &&
    !!formData.price &&
    parseFloat(formData.price) > 0 &&
    !!formData.condition &&
    (isRentalListing ? !!formData.rental_duration : true);
  const canSubmit =
    canProceedToPackage &&
    !!selectedPackage &&
    userPoints >= (selectedPackage?.points_cost || 0) &&
    imageCount > 0;

  /* ── Helpers ── */
  const touch = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addImages(files);
    e.target.value = '';
  };

  const handleTypeSelect = (type: ListingType) => {
    setListingType(type);
    if (type === 'sell' || type === 'rent') setStep('photos');
  };

  const goBack = () => {
    if (step === 'type') navigate(-1);
    else if (step === 'photos') {
      setListingType(null);
      setStep('type');
    } else if (step === 'details') setStep('photos');
    else if (step === 'package') setStep('details');
    else if (step === 'review') setStep('package');
  };

  const handleSubmit = async () => {
    if (!user || !selectedPackage) return;
    const cost = selectedPackage.points_cost;
    if (userPoints < cost) {
      toast({
        title: 'Not enough points 😕',
        description: `You need ${cost} pts but only have ${userPoints} pts.`,
        variant: 'destructive',
      });
      return;
    }
    if (imageCount === 0) {
      toast({
        title: 'No photos yet!',
        description: 'Add at least one photo to publish.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    const uploadedUrls = await uploadAllImages();
    if (!uploadedUrls) {
      setLoading(false);
      return;
    }

    const { error: pointsError } = await supabase
      .from('profiles')
      .update({ campus_points: userPoints - cost })
      .eq('user_id', user.id);

    if (pointsError) {
      toast({
        title: 'Transaction failed',
        description: 'Could not deduct points. Try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('items').insert({
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      condition: formData.condition,
      category_id: formData.category_id || null,
      location: formData.location.trim() || null,
      images: uploadedUrls,
      seller_id: user.id,
      ad_type: selectedPackage.ad_type,
      ad_duration_days: selectedPackage.duration_days,
      expires_at: new Date(
        Date.now() + selectedPackage.duration_days * 24 * 60 * 60 * 1000
      ).toISOString(),
      is_negotiable: formData.is_negotiable,
      ad_priority: AD_PRIORITY_MAP[selectedPackage.ad_type],
      whatsapp_number: formData.whatsapp_number.trim() || null,
      rental_metadata: isRentalListing
        ? {
            is_rental: true,
            rental_duration: formData.rental_duration,
            rental_deposit: parseFloat(formData.rental_deposit) || 0,
          }
        : null,
    });

    if (insertError) {
      await supabase
        .from('profiles')
        .update({ campus_points: userPoints })
        .eq('user_id', user.id);
      toast({
        title: 'Something went wrong',
        description: 'Failed to create listing. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: '🎉 Listing published!',
      description: 'Your item is now live for everyone to see.',
    });
    navigate('/');
    setLoading(false);
  };

  /* ─── PG redirect ─── */
  if (listingType === 'pg') {
    return (
      <PWAPageWrapper
        title="List PG / Room"
        showBack
        onBack={() => setListingType(null)}
      >
        <PGListingForm onBack={() => setListingType(null)} />
      </PWAPageWrapper>
    );
  }

  /* ── Page title ── */
  const pageTitle =
    step === 'type'
      ? 'What are you listing?'
      : step === 'photos'
      ? 'Add Photos'
      : step === 'details'
      ? isRentalListing
        ? 'Rental Details'
        : 'Item Details'
      : step === 'package'
      ? 'Boost Your Listing'
      : 'Almost There!';

  /* ── Package display helpers ── */
  const packageConfig = {
    featured: {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      bg: 'bg-yellow-50 dark:bg-yellow-500/10',
      border: 'border-yellow-400',
      badge: 'text-yellow-600 bg-yellow-100',
      perks: 'Top of search · Featured badge · 2× views',
    },
    premium: {
      icon: <Crown className="h-5 w-5 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      border: 'border-purple-400',
      badge: 'text-purple-600 bg-purple-100',
      perks: 'Priority placement · Premium badge',
    },
    urgent: {
      icon: <Zap className="h-5 w-5 text-orange-500" />,
      bg: 'bg-orange-50 dark:bg-orange-500/10',
      border: 'border-orange-400',
      badge: 'text-orange-600 bg-orange-100',
      perks: '"Urgent" tag · Highlighted listing',
    },
    basic: {
      icon: <Tag className="h-5 w-5 text-muted-foreground" />,
      bg: 'bg-muted/30',
      border: 'border-transparent',
      badge: 'text-muted-foreground bg-muted',
      perks: 'Standard listing · Free',
    },
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <PWAPageWrapper
      title={pageTitle}
      showBack
      onBack={goBack}
      rightAction={
        step !== 'type' && (
          <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-full px-3 py-1">
            <Coins className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
              {userPoints.toLocaleString()}
            </span>
          </div>
        )
      }
    >

      {/* ══════════════════════════════════════
          Step 1 — Type Selection
      ══════════════════════════════════════ */}
      {step === 'type' && (
        <div className="p-5 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
          <p className="text-muted-foreground text-sm text-center mb-6">
            Pick a listing type to get started 👇
          </p>
          <ListingTypeSelector onSelect={handleTypeSelect} />
        </div>
      )}

      {/* ══════════════════════════════════════
          Step 2 — Photos
      ══════════════════════════════════════ */}
      {step === 'photos' && (
        <div className="p-5 max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <StepProgress currentStep="photos" />

          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold">
              Add up to 5 photos{' '}
              <span className="text-muted-foreground font-normal">
                ({imageCount}/5)
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              The first photo becomes your cover image — make it count! 📸
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-3">
            {localImages.map((img, index) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-2xl overflow-hidden bg-muted ring-2 ring-border group"
              >
                <img
                  src={img.previewUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {index === 0 && (
                  <div className="absolute bottom-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                    COVER
                  </div>
                )}
                <button
                  onClick={() => removeLocalImage(img.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all active:scale-95"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}

            {canAddMore && (
              <>
                <label className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 hover:border-primary/40 transition-all active:scale-95 group">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1.5 group-hover:bg-primary/10 transition-colors">
                        <Camera className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        Camera
                      </span>
                    </>
                  )}
                </label>
                <label className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 hover:border-primary/40 transition-all active:scale-95 group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1.5 group-hover:bg-primary/10 transition-colors">
                        <ImageIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        Gallery
                      </span>
                    </>
                  )}
                </label>
              </>
            )}

            {/* Empty state placeholder slots */}
            {imageCount === 0 &&
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/10 bg-muted/20"
                />
              ))}
          </div>

          {imageCount === 0 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Add at least 1 photo to continue
              </p>
            </div>
          )}

          <Button
            className="w-full h-12 rounded-xl font-semibold gap-2 transition-all active:scale-[0.98]"
            disabled={!canProceedToDetails}
            onClick={() => setStep('details')}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════
          Step 3 — Details
      ══════════════════════════════════════ */}
      {step === 'details' && (
        <div className="p-5 max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <StepProgress currentStep="details" />

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              onBlur={() => touch('title')}
              placeholder={
                isRentalListing
                  ? 'e.g., Blue Honda Activa – perfect for campus'
                  : 'e.g., Casio fx-991ES scientific calculator'
              }
              maxLength={80}
              className="h-12 rounded-xl text-sm focus-visible:ring-primary"
            />
            <div className="flex justify-between items-center">
              {touched.title && formData.title.trim().length < 3 ? (
                <Hint>Title needs at least 3 characters</Hint>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {formData.title.length}/80
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              {isRentalListing ? 'Rent Price' : 'Price'}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-muted-foreground">
                <IndianRupee className="h-4 w-4" />
              </div>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                onBlur={() => touch('price')}
                placeholder={isRentalListing ? '100' : '0'}
                min={0}
                className="h-12 rounded-xl pl-8 text-sm"
              />
            </div>
            {touched.price && (!formData.price || parseFloat(formData.price) <= 0) && (
              <Hint>Enter a valid price</Hint>
            )}
            {!isRentalListing && (
              <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
                <Checkbox
                  id="negotiable"
                  checked={formData.is_negotiable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_negotiable: !!checked })
                  }
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Price is negotiable
                </span>
              </label>
            )}
          </div>

          {/* Rental Duration */}
          {isRentalListing && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Rental Period <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {rentalDurations.map((d) => (
                  <Chip
                    key={d.value}
                    selected={formData.rental_duration === d.value}
                    onClick={() =>
                      setFormData({ ...formData, rental_duration: d.value })
                    }
                    color="blue"
                  >
                    {d.emoji} {d.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Security Deposit */}
          {isRentalListing && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Security Deposit{' '}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.rental_deposit}
                  onChange={(e) =>
                    setFormData({ ...formData, rental_deposit: e.target.value })
                  }
                  placeholder="0"
                  min={0}
                  className="h-12 rounded-xl pl-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Condition */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Condition <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <Chip
                  key={c.value}
                  selected={formData.condition === c.value}
                  onClick={() =>
                    setFormData({ ...formData, condition: c.value })
                  }
                >
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
            {touched.condition && !formData.condition && (
              <Hint>Please select a condition</Hint>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Category{' '}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {(showAllCategories ? categories : categories.slice(0, 8)).map(
                (cat) => (
                  <Chip
                    key={cat.id}
                    selected={formData.category_id === cat.id}
                    onClick={() =>
                      setFormData({ ...formData, category_id: cat.id })
                    }
                  >
                    {cat.icon} {cat.name}
                  </Chip>
                )
              )}
              {categories.length > 8 && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-primary underline-offset-2 hover:underline transition-colors"
                >
                  {showAllCategories
                    ? 'Show less'
                    : `+${categories.length - 8} more`}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              onBlur={() => touch('description')}
              placeholder={
                isRentalListing
                  ? 'Describe what you\'re renting — condition, availability, rules...'
                  : 'What\'s the item? Any defects? Why are you selling it?'
              }
              maxLength={500}
              className="min-h-[110px] rounded-xl text-sm resize-none leading-relaxed"
            />
            <div className="flex justify-between items-start">
              {touched.description &&
              formData.description.trim().length < 10 ? (
                <Hint>Add at least 10 characters</Hint>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {formData.description.length}/500
              </span>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              WhatsApp{' '}
              <span className="text-muted-foreground font-normal text-xs">
                (optional — for faster replies)
              </span>
            </Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              <Input
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsapp_number: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="91XXXXXXXXXX"
                maxLength={15}
                className="h-12 rounded-xl pl-9 text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground pl-0.5">
              Buyers can reach you directly on WhatsApp 💬
            </p>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Location{' '}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Hostel A, Ground Floor"
                className="h-12 rounded-xl pl-9 text-sm"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl font-semibold gap-2 transition-all active:scale-[0.98]"
            disabled={!canProceedToPackage}
            onClick={() => {
              setTouched({ title: true, description: true, price: true, condition: true });
              if (canProceedToPackage) setStep('package');
            }}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!canProceedToPackage && (
            <p className="text-center text-xs text-muted-foreground -mt-2">
              Fill in all required fields to continue
            </p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          Step 4 — Package
      ══════════════════════════════════════ */}
      {step === 'package' && (
        <div className="p-5 max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <StepProgress currentStep="package" />

          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold">Boost your listing</h2>
            <p className="text-xs text-muted-foreground">
              More visibility = faster sale. You have{' '}
              <strong className="text-yellow-600">{userPoints} pts</strong>
            </p>
          </div>

          <div className="space-y-3">
            {adPackages.map((pkg) => {
              const isSelected = formData.ad_type === pkg.ad_type;
              const canAfford = userPoints >= pkg.points_cost;
              const config = packageConfig[pkg.ad_type];

              return (
                <button
                  key={pkg.id}
                  onClick={() => {
                    if (canAfford)
                      setFormData({ ...formData, ad_type: pkg.ad_type });
                  }}
                  disabled={!canAfford}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-200 border-2 active:scale-[0.99] ${
                    isSelected
                      ? `${config.bg} ${config.border}`
                      : canAfford
                      ? 'bg-muted/40 border-transparent hover:border-border hover:bg-muted/60'
                      : 'bg-muted/20 border-transparent opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {pkg.name}
                        </span>
                        {pkg.ad_type !== 'basic' && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${config.badge}`}
                          >
                            {pkg.ad_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {config.perks}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`font-bold text-sm ${
                          canAfford ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {pkg.points_cost === 0 ? 'Free' : `${pkg.points_cost} pts`}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pkg.duration_days}d listing
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full h-12 rounded-xl font-semibold gap-2 transition-all active:scale-[0.98]"
            onClick={() => setStep('review')}
          >
            Review listing
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════
          Step 5 — Review
      ══════════════════════════════════════ */}
      {step === 'review' && (
        <div className="p-5 max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <StepProgress currentStep="review" />

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Looks good?</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Double-check before publishing
            </p>
          </div>

          {/* Preview card */}
          <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
            {/* Photo strip */}
            {previewUrls.length > 0 && (
              <div className="relative">
                <img
                  src={previewUrls[0]}
                  alt=""
                  className="w-full h-52 object-cover"
                />
                {previewUrls.length > 1 && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {previewUrls.slice(0, 5).map((url, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 ${
                          i === 0
                            ? 'border-white opacity-0 pointer-events-none'
                            : 'border-white/80'
                        }`}
                      >
                        {i > 0 && (
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md">
                  {imageCount} photo{imageCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {formData.title}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-primary">
                    ₹{parseInt(formData.price || '0').toLocaleString()}
                  </span>
                  {isRentalListing && formData.rental_duration && (
                    <span className="text-xs text-muted-foreground">
                      /{formData.rental_duration.replace('per_', '')}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {formData.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {conditions.find((c) => c.value === formData.condition)
                    ?.emoji}{' '}
                  {conditions.find((c) => c.value === formData.condition)
                    ?.label}
                </Badge>
                {formData.is_negotiable && !isRentalListing && (
                  <Badge variant="outline" className="text-xs">
                    Negotiable
                  </Badge>
                )}
                {formData.location && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    {formData.location}
                  </Badge>
                )}
                {formData.whatsapp_number && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1 border-green-400 text-green-600 bg-green-50 dark:bg-green-500/10"
                  >
                    <MessageCircle className="h-2.5 w-2.5" />
                    WhatsApp
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Package summary */}
          {selectedPackage && (
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Package Summary
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Plan', value: selectedPackage.name },
                  {
                    label: 'Duration',
                    value: `${selectedPackage.duration_days} days`,
                  },
                  {
                    label: 'Cost',
                    value:
                      selectedPackage.points_cost === 0
                        ? 'Free'
                        : `${selectedPackage.points_cost} pts`,
                    highlight: true,
                  },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span
                      className={
                        highlight ? 'font-bold text-primary' : 'font-medium'
                      }
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance after</span>
                  <span
                    className={`font-semibold ${
                      userPoints >= selectedPackage.points_cost
                        ? 'text-green-600'
                        : 'text-destructive'
                    }`}
                  >
                    {userPoints - selectedPackage.points_cost} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient points warning */}
          {selectedPackage && userPoints < selectedPackage.points_cost && (
            <div className="flex items-start gap-2.5 bg-destructive/5 border border-destructive/20 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">
                You need{' '}
                <strong>
                  {selectedPackage.points_cost - userPoints} more pts
                </strong>{' '}
                for this plan. Go back and choose a lower tier.
              </p>
            </div>
          )}

          <Button
            className="w-full h-12 rounded-xl font-semibold gap-2 transition-all active:scale-[0.98]"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                Publish Listing
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground pb-2">
            By publishing you agree to our community guidelines
          </p>
        </div>
      )}
    </PWAPageWrapper>
  );
};

export default PWASellItem;
