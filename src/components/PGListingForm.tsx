import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, X, Image as ImageIcon, Loader2, Home, Users, MapPin, 
  Wifi, BedDouble, Armchair, Droplets, Car, Zap, Clock, Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AMENITIES_LIST = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'bed', label: 'Bed', icon: BedDouble },
  { id: 'mattress', label: 'Mattress', icon: BedDouble },
  { id: 'study_table', label: 'Study Table', icon: Armchair },
  { id: 'almirah', label: 'Almirah', icon: Armchair },
  { id: 'geyser', label: 'Geyser', icon: Droplets },
  { id: 'washing_machine', label: 'Washing Machine', icon: Droplets },
  { id: 'power_backup', label: 'Power Backup', icon: Zap },
  { id: 'parking', label: 'Parking', icon: Car },
];

const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "mycampuskart");
  
  const res = await fetch("https://api.cloudinary.com/v1_1/dj6q4dvre/image/upload", {
    method: "POST",
    body: formData
  });
  
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.secure_url;
};

interface PGListingFormProps {
  onBack: () => void;
}

const PGListingForm: React.FC<PGListingFormProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    // Basic Details
    property_type: '' as 'pg' | 'room' | 'hostel' | 'flat' | '',
    for_gender: '' as 'boys' | 'girls' | 'both' | '',
    sharing_type: '' as 'single' | 'double' | 'triple' | 'any' | '',
    rent_per_month: '',
    security_deposit: '',
    electricity_included: false,
    food_included: false,
    
    // Location
    area_locality: '',
    distance_from_campus: '',
    landmark: '',
    
    // Rules
    gate_timing: '',
    smoking_allowed: false,
    alcohol_allowed: false,
    visitors_allowed: true,
    
    // Contact
    contact_method: 'chat' as 'chat' | 'call' | 'whatsapp',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    const newImageUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (newImageUrls.length >= 8 - images.length) break;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image Too Large", description: `"${file.name}" exceeds 5MB limit.`, variant: "destructive" });
        continue;
      }
      
      try {
        let url = await uploadToCloudinary(file);
        const optimizedUrl = url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
        newImageUrls.push(optimizedUrl);
      } catch (error: any) {
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
      }
    }
    
    setImages(prev => [...prev, ...newImageUrls]);
    setLoading(false);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(a => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  const isFormValid = 
    formData.property_type &&
    formData.for_gender &&
    formData.sharing_type &&
    parseInt(formData.rent_per_month) > 0 &&
    formData.area_locality.trim().length > 0 &&
    images.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('pg_listings').insert({
        seller_id: user.id,
        property_type: formData.property_type,
        for_gender: formData.for_gender,
        sharing_type: formData.sharing_type,
        rent_per_month: parseInt(formData.rent_per_month),
        security_deposit: parseInt(formData.security_deposit) || 0,
        electricity_included: formData.electricity_included,
        food_included: formData.food_included,
        area_locality: formData.area_locality.trim(),
        distance_from_campus: formData.distance_from_campus.trim() || null,
        landmark: formData.landmark.trim() || null,
        amenities: selectedAmenities,
        gate_timing: formData.gate_timing.trim() || null,
        smoking_allowed: formData.smoking_allowed,
        alcohol_allowed: formData.alcohol_allowed,
        visitors_allowed: formData.visitors_allowed,
        images: images,
        contact_method: formData.contact_method,
      });

      if (error) throw error;

      toast({ title: "Success!", description: "Your PG/Room listing has been created." });
      navigate('/');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast({ title: "Error", description: error.message || "Failed to create listing.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Basic Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select 
                value={formData.property_type} 
                onValueChange={(v) => setFormData({ ...formData, property_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pg">PG</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>For *</Label>
              <Select 
                value={formData.for_gender} 
                onValueChange={(v) => setFormData({ ...formData, for_gender: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sharing Type *</Label>
              <Select 
                value={formData.sharing_type} 
                onValueChange={(v) => setFormData({ ...formData, sharing_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sharing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="triple">Triple</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rent per Month (₹) *</Label>
              <Input
                type="number"
                min="1"
                value={formData.rent_per_month}
                onChange={(e) => setFormData({ ...formData, rent_per_month: e.target.value })}
                placeholder="e.g., 5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Security Deposit (₹)</Label>
              <Input
                type="number"
                min="0"
                value={formData.security_deposit}
                onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                placeholder="e.g., 10000"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.electricity_included}
                onCheckedChange={(c) => setFormData({ ...formData, electricity_included: c })}
              />
              <Label>Electricity Included</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.food_included}
                onCheckedChange={(c) => setFormData({ ...formData, food_included: c })}
              />
              <Label>Food Included</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Area / Locality *</Label>
            <Input
              value={formData.area_locality}
              onChange={(e) => setFormData({ ...formData, area_locality: e.target.value })}
              placeholder="e.g., Sector 62, Noida"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Distance from Campus</Label>
              <Input
                value={formData.distance_from_campus}
                onChange={(e) => setFormData({ ...formData, distance_from_campus: e.target.value })}
                placeholder="e.g., 2 km or 10 mins walk"
              />
            </div>
            <div className="space-y-2">
              <Label>Landmark (Optional)</Label>
              <Input
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="e.g., Near Main Gate"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Amenities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {AMENITIES_LIST.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = selectedAmenities.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm ${
                    isSelected 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {amenity.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Gate Timing</Label>
            <Input
              value={formData.gate_timing}
              onChange={(e) => setFormData({ ...formData, gate_timing: e.target.value })}
              placeholder="e.g., 10:00 PM or No Restriction"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.smoking_allowed}
                onCheckedChange={(c) => setFormData({ ...formData, smoking_allowed: c })}
              />
              <Label>Smoking Allowed</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.alcohol_allowed}
                onCheckedChange={(c) => setFormData({ ...formData, alcohol_allowed: c })}
              />
              <Label>Alcohol Allowed</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.visitors_allowed}
                onCheckedChange={(c) => setFormData({ ...formData, visitors_allowed: c })}
              />
              <Label>Visitors Allowed</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Room Photos *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={image}
                    alt={`Room ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
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
          {images.length < 8 && (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="pg-image-upload"
                disabled={images.length >= 8 || loading}
              />
              <label htmlFor="pg-image-upload" className="cursor-pointer block">
                {loading ? (
                  <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-primary">
                  {loading ? 'Uploading...' : 'Click to upload room photos'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({8 - images.length} remaining, max 5MB/image)
                </p>
              </label>
            </div>
          )}
          {images.length === 0 && (
            <p className="text-destructive text-xs">At least one photo is required.</p>
          )}
        </CardContent>
      </Card>

      {/* Contact Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Contact Preference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(['chat', 'call', 'whatsapp'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFormData({ ...formData, contact_method: method })}
                className={`px-4 py-2 rounded-lg border capitalize transition-all ${
                  formData.contact_method === method
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                {method === 'whatsapp' ? 'WhatsApp' : method}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" disabled={loading || !isFormValid} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Create Listing
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default PGListingForm;
