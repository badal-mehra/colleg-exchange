import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Upload, X, Image as ImageIcon, Star, Zap, Clock, Tag, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && images.length < 5) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (formData.tag_input.trim() && !tags.includes(formData.tag_input.trim()) && tags.length < 5) {
      setTags(prev => [...prev, formData.tag_input.trim()]);
      setFormData({ ...formData, tag_input: '' });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const getSelectedAdPackage = () => {
    return adPackages.find(pkg => pkg.ad_type === formData.ad_type);
  };

  const getAdTypeIcon = (adType: string) => {
    switch (adType) {
      case 'featured': return <Star className="h-4 w-4" />;
      case 'premium': return <Crown className="h-4 w-4" />;
      case 'urgent': return <Zap className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // ✅ BASIC VALIDATION
    if (!formData.title.trim()) return toast({ title: "Error", description: "Enter a title", variant: "destructive" });
    if (!formData.description.trim()) return toast({ title: "Error", description: "Enter a description", variant: "destructive" });
    if (!formData.price || parseFloat(formData.price) <= 0) return toast({ title: "Error", description: "Enter a valid price", variant: "destructive" });
    if (!formData.condition) return toast({ title: "Error", description: "Select condition", variant: "destructive" });

    const selectedPackage = getSelectedAdPackage();
    const cost = selectedPackage?.points_cost || 0;

    // ✅ CHECK BALANCE
    if (userPoints < cost) {
      toast({
        title: "Not Enough Points",
        description: `You need ${cost} points but only have ${userPoints}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // ✅ DEDUCT POINTS FIRST
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ campus_points: userPoints - cost })
      .eq('user_id', user.id);

    if (deductError) {
      toast({
        title: "Error",
        description: "Failed to deduct points",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // ✅ THEN CREATE ITEM
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
        images: images,
        seller_id: user.id,
        ad_type: formData.ad_type,
        ad_duration_days: durationDays,
        expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        is_negotiable: formData.is_negotiable,
        auto_repost: formData.auto_repost,
        tags: tags
      });

    if (insertError) {
      toast({ title: "Error", description: "Failed to list item", variant: "destructive" });
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* ✅ POINTS DISPLAY */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant="default">Your Points: {userPoints}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sell Your Item</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ✅ Everything below is unchanged UI */}

              {/* Images */}
              <div className="space-y-2">
                <Label>Images (Up to 5)</Label>
                <div className="space-y-4">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length < 5 && (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload images ({5 - images.length} remaining)
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., iPhone 13 Pro Max"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item..."
                  rows={4}
                  required
                />
              </div>

              {/* Price & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>
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
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Hostel A"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (Max 5)</Label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={formData.tag_input}
                    onChange={(e) => setFormData({ ...formData, tag_input: e.target.value })}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline" disabled={tags.length >= 5}>
                    Add
                  </Button>
                </div>
              </div>

              {/* ✅ AD PACKAGES (POINTS) */}
              <div className="space-y-4">
                <Label>Choose Ad Package</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adPackages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`cursor-pointer transition-all ${
                        formData.ad_type === pkg.ad_type 
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setFormData({ ...formData, ad_type: pkg.ad_type })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getAdTypeIcon(pkg.ad_type)}
                            <h4 className="font-semibold">{pkg.name}</h4>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {pkg.points_cost} pts
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pkg.duration_days} days
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* ✅ Submit */}
              <Button type="submit" className="w-full" disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Listing...' : 'List Item'}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellItem;
