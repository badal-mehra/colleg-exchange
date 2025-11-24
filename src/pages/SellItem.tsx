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

// --- Interface Definitions (Simplified to remove dead AdPackage) ---
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

// ✅ Cloudinary Upload Function with Hard Failure Catch
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  // ⚠️ ASSUMPTION: Preset name is 'mycampuskart'
  formData.append("upload_preset", "mycampuskart");

  // ⚠️ ASSUMPTION: Cloud name is 'dj6q4dvre'
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dj6q4dvre/image/upload"; 
  
  const res = await fetch(
    CLOUDINARY_URL,
    { method: "POST", body: formData }
  );

  const data = await res.json();
  console.log("UPLOAD RESULT:", data);

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Cloudinary upload failed: secure_url not returned. Check console log for details.");
  }

  return data.secure_url; // CDN URL
};
// --- END Cloudinary Upload Function ---

// --- New Component: Listing Summary (Simplified) ---
interface ListingSummaryProps {
  userPoints: number;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isFormValid: boolean;
}

// SUMMARY: Forced Basic Listing (Cost 0)
const ListingSummary: React.FC<ListingSummaryProps> = ({ userPoints, isLoading, onSubmit, isFormValid }) => {
  const cost = 0; // Cost is always 0 because Ad Packages are removed/disabled

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
            <Tag className="h-4 w-4 text-gray-500" /> Basic (Free)
          </span>
        </div>
        <div className="flex justify-between items-center border-b pb-2">
          <span className="text-muted-foreground">Cost:</span>
          <span className="font-bold text-green-600 flex items-center gap-1">
            0 Points
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Your Balance:</span>
          <span className="font-bold text-lg">{userPoints} Points</span>
        </div>
        
        <div className={`text-sm p-3 rounded-lg bg-green-50 text-green-700`}>
          Remaining Balance: {userPoints} Points
        </div>
        

        <Button 
          type="submit" 
          onClick={onSubmit}
          className="w-full text-lg h-12" 
          disabled={isLoading || !isFormValid} // No more affordability check (cost is 0)
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
  // ❌ adPackages state removed
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
    ad_type: 'basic', // Forced basic listing
    is_negotiable: true,
    auto_repost: false, // Auto-repost logic removed/disabled
    tag_input: ''
  });

  // --- Data Fetching (Simplified) ---
  useEffect(() => {
    fetchCategories();
    // ❌ fetchAdPackages removed
    fetchUserPoints();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
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
      if (newImageUrls.length >= 5 - images.length) break;

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image Too Large",
          description: `"${file.name}" exceeds the 5MB limit and was skipped.`,
          variant: "destructive",
        });
        continue;
      }
      
      try {
        let url = await uploadToCloudinary(file);
        
        const optimizedUrl = url.replace(
          "/upload/",
          "/upload/f_auto,q_auto,w_800/"
        );
        
        newImageUrls.push(optimizedUrl);
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
      }
    }
    
    // ✅ FIX 2: Correctly log the state AFTER it has been updated
    setImages(prev => {
      const updated = [...prev, ...newImageUrls];
      console.log("FINAL images[] state:", updated);
      return updated;
    });

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

  // ❌ selectedPackage logic removed

  // ✅ FIX 2: Correct image check for isFormValid
  const isFormValid = useMemo(() => {
    return (
      formData.title.trim().length > 0 &&
      formData.description.trim().length > 0 &&
      parseFloat(formData.price) > 0 &&
      formData.condition.length > 0 &&
      images.length > 0 // Required image validation re-added
    );
  }, [formData, images]);
  

  // --- Submission Logic (Simplified) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isFormValid) {
        let description = "Please fill in all required fields (Title, Description, Price, Condition).";
        if (images.length === 0) {
            description = "Please upload at least one image for your listing.";
        }
        return toast({ title: "Error", description: description, variant: "destructive" });
    }
    
    // Cost is always 0, so no need to check balance or deduct points
    const cost = 0;
    setLoading(true);
    let uploadedImageUrls: string[] = images; 
    
    // ❌ Points deduction/rollback logic removed (since cost is 0)

    // 3. Create Item
    const durationDays = 30; // Default to 30 days
    const { error: insertError } = await supabase
      .from('items')
      .insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        condition: formData.condition,
        category_id: formData.category_id || null,
        location: formData.location.trim() || null,
        images: uploadedImageUrls,
        seller_id: user.id,
        ad_type: formData.ad_type, // "basic"
        ad_duration_days: durationDays,
        expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        is_negotiable: formData.is_negotiable,
        auto_repost: formData.auto_repost,
        tags: tags
      });

    if (insertError) {
      // No rollback needed as no points were deducted
      toast({ title: "Error", description: "Failed to list item. Please check item fields.", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({
      title: "Success",
      description: "Item listed!",
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
                                loading="lazy"
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

              {/* ❌ SECTION 3: Ad Package removed as the table does not exist. Feature is now hardcoded to Basic/Free. */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">3. Promotion (Basic Listing)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Your listing will be **Basic** (free, 30 days duration).</p>
                  <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-gray-500" />
                            <h4 className="font-bold text-lg">Basic Listing</h4>
                          </div>
                          <div className={`text-lg font-extrabold text-green-600`}>
                            Free
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">30 days duration</span>
                        </div>
                  </div>
                  
                  {/* Auto-repost option */}
                  <div className="flex items-center space-x-2 pt-4 border-t mt-4">
                      <Checkbox 
                        id="auto_repost" 
                        checked={formData.auto_repost} 
                        onCheckedChange={(checked) => setFormData({ ...formData, auto_repost: !!checked })} 
                      />
                      <Label htmlFor="auto_repost">
                        Auto-repost after expiration (Manual update required now, logic disabled)
                      </Label>
                    </div>
                </CardContent>
              </Card>


              {/* Mobile Submission Button (Hidden on Desktop) */}
              <div className="lg:hidden mt-8">
                <ListingSummary
                  userPoints={userPoints}
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
