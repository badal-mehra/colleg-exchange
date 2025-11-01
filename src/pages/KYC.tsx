import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Camera,
  ArrowLeft
} from 'lucide-react';
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
  verification_document_url: string;
}

const KYC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    college_name: '',
    student_id: '',
    verification_document: null as File | null
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
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
    } else {
      setProfile(data);
      setFormData({
        full_name: data?.full_name || '',
        phone: data?.phone || '',
        college_name: data?.college_name || '',
        student_id: data?.student_id || '',
        verification_document: null
      });
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        verification_document: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.full_name || !formData.phone || !formData.college_name || !formData.student_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.verification_document && !profile?.verification_document_url) {
      toast({
        title: "Document Required",
        description: "Please upload your student ID or Aadhaar card",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let verification_document_url = profile?.verification_document_url;

      // Upload document if new file is selected
      if (formData.verification_document) {
        const fileExt = formData.verification_document.name.split('.').pop();
        const fileName = `${user.id}/verification-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData.verification_document, {
            upsert: true,
            contentType: formData.verification_document.type
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        verification_document_url = urlData.publicUrl;
      }

      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        college_name: formData.college_name,
        student_id: formData.student_id,
        verification_document_url,
        verification_status: 'pending'
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "KYC Submitted",
        description: "Your verification is under review. You'll be notified once approved.",
      });

      // Refresh profile data
      await fetchProfile();

    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'rejected':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-primary">KYC Verification</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Status Card */}
        {profile?.verification_status && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className={`flex items-center gap-3 ${getStatusColor(profile.verification_status)}`}>
                {getStatusIcon(profile.verification_status)}
                <div>
                  <h3 className="font-semibold">
                    Verification Status: {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.verification_status === 'approved' && "Your account is fully verified!"}
                    {profile.verification_status === 'pending' && "Your documents are under review. This typically takes 24-48 hours."}
                    {profile.verification_status === 'rejected' && "Your verification was not approved. Please update your information and try again."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KYC Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Student Identity Verification
            </CardTitle>
            <p className="text-muted-foreground">
              Complete your verification to start buying and selling on MyCampusKart
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="college_name">College/University Name *</Label>
                <Input
                  id="college_name"
                  value={formData.college_name}
                  onChange={(e) => handleInputChange('college_name', e.target.value)}
                  placeholder="Enter your college or university name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID/Roll Number *</Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  placeholder="Enter your student ID or roll number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification_document">
                  Upload Student ID Card or Aadhaar Card *
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="verification_document"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="verification_document" className="cursor-pointer">
                    <div className="space-y-2">
                      {formData.verification_document ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <FileText className="h-8 w-8" />
                          <span className="font-medium">{formData.verification_document.name}</span>
                        </div>
                      ) : profile?.verification_document_url ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <CheckCircle className="h-8 w-8" />
                          <span className="font-medium">Document uploaded</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <div>
                            <p className="font-medium">Click to upload document</p>
                            <p className="text-sm text-muted-foreground">
                              Supported formats: JPG, PNG, PDF (Max 5MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please ensure your document is clear and all information is visible.
                </p>
              </div>

              <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-info mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-info">Why do we need verification?</p>
                    <p className="text-muted-foreground mt-1">
                      We verify all users to ensure a safe and trusted marketplace for students. 
                      Your personal information is kept secure and private.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitting || (profile?.verification_status === 'approved')}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : profile?.verification_status === 'approved' ? (
                  'Already Verified'
                ) : (
                  'Submit for Verification'
                )}
              </Button>

              {profile?.verification_status === 'pending' && (
                <p className="text-center text-sm text-muted-foreground">
                  You can update your information while verification is pending.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KYC;