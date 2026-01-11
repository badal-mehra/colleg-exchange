import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PWAPageWrapper from '@/components/PWAPageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ImageCropModal from '@/components/ImageCropModal';
import { uploadToCloudinary } from '@/utils/cloudinaryUpload';
import { deleteFromCloudinary } from '@/utils/cloudinaryDelete';
import {
  Camera,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  Star,
  Trophy,
  Package,
  Target,
  Copy,
  User,
  Phone,
  GraduationCap,
  Building,
  Home,
  Calendar,
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  college_name: string;
  student_id: string;
  is_verified: boolean;
  verification_status: string;
  university: string;
  batch: string;
  course: string;
  hostel: string;
  campus_points: number;
  deals_completed: number;
  trust_seller_badge: boolean;
  mck_id: string;
  avatar_url: string | null;
  average_rating: number | null;
}

interface University {
  id: string;
  name: string;
}

const fetchUserRating = async (userId: string) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('to_user_id', userId);

  if (error || !data) return { avg: 0, count: 0 };

  const count = data.length;
  const avg = count === 0 ? 0 : data.reduce((sum, item) => sum + item.rating, 0) / count;
  return { avg: parseFloat(avg.toFixed(1)), count };
};

const PWAEditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [myRating, setMyRating] = useState({ avg: 0, count: 0 });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    college_name: '',
    student_id: '',
    university: '',
    batch: '',
    course: '',
    hostel: '',
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUniversities();
    }
  }, [user]);

  const fetchUniversities = async () => {
    const { data } = await supabase
      .from('universities')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setUniversities(data);
  };

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      const rating = await fetchUserRating(data.user_id);
      setMyRating(rating);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        college_name: data.college_name || '',
        student_id: data.student_id || '',
        university: data.university || '',
        batch: data.batch || '',
        course: data.course || '',
        hostel: data.hostel || '',
      });
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    if (!user || !profile) return;
    setUploadingAvatar(true);

    try {
      const oldUrl = profile.avatar_url;
      const file = new File([croppedImage], `${user.id}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const avatarUrl = await uploadToCloudinary(file, 'avatars');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      if (oldUrl && oldUrl.startsWith('https://res.cloudinary.com')) {
        deleteFromCloudinary(oldUrl);
      }

      setProfile({ ...profile, avatar_url: avatarUrl });
      toast({ title: 'Success', description: 'Profile picture updated' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Error', description: 'Failed to upload picture', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      setCropModalOpen(false);
      setImageToCrop(null);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      setProfile({ ...profile, ...formData });
      toast({ title: 'Success', description: 'Profile updated successfully' });
      navigate(-1);
    }
    setSaving(false);
  };

  const copyMckId = () => {
    if (profile?.mck_id) {
      navigator.clipboard.writeText(profile.mck_id);
      toast({ title: 'Copied!', description: 'MCK-ID copied to clipboard' });
    }
  };

  const getVerificationInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, text: 'Verified', color: 'text-green-600 bg-green-500/10' };
      case 'pending':
        return { icon: Clock, text: 'Pending', color: 'text-yellow-600 bg-yellow-500/10' };
      case 'rejected':
        return { icon: XCircle, text: 'Rejected', color: 'text-red-600 bg-red-500/10' };
      default:
        return { icon: Shield, text: 'Not Verified', color: 'text-muted-foreground bg-muted' };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const verificationInfo = getVerificationInfo(profile.verification_status || '');
  const VerificationIcon = verificationInfo.icon;

  return (
    <PWAPageWrapper title="Edit Profile" showBack onBack={() => navigate(-1)}>
      <div className="pb-24 md:pb-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-2xl mx-auto">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group mb-3">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-3xl md:text-4xl bg-primary/20 text-primary font-bold">
                    {profile.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer rounded-full">
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* MCK ID */}
              {profile.mck_id && (
                <button
                  onClick={copyMckId}
                  className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border/50 active:scale-95 transition-transform"
                >
                  <span className="text-sm font-medium text-foreground">@{profile.mck_id}</span>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <div className="bg-card rounded-xl p-2.5 md:p-4 text-center border border-border/50">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg md:text-xl font-bold text-foreground">{profile.campus_points || 0}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Points</p>
              </div>
              <div className="bg-card rounded-xl p-2.5 md:p-4 text-center border border-border/50">
                <Package className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg md:text-xl font-bold text-foreground">{profile.deals_completed || 0}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Deals</p>
              </div>
              <div className="bg-card rounded-xl p-2.5 md:p-4 text-center border border-border/50">
                <Star className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 fill-yellow-400 text-yellow-400" />
                <p className="text-lg md:text-xl font-bold text-foreground">{myRating.avg || 'N/A'}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Rating</p>
              </div>
              <div className={`rounded-xl p-2.5 md:p-4 text-center border border-border/50 ${verificationInfo.color}`}>
                <VerificationIcon className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1" />
                <p className="text-xs md:text-sm font-semibold">{verificationInfo.text}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Full Name
            </Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 XXXXXXXXXX"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* University */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              University
            </Label>
            <Select
              value={formData.university}
              onValueChange={(value) => setFormData({ ...formData, university: value })}
            >
              <SelectTrigger className="h-12 md:h-14 rounded-xl text-base md:text-lg">
                <SelectValue placeholder="Select University" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.name}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* College/Department */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              College/Department
            </Label>
            <Input
              value={formData.college_name}
              onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
              placeholder="e.g., School of Engineering"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* Student ID */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Student ID
            </Label>
            <Input
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              placeholder="Your student ID"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* Course */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Course
            </Label>
            <Input
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              placeholder="e.g., B.Tech CSE"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* Batch */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Batch
            </Label>
            <Input
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              placeholder="e.g., 2021-2025"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* Hostel */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base font-medium flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              Hostel/Residence
            </Label>
            <Input
              value={formData.hostel}
              onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
              placeholder="e.g., Block A-1"
              className="h-12 md:h-14 rounded-xl text-base md:text-lg"
            />
          </div>

          {/* KYC Button */}
          {profile.verification_status !== 'approved' && (
            <Button
              variant="outline"
              onClick={() => navigate('/kyc')}
              className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg border-primary/50 text-primary hover:bg-primary/10"
            >
              <Shield className="h-5 w-5 mr-2" />
              {profile.verification_status ? 'Update KYC Verification' : 'Complete KYC Verification'}
            </Button>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </PWAPageWrapper>
  );
};

export default PWAEditProfile;
