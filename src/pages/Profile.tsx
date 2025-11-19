// file: Profile.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Clock, XCircle, User, Edit3, Save, X, Shield, Zap, Star, Settings, Award, Trophy, Target, Upload, Camera, Copy, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from '@/components/ImageCropModal';

// ⭐ UPDATED INTERFACE to include calculated ratings
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
  // NEW: Ratings summary for the user
  user_ratings?: {
    count: number;
    avg: number | null;
  }[];
}

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
      .select(`
        *,
        // ⭐ NEW: Fetch aggregate ratings for the current user
        user_ratings:ratings!to_user_id (count, avg:rating)
      `)
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
      setProfile(data as Profile);
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
          variant: 'default' as const,
          bgColor: 'bg-success/10 border-success/20'
        };
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5 text-warning" />,
          text: 'Pending Review',
          variant: 'secondary' as const,
          bgColor: 'bg-warning/10 border-warning/20'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          text: 'Rejected',
          variant: 'destructive' as const,
          bgColor: 'bg-destructive/10 border-destructive/20'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-muted-foreground" />,
          text: 'Not Submitted',
          variant: 'outline' as const,
          bgColor: 'bg-muted/10 border-border'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const statusInfo = getVerificationStatusInfo(profile?.verification_status || '');
  const avatarUrl = getAvatarUrl(profile?.avatar_url);
  
  // ⭐ RATING CALCULATION LOGIC
  const ratingData = profile?.user_ratings?.[0]; 
  const averageRating = ratingData?.avg ? parseFloat(ratingData.avg.toFixed(1)) : null;
  const totalCount = ratingData?.count || 0;
  
  // Helper to render stars
  const renderStars = (avg: number | null) => {
    if (avg === null) return null;
    const fullStars = Math.floor(avg);
    const hasHalfStar = avg - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-warning text-warning" />
        ))}
        {hasHalfStar && (
          // Represent half star if needed (using a full star as a placeholder for simplicity in this example)
          <Star key="half" className="h-4 w-4 fill-warning/50 text-warning" /> 
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover-scale">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Header with Avatar */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
              <CardHeader>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarImage src={avatarUrl || undefined} alt={profile?.full_name} />
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/60 text-white">
                        {profile?.full_name?.charAt(0) || <User className="h-16 w-16" />}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
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
                    {profile?.verification_status === 'approved' && (
                      <div className="absolute top-0 right-0">
                        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center border-2 border-background">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                      <CardTitle className="text-2xl gradient-text">
                        {profile?.full_name || 'Complete your profile'}
                      </CardTitle>
                      {!editMode ? (
                        <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="hover-scale w-fit mx-auto md:mx-0">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2 mx-auto md:mx-0">
                          <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-primary/80">
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* ⭐ NEW: RATING DISPLAY BLOCK (Profile Header) */}
                    {averageRating !== null && totalCount > 0 ? (
                        <div className="flex flex-col gap-1 mb-3 justify-center md:justify-start">
                            <div className="flex items-center gap-2">
                                {renderStars(averageRating)}
                                <span className="text-xl font-bold text-yellow-500">{averageRating}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Based on {totalCount} ratings</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mb-3">No ratings yet.</p>
                    )}
                    {/* ------------------------------- */}

                    <div className="space-y-2 mb-4">
                      <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                        <Zap className="h-4 w-4" />
                        {profile?.email}
                      </p>
                      {profile?.mck_id && (
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <code className="px-3 py-1 bg-primary/10 rounded-lg font-mono text-primary font-semibold">
                            {profile.mck_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyMckId}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/profile/${profile.mck_id}`)}
                          >
                            View Public Profile
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Verification Status - Left Column */}
          <div className="space-y-6">
            <Card className={`${statusInfo.bgColor} hover-scale`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {statusInfo.icon}
                  <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    Verification Status
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
                    {statusInfo.text}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {profile?.verification_status === 'approved' && '🎉 Your student identity has been verified. You can now buy and sell items.'}
                    {profile?.verification_status === 'pending' && '⏳ Your verification is under review. We\'ll notify you once it\'s complete.'}
                    {profile?.verification_status === 'rejected' && '❌ Your verification was rejected. Please check your documents and resubmit.'}
                    {!profile?.verification_status && '🚀 Complete your student verification to start buying and selling.'}
                  </p>
                  {profile?.verification_status !== 'approved' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/kyc')}
                      className="w-full hover-scale"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {profile?.verification_status ? 'Update KYC' : 'Complete KYC'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/my-reports')}
                    className="w-full hover-scale"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    My Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campus Stats & Gamification */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Campus Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{profile?.campus_points || 0}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Target className="h-4 w-4" />
                      Campus Points
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-xl font-bold text-primary">{profile?.deals_completed || 0}</div>
                      <div className="text-xs text-muted-foreground">Deals Done</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-xl font-bold text-success">{profile?.trust_seller_badge ? '✓' : '✗'}</div>
                      <div className="text-xs text-muted-foreground">Trust Badge</div>
                    </div>
                  </div>
                  {profile?.trust_seller_badge && (
                    <Badge className="w-full justify-center bg-gradient-to-r from-warning to-warning/80">
                      <Award className="h-3 w-3 mr-1" />
                      Trusted Seller
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information - Right Column */}
          <div className="lg:col-span-2">
            <Card className="h-fit hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university" className="text-sm font-medium">University</Label>
                    {editMode ? (
                      <Select
                        value={formData.university}
                        onValueChange={(value) => setFormData({ ...formData, university: value })}
                      >
                        <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
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
                      <Input
                        id="university"
                        value={formData.university}
                        disabled={true}
                        className="bg-muted/50"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college_name" className="text-sm font-medium">College/Department</Label>
                    <Input
                      id="college_name"
                      value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student_id" className="text-sm font-medium">Student ID</Label>
                    <Input
                      id="student_id"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm font-medium">Course</Label>
                    <Input
                      id="course"
                      placeholder="e.g., B.Tech CSE"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-sm font-medium">Batch</Label>
                    <Input
                      id="batch"
                      placeholder="e.g., 2021-2025"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostel" className="text-sm font-medium">Hostel</Label>
                    <Input
                      id="hostel"
                      placeholder="e.g., Block A-1"
                      value={formData.hostel}
                      onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                      disabled={!editMode}
                      className={`transition-all duration-200 ${!editMode ? 'bg-muted/50' : 'focus:ring-2 focus:ring-primary/20'}`}
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
            setCropModalModal(false);
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
