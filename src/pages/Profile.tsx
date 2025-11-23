import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Clock, XCircle, User, Edit3, Save, X, Shield, Zap, Star, Settings, Award, Trophy, Target, Camera, Copy, AlertTriangle, Package } from 'lucide-react'; // Added Package
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from '@/components/ImageCropModal';
import { Separator } from '@/components/ui/separator'; // Added Separator

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
}

// ⭐ ADDED: Fetch Rating Utility - Common Function (STEP 2)
const fetchUserRating = async (userId: string) => {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("to_user_id", userId);

  if (error || !data) return { avg: 0, count: 0 };

  const count = data.length;
  const avg =
    count === 0
      ? 0
      : data.reduce((sum, item) => sum + item.rating, 0) / count;

  // Rounding to one decimal place for clean display
  return { avg: parseFloat(avg.toFixed(1)), count };
};

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    college_name: '',
    student_id: '',
    university: '',
    batch: '',
    course: '',
    hostel: ''
  });
  const [universities, setUniversities] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // ADDED: State for My Rating (STEP 1)
  const [myRating, setMyRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    fetchProfile();
    fetchUniversities();
  }, [user]);

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching universities:', error);
    } else {
      setUniversities(data || []);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else {
      setProfile(data);
      
      // ADDED: Fetch Rating after profile loads (STEP 3)
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
        hostel: data.hostel || ''
      });
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Read file and open crop modal
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
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: fileName });
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
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
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      setProfile({ ...profile, ...formData });
      setEditMode(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setSaving(false);
  };

  const copyMckId = () => {
    if (profile?.mck_id) {
      navigator.clipboard.writeText(profile.mck_id);
      toast({
        title: "Copied!",
        description: "MCK-ID copied to clipboard",
      });
    }
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  const getVerificationStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="h-5 w-5 text-success" />,
          text: 'Verified',
          variant: 'success' as const, // Changed to 'success' for explicit styling
          color: 'text-success',
          description: '🎉 Your student identity has been verified. You can now buy and sell items.'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-warning" />,
          text: 'Pending Review',
          variant: 'warning' as const, // Custom 'warning' for better color control
          color: 'text-warning',
          description: '⏳ Your verification is under review. We\'ll notify you once it\'s complete.'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          text: 'Rejected',
          variant: 'destructive' as const,
          color: 'text-destructive',
          description: '❌ Your verification was rejected. Please check your documents and resubmit.'
        };
      default:
        return {
          icon: <Shield className="h-5 w-5 text-muted-foreground" />,
          text: 'Not Verified',
          variant: 'outline' as const,
          color: 'text-muted-foreground',
          description: '🚀 Complete your student verification to start buying and selling.'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-96 bg-muted rounded-lg lg:col-span-1"></div>
            <div className="h-96 bg-muted rounded-lg lg:col-span-2"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getVerificationStatusInfo(profile?.verification_status || '');
  const avatarUrl = getAvatarUrl(profile?.avatar_url);

  return (
    <div className="min-h-screen bg-background"> {/* Removed background gradient */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            {!editMode ? (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="text-primary border-primary hover:bg-primary/10">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => { setEditMode(false); fetchProfile(); }} disabled={saving}> {/* Re-fetch profile on cancel for reset */}
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Header (Avatar and Name) */}
        <Card className="mb-8 border shadow-sm">
          <CardContent className="pt-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary/10">
                <AvatarImage src={avatarUrl || undefined} alt={profile?.full_name} />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || <User className="h-16 w-16" />}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-full">
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
                  <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {profile?.full_name || 'Set Up Your Profile'}
              </h1>
              <p className="text-lg text-primary font-mono mb-2 flex items-center justify-center md:justify-start">
                <Zap className="h-4 w-4 mr-2 text-primary/80" />
                {profile?.email}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                {profile?.mck_id && (
                  <>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      MCK-ID: {profile.mck_id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyMckId}
                      className="h-8 p-1 text-muted-foreground hover:text-primary"
                      aria-label="Copy MCK-ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/profile/${profile.mck_id}`)}
                      className="text-sm"
                    >
                      View Public Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats and Actions */}
          <div className="space-y-6 lg:col-span-1">

            {/* Verification Status */}
            <Card className={`border ${statusInfo.color.replace('text', 'border')} shadow-md`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-lg ${statusInfo.color}`}>
                  {statusInfo.icon}
                  Student Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
                  {statusInfo.text}
                </Badge>
                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                {profile?.verification_status !== 'approved' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => navigate('/kyc')}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {profile?.verification_status ? 'Update/Resubmit KYC' : 'Complete KYC Now'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Campus Stats & Ratings */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Seller Performance & Campus Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Rating Block */}
                  <div className="p-4 bg-muted rounded-lg flex justify-between items-center border border-yellow-500/20">
                    <div>
                      <CardDescription className="mb-1 flex items-center gap-1 text-yellow-600">
                        <Star className="h-4 w-4 fill-yellow-500" />
                        My Seller Rating
                      </CardDescription>
                      <div className="text-3xl font-bold text-yellow-500">
                        {myRating.avg.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{myRating.count} Reviews</div>
                      {myRating.count === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No ratings yet. Start selling!
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Other Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-xl font-bold text-primary">{profile?.deals_completed || 0}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Package className="h-3 w-3" /> Deals Done
                      </div>
                    </div>
                    <div className="text-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-xl font-bold text-success">
                        {profile?.trust_seller_badge ? 'YES' : 'NO'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Award className="h-3 w-3 text-warning" /> Trust Badge
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Campus Points */}
                  <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{profile?.campus_points || 0}</div>
                    <div className="text-sm text-primary/80 flex items-center justify-center gap-1 mt-1">
                      <Target className="h-4 w-4" /> Campus Points
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
            
            {/* Reports Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/my-reports')}
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              View My Reports & Appeals
            </Button>
          </div>

          {/* Right Column: Personal Information Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Settings className="h-5 w-5 text-primary" />
                  Contact & Academic Information
                </CardTitle>
                <CardDescription>
                  Update your details. These fields are used for verification and deal coordination.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    {editMode ? (
                      <Select
                        value={formData.university}
                        onValueChange={(value) => setFormData({ ...formData, university: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select University" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((university) => (
                            <SelectItem key={university.id} value={university.name}>
                              {university.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="university" value={formData.university} disabled={true} className="bg-muted/50 cursor-not-allowed" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college_name">College/Department</Label>
                    <Input
                      id="college_name"
                      value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      placeholder="e.g., B.Tech CSE"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch</Label>
                    <Input
                      id="batch"
                      placeholder="e.g., 2021-2025"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostel">Hostel/Residence</Label>
                    <Input
                      id="hostel"
                      placeholder="e.g., Block A-1"
                      value={formData.hostel}
                      onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                      disabled={!editMode}
                      className={!editMode ? 'bg-muted/50 cursor-not-allowed' : ''}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
    </div>
  );
};

export default Profile;
