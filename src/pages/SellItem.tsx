import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, X, Image as ImageIcon, Star, Zap, Clock, Tag, Crown, Coins, DollarSign, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// --- Interface Definitions (Kept from original) ---
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface AdPackage {
  id: string;
  name: string;
  ad_type: string;
  duration_days: number;
  points_cost: number;
  features: any;
}

// ✅ Cloudinary Upload Function
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "mycampuskart");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dj6q4dvre/image/upload",
    { method: "POST", body: formData }
  );

  const data = await res.json();
  return data.secure_url; // CDN URL
};
// --- END Cloudinary Upload Function ---

// --- Helper Functions (Kept from original) ---
const getAdTypeIcon = (adType: string) => {
  switch (adType) {
    case 'featured': return <Star className="h-4 w-4 text-yellow-500" />;
    case 'premium': return <Crown className="h-4 w-4 text-purple-600" />;
    case 'urgent': return <Zap className="h-4 w-4 text-red-500" />;
    default: return <Tag className="h-4 w-4 text-gray-500" />;
  }
};

// --- New Component: Listing Summary (Kept from original) ---
interface ListingSummaryProps {
  userPoints: number;
  selectedPackage: AdPackage | undefined;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isFormValid: boolean;
}

const ListingSummary: React.FC<ListingSummaryProps> = ({ userPoints, selectedPackage, isLoading, onSubmit, isFormValid }) => {
  const cost = selectedPackage?.points_cost || 0;
  const isAffordable = userPoints >= cost;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Listing Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-muted-foreground">Ad Package:</span>
          <span className="font-semibold flex items-center gap-1">
            {selectedPackage ? (
              <>
                {getAdTypeIcon(selectedPackage.ad_type)} {selectedPackage.name}
              </>
            ) : (
              'Basic'
            )}
          </span>
        </div>
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-muted-foreground">Cost:</span>
          <span className="font-bold text-primary flex items-center gap-1">
            <Coins className="h-4 w-4" /> {cost} Points
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Your Balance:</span>
          <span className="font-bold text-lg">{userPoints} Points</span>
        </div>
        
        {cost > 0 && (
          <div className={`text-sm p-3 rounded-lg ${isAffordable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isAffordable
              ? `Remaining Balance: ${userPoints - cost} Points`
              : `You need ${cost - userPoints} more points to proceed.`
            }
          </div>
        )}

        <Button 
          type="submit" 
          onClick={onSubmit}
          className="w-full text-lg h-12" 
          disabled={isLoading || !isAffordable || !isFormValid}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Upload className="h-5 w-5 mr-2" />
          )}
          {isLoading ? 'Listing Item...' : 'Finalize & List Item'}
        </Button>
      </CardContent>
    </Card>
  );
};

// --- Main Component: SellItem ---
const SellItem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [adPackages, setAdPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category_id: '',
    location: '',
    ad_type: 'basic',
    is_negotiable: true,
    auto_repost: false,
    tag_input: ''
  });

  // --- Data Fetching (Kept original logic) ---
  useEffect(() => {
    fetchCategories();
    fetchAdPackages();
    fetchUserPoints();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  const fetchAdPackages = async () => {
    const { data } = await supabase.from('ad_packages').select('*').order('points_cost');
    setAdPackages(data || []);
  };

  const fetchUserPoints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('campus_points')
      .eq('user_id', user.id)
      .single();

    setUserPoints(data?.campus_points || 0);
  };

  // --- Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImageUrls: string[] = [];
    const filesToProcess = Array.from(files);

    setLoading(true);

    for (const file of filesToProcess) {
      // ✅ ✅ FIX 1: Correctly check for remaining image slots
      if (newImageUrls.length >= 5 - images.length) break;

      // ✅ ✅ FIX 2: Add File Size Guard (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image Too Large",
          description: `"${file.name}" exceeds the 5MB limit and was skipped.`,
          variant: "destructive",
        });
        continue; // Skip this file and proceed to the next one
      }
      
      try {
        let url = await uploadToCloudinary(file);
        
        // Optimization
        const optimizedUrl = url.replace(
          "/upload/",
          "/upload/f_auto,q_auto,w_800/"
        );
        
        newImageUrls.push(optimizedUrl);
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        toast({ title: "Upload Error", description: "Failed to upload image to Cloudinary.", variant: "destructive" });
        // Continue to the next file
      }
    }
    
    setImages(prev => [...prev, ...newImageUrls]);
    setLoading(false);
    e.target.value = ''; // Reset input
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = formData.tag_input.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags(prev => [...prev, trimmedTag]);
      setFormData({ ...formData, tag_input: '' });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const selectedPackage = useMemo(() => {
    return adPackages.find(pkg => pkg.ad_type === formData.ad_type);
  }, [adPackages, formData.ad_type]);

  const isFormValid = useMemo(() => {
    return (
      formData.title.trim().length > 0 &&
      formData.description.trim().length > 0 &&
      parseFloat(formData.price) > 0 &&
      formData.condition.length > 0
    );
  }, [formData]);
  

  // --- Submission Logic (Kept from original) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Basic Validation (now also checked by useMemo, but repeated for toast feedback)
    if (!isFormValid) {
      return toast({ title: "Error", description: "Please fill in all required fields (Title, Description, Price, Condition).", variant: "destructive" });
    }

    const cost = selectedPackage?.points_cost || 0;

    // Check Balance
    if (userPoints < cost) {
      toast({
        title: "Not Enough Points",
        description: `You need ${cost} points but only have ${userPoints}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // 1. Image URLs are already stored in the 'images' state from handleImageUpload.
    let uploadedImageUrls: string[] = images; 


    // 2. Deduct Points
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ campus_points: userPoints - cost })
      .eq('user_id', user.id);

    if (deductError) {
      toast({
        title: "Error",
        description: "Failed to deduct points. Item was not listed.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    setUserPoints(userPoints - cost); 

    // 3. Create Item
    const durationDays = selectedPackage?.duration_days || 30;

    const { error: insertError } = await supabase
      .from('items')
      .insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        condition: formData.condition,
        category_id: formData.category_id || null,
        location: formData.location.trim() || null,
        images: uploadedImageUrls, // Use uploaded Cloudinary URLs
        seller_id: user.id,
        ad_type: formData.ad_type,
        ad_duration_days: durationDays,
        expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        is_negotiable: formData.is_negotiable,
        auto_repost: formData.auto_repost,
        tags: tags
      });

    if (insertError) {
      // Rollback logic (Crucial step for transactional integrity)
      const { error: refundError } = await supabase
        .from('profiles')
        .update({ campus_points: userPoints }) // Refund the cost
        .eq('user_id', user.id);

      if (refundError) {
        toast({ title: "Critical Error", description: "Item list failed AND refund failed. Contact support.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to list item. Points have been refunded.", variant: "destructive" });
        setUserPoints(userPoints); // Update local state for refund
      }
      
      setLoading(false);
      return;
    }

    toast({
      title: "Success",
      description: "Item listed & points deducted!",
    });

    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header and Points (Kept from original) */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-lg">
            <ArrowLeft className="h-5 w-5 mr-3" />
            Back to Dashboard
          </Button>
          <Badge variant="secondary" className="text-lg py-2 px-4 font-semibold shadow-md">
            <Coins className="h-4 w-4 mr-2 text-yellow-500" /> Your Points: {userPoints}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Create New Listing</h1>

        {/* Main Content Area: Two-Column Layout (Kept from original) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Listing Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* --- SECTION 1: Item Details (Kept from original) --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">1. Item Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Title & Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., iPhone 13 Pro Max (Midnight)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g., 50000"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Include details about condition, usage, and why you are selling."
                      rows={5}
                      required
                    />
                  </div>

                  {/* Condition & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Brand New</SelectItem>
                          <SelectItem value="like-new">Like New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location & Negotiable */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Campus Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Hostel A, Block 3"
                      />
                    </div>
                    <div className="flex items-end justify-start pb-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="negotiable" 
                          checked={formData.is_negotiable} 
                          onCheckedChange={(checked) => setFormData({ ...formData, is_negotiable: !!checked })} 
                        />
                        <Label htmlFor="negotiable">Price is Negotiable</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* --- SECTION 2: Media & Tags --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">2. Photos & Keywords</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Images */}
                  <div className="space-y-2">
                    <Label>Images (Max 5)</Label>
                    <div className="space-y-4">
                      {images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {images.map((image, index) => (
                            <div key={index} className="relative group aspect-square">
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border shadow-sm"
                                loading="lazy" {/* ✅ ✅ FIX 3: Added lazy loading */}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {images.length < 5 && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center transition-colors hover:border-primary/50">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                            disabled={images.length >= 5 || loading}
                          />
                          <label htmlFor="image-upload" className="cursor-pointer block">
                            {loading ? (
                                <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                            )}
                            
                            <p className="text-sm font-medium text-primary">
                              {loading ? 'Uploading...' : 'Click to upload high-quality images'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ({5 - images.length} remaining, max 5MB/image)
                            </p>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags (Kept from original) */}
                  <div className="space-y-2">
                    <Label>Tags / Keywords (Max 5)</Label>
                    <div className="flex gap-2 mb-2 flex-wrap min-h-[30px]">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="default" className="gap-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 transition-colors cursor-pointer">
                          {tag}
                          <X className="h-3 w-3 ml-1" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={formData.tag_input}
                        onChange={(e) => setFormData({ ...formData, tag_input: e.target.value })}
                        placeholder="e.g., laptop, gaming, cheap"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        disabled={tags.length >= 5}
                      />
                      <Button type="button" onClick={addTag} variant="secondary" disabled={tags.length >= 5}>
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* --- SECTION 3: Ad Package (Kept from original) --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">3. Promote Your Listing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Select an ad package to boost your visibility on the marketplace.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {adPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`p-4 border rounded-xl transition-all cursor-pointer shadow-sm 
                          ${formData.ad_type === pkg.ad_type 
                            ? 'ring-2 ring-primary border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                          }`}
                        onClick={() => setFormData({ ...formData, ad_type: pkg.ad_type })}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getAdTypeIcon(pkg.ad_type)}
                            <h4 className="font-bold text-lg">{pkg.name}</h4>
                          </div>
                          <div className={`text-lg font-extrabold ${pkg.points_cost > 0 ? 'text-primary' : 'text-green-600'}`}>
                            {pkg.points_cost > 0 ? `${pkg.points_cost} pts` : 'Free'}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{pkg.duration_days} days</span>
                          {/* Add a feature bullet point if available */}
                          {pkg.features?.highlight && <Badge variant="outline" className="text-xs">Highlighted</Badge>}
                          {pkg.features?.top_slot && <Badge variant="outline" className="text-xs">Top Slot</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Auto-repost option */}
                  <div className="flex items-center space-x-2 pt-4 border-t mt-4">
                      <Checkbox 
                        id="auto_repost" 
                        checked={formData.auto_repost} 
                        onCheckedChange={(checked) => setFormData({ ...formData, auto_repost: !!checked })} 
                      />
                      <Label htmlFor="auto_repost">
                        Auto-repost after expiration (deducts points again)
                      </Label>
                    </div>
                </CardContent>
              </Card>

              {/* Mobile Submission Button (Hidden on Desktop) */}
              <div className="lg:hidden mt-8">
                <ListingSummary
                  userPoints={userPoints}
                  selectedPackage={selectedPackage}
                  isLoading={loading}
                  onSubmit={handleSubmit}
                  isFormValid={isFormValid}
                />
              </div>

            </form>
          </div>

          {/* Column 2: Listing Summary (Floating on Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <ListingSummary
              userPoints={userPoints}
              selectedPackage={selectedPackage}
              isLoading={loading}
              onSubmit={handleSubmit}
              isFormValid={isFormValid}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellItem;
