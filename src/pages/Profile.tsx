import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, XCircle, User, Edit3, Save, X, Shield, Zap, Star, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
    student_id: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

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
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        college_name: data.college_name || '',
        student_id: data.student_id || ''
      });
    }
    setLoading(false);
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
          {/* Profile Header - Futuristic Design */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      {profile?.verification_status === 'approved' && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-success rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                        Profile Command Center
                      </CardTitle>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                  {!editMode ? (
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="hover-scale">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
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
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30 hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">Items Sold</div>
                  </div>
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">Items Bought</div>
                  </div>
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
                    <Label htmlFor="college_name" className="text-sm font-medium">College Name</Label>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;