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
  Image as ImageIcon
} from 'lucide-react';

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

const PWASellItem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Steps: 'type' -> 'photos' -> 'details' -> 'package' -> 'review'
  const [step, setStep] = useState<'type' | 'photos' | 'details' | 'package' | 'review'>('type');
  const [listingType, setListingType] = useState<ListingType | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [adPackages, setAdPackages] = useState<AdPackage[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Use deferred image upload hook - images are stored locally until submission
  const {
    localImages,
    previewUrls,
    uploading,
    addImages,
    removeLocalImage,
    uploadAllImages,
    clearAllImages,
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
    ad_type: 'basic' as AdPackage['ad_type'],
    is_negotiable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [categoriesRes, packagesRes, pointsRes] = await Promise.all([
      supabase.from('categories').select('id, name, icon').order('name'),
      supabase.from('ad_packages').select('*').order('points_cost'),
      user ? supabase.from('profiles').select('campus_points').eq('user_id', user.id).single() : null,
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (packagesRes.data) {
      setAdPackages(packagesRes.data as AdPackage[]);
      const basic = (packagesRes.data as AdPackage[]).find(p => p.ad_type === 'basic');
      if (basic) setFormData(prev => ({ ...prev, ad_type: basic.ad_type }));
    }
    if (pointsRes?.data) setUserPoints(pointsRes.data.campus_points || 0);
  };

  const selectedPackage = useMemo(() => {
    return adPackages.find(pkg => pkg.ad_type === formData.ad_type) || null;
  }, [adPackages, formData.ad_type]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addImages(files);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!user || !selectedPackage) return;

    const cost = selectedPackage.points_cost;
    if (userPoints < cost) {
      toast({ title: 'Insufficient points', description: `Need ${cost} points`, variant: 'destructive' });
      return;
    }

    if (imageCount === 0) {
      toast({ title: 'No images', description: 'Please add at least one image', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Upload images to Cloudinary only now (on confirmation)
    const uploadedUrls = await uploadAllImages();
    if (!uploadedUrls) {
      setLoading(false);
      return;
    }

    // Deduct points
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({ campus_points: userPoints - cost })
      .eq('user_id', user.id);

    if (pointsError) {
      toast({ title: 'Error', description: 'Failed to process transaction', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Create listing with uploaded image URLs
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
      expires_at: new Date(Date.now() + selectedPackage.duration_days * 24 * 60 * 60 * 1000).toISOString(),
      is_negotiable: formData.is_negotiable,
      ad_priority: AD_PRIORITY_MAP[selectedPackage.ad_type],
    });

    if (insertError) {
      // Rollback points
      await supabase.from('profiles').update({ campus_points: userPoints }).eq('user_id', user.id);
      toast({ title: 'Error', description: 'Failed to create listing', variant: 'destructive' });
      setLoading(false);
      return;
    }

    toast({ title: 'Success!', description: 'Your item is now listed' });
    navigate('/');
    setLoading(false);
  };

  const handleTypeSelect = (type: ListingType) => {
    setListingType(type);
    if (type === 'sell') {
      setStep('photos');
    }
  };

  const conditions = [
    { value: 'new', label: 'Brand New', emoji: '✨' },
    { value: 'like-new', label: 'Like New', emoji: '🌟' },
    { value: 'good', label: 'Good', emoji: '👍' },
    { value: 'fair', label: 'Fair', emoji: '👌' },
    { value: 'poor', label: 'Poor', emoji: '⚠️' },
  ];

  const canProceedToDetails = imageCount > 0;
  const canProceedToPackage = formData.title && formData.description && formData.price && formData.condition;
  const canSubmit = canProceedToPackage && selectedPackage && userPoints >= (selectedPackage?.points_cost || 0) && imageCount > 0;

  // Show PG form if PG type selected
  if (listingType === 'pg') {
    return (
      <PWAPageWrapper title="List PG/Room" showBack onBack={() => setListingType(null)}>
        <PGListingForm onBack={() => setListingType(null)} />
      </PWAPageWrapper>
    );
  }

  return (
    <PWAPageWrapper 
      title={step === 'type' ? 'Create Listing' : step === 'photos' ? 'Add Photos' : step === 'details' ? 'Item Details' : step === 'package' ? 'Choose Package' : 'Review'} 
      showBack 
      onBack={() => {
        if (step === 'type') navigate(-1);
        else if (step === 'photos') { setListingType(null); setStep('type'); }
        else if (step === 'details') setStep('photos');
        else if (step === 'package') setStep('details');
        else if (step === 'review') setStep('package');
      }}
      rightAction={
        <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
          <Coins className="h-3 w-3 text-yellow-500" />
          <span className="text-xs font-semibold">{userPoints}</span>
        </Badge>
      }
    >
      {/* Step 1: Type Selection */}
      {step === 'type' && !listingType && (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
          <p className="text-muted-foreground text-sm md:text-base mb-6 text-center">
            What would you like to list today?
          </p>
          <ListingTypeSelector onSelect={handleTypeSelect} />
        </div>
      )}

      {/* Step 2: Photos */}
      {step === 'photos' && (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
          {/* Progress */}
          <div className="flex gap-1">
            {['photos', 'details', 'package', 'review'].map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold">Add up to 5 photos</h2>
            <p className="text-sm md:text-base text-muted-foreground">First photo will be the cover image</p>
          </div>

          {/* Image Grid - now using local preview URLs */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
            {localImages.map((img, index) => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 py-0.5 rounded">
                    Cover
                  </div>
                )}
                <button
                  onClick={() => removeLocalImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 md:w-8 md:h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </button>
              </div>
            ))}

            {canAddMore && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer active:bg-muted/50 hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground mb-1" />
                    <span className="text-xs md:text-sm text-muted-foreground">Add Photo</span>
                  </>
                )}
              </label>
            )}
          </div>

          {imageCount === 0 && (
            <p className="text-center text-sm text-destructive">Add at least 1 photo to continue</p>
          )}

          <Button
            className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg font-semibold"
            disabled={!canProceedToDetails}
            onClick={() => setStep('details')}
          >
            Continue
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 'details' && (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          {/* Progress */}
          <div className="flex gap-1">
            {['photos', 'details', 'package', 'review'].map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${i <= 1 ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What are you selling?"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium">Price (₹) *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="negotiable"
                checked={formData.is_negotiable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_negotiable: !!checked })}
              />
              <Label htmlFor="negotiable" className="text-sm md:text-base text-muted-foreground">
                Price is negotiable
              </Label>
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium">Condition *</Label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFormData({ ...formData, condition: c.value })}
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium transition-all hover:opacity-90 ${
                    formData.condition === c.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium">Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category_id: cat.id })}
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium transition-all hover:opacity-90 ${
                    formData.category_id === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium">Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your item..."
              className="min-h-[100px] md:min-h-[120px] rounded-xl text-base md:text-lg resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Hostel A"
                className="h-12 md:h-14 rounded-xl text-base md:text-lg pl-10"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg font-semibold"
            disabled={!canProceedToPackage}
            onClick={() => setStep('package')}
          >
            Continue
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 4: Package Selection */}
      {step === 'package' && (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          {/* Progress */}
          <div className="flex gap-1">
            {['photos', 'details', 'package', 'review'].map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold">Choose a package</h2>
            <p className="text-sm md:text-base text-muted-foreground">Boost your listing visibility</p>
          </div>

          <div className="space-y-3 md:space-y-4">
            {adPackages.map((pkg) => {
              const isSelected = formData.ad_type === pkg.ad_type;
              const canAfford = userPoints >= pkg.points_cost;

              return (
                <button
                  key={pkg.id}
                  onClick={() => setFormData({ ...formData, ad_type: pkg.ad_type })}
                  disabled={!canAfford}
                  className={`w-full p-4 md:p-5 rounded-2xl text-left transition-all hover:shadow-md ${
                    isSelected
                      ? 'bg-primary/10 border-2 border-primary'
                      : canAfford
                      ? 'bg-muted/50 border-2 border-transparent'
                      : 'bg-muted/30 border-2 border-transparent opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                        pkg.ad_type === 'featured' ? 'bg-yellow-500/20' :
                        pkg.ad_type === 'premium' ? 'bg-purple-500/20' :
                        pkg.ad_type === 'urgent' ? 'bg-red-500/20' :
                        'bg-muted'
                      }`}>
                        {pkg.ad_type === 'featured' && <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />}
                        {pkg.ad_type === 'premium' && <Crown className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />}
                        {pkg.ad_type === 'urgent' && <Zap className="h-5 w-5 md:h-6 md:w-6 text-red-500" />}
                        {pkg.ad_type === 'basic' && <Tag className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />}
                      </div>
                      <div>
                        <h3 className="font-semibold md:text-lg">{pkg.name}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{pkg.duration_days} days listing</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className={`font-bold md:text-lg ${canAfford ? 'text-primary' : 'text-muted-foreground'}`}>
                        {pkg.points_cost} pts
                      </span>
                      {isSelected && (
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg font-semibold"
            onClick={() => setStep('review')}
          >
            Review Listing
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 'review' && (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          {/* Progress */}
          <div className="flex gap-1">
            {['photos', 'details', 'package', 'review'].map((s, i) => (
              <div key={s} className="h-1 flex-1 rounded-full bg-primary" />
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold">Review your listing</h2>
          </div>

          {/* Preview Card */}
          <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
            {previewUrls[0] && (
              <img src={previewUrls[0]} alt="" className="w-full h-48 md:h-64 object-cover" />
            )}
            <div className="p-4 md:p-5 space-y-2">
              <h3 className="font-semibold text-lg md:text-xl">{formData.title}</h3>
              <p className="text-xl md:text-2xl font-bold text-primary">₹{parseInt(formData.price).toLocaleString()}</p>
              <p className="text-sm md:text-base text-muted-foreground line-clamp-2">{formData.description}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="md:text-sm">{formData.condition}</Badge>
                {formData.is_negotiable && <Badge variant="outline" className="md:text-sm">Negotiable</Badge>}
                {formData.location && (
                  <Badge variant="outline" className="flex items-center gap-1 md:text-sm">
                    <MapPin className="h-3 w-3" /> {formData.location}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Package Summary */}
          {selectedPackage && (
            <div className="bg-muted/50 rounded-xl p-4 md:p-5 space-y-2 md:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground md:text-lg">Package:</span>
                <span className="font-semibold md:text-lg">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground md:text-lg">Duration:</span>
                <span className="md:text-lg">{selectedPackage.duration_days} days</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="font-semibold md:text-lg">Total Cost:</span>
                <span className="font-bold text-primary md:text-lg">{selectedPackage.points_cost} points</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground md:text-lg">Your Balance:</span>
                <span className={`md:text-lg ${userPoints >= selectedPackage.points_cost ? 'text-green-600' : 'text-destructive'}`}>
                  {userPoints} points
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg font-semibold"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                Publish Listing
                <Check className="h-5 w-5 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </PWAPageWrapper>
  );
};

export default PWASellItem;
