import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Users, ShoppingBag, CheckCircle, XCircle, UserPlus, Trash2, Eye, AlertTriangle, Filter, BookOpen, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Footer } from '@/components/Footer'; // Import Footer for consistent styling (optional)

// ------------------- Interfaces (Unchanged) -------------------
interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  verification_status: string;
  college_name: string;
  student_id: string;
  verification_document_url: string;
}

interface Item {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  is_sold: boolean;
  created_at: string;
}

// NEW INTERFACE for consolidated static pages
interface StaticPage {
  id: string;
  title: string;
  slug: 'terms' | 'privacy' | 'about' | 'shipping' | string;
  content: string;
  version: string;
  is_active: boolean;
  created_at: string;
}
// -------------------------------------------------------------

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [newSliderImage, setNewSliderImage] = useState({ url: '', title: '', description: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [newUniversity, setNewUniversity] = useState({ name: '', code: '', location: '' });
  
  // OLD: Removed termsConditions and related state
  // NEW: Consolidated Static Pages state
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [newStaticPage, setNewStaticPage] = useState<Omit<StaticPage, 'id' | 'is_active' | 'created_at'>>({ 
      title: '', 
      slug: 'terms', // Default to terms
      content: '', 
      version: '' 
  });

  const [reports, setReports] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState<string>('all');
  
  // OLD: Removed footerSettings and related state
  // const [footerSettings, setFooterSettings] = useState<any[]>([]); 

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user.id });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await Promise.all([
          fetchProfiles(), 
          fetchItems(), 
          fetchSliderImages(), 
          fetchUniversities(), 
          // OLD: Removed fetchTermsConditions()
          // OLD: Removed fetchFooterSettings()
          fetchReports(), 
          fetchStaticPages() // NEW: Fetch all static pages
        ]);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  // ------------------- NEW STATIC CONTENT FETCH FUNCTION -------------------
  const fetchStaticPages = async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('slug')
        .order('version', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch static content",
          variant: "destructive",
        });
      } else {
        setStaticPages(data || []);
      }
    };
  // --------------------------------------------------------------------------

  // OLD: Removed fetchTermsConditions implementation
  // OLD: Removed fetchFooterSettings implementation

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive",
      });
    } else {
      setProfiles(data || []);
    }
  };

  const handleVerificationUpdate = async (profileId: string, newStatus: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', profileId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Verification status updated to ${newStatus}`,
      });
      fetchProfiles();
    }
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch items",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
  };

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch universities",
        variant: "destructive",
      });
    } else {
      setUniversities(data || []);
    }
  };

  // OLD: Removed fetchTermsConditions function (Logic moved to fetchStaticPages)

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reported_by_fkey(full_name, email, avatar_url, mck_id),
        reported_user:profiles!reports_target_id_fkey(full_name, email, avatar_url, mck_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch reports",
        variant: "destructive",
      });
    } else {
      setReports(data || []);
    }
  };

  const fetchSliderImages = async () => {
    const { data, error } = await supabase
      .from('image_slidebar')
      .select('*')
      .order('sort_order');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch slider images",
        variant: "destructive",
      });
    } else {
      setSliderImages(data || []);
    }
  };

  const handleReportStatusUpdate = async (reportId: string, newStatus: string, adminNotes?: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ 
        status: newStatus,
        admin_notes: adminNotes,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Report marked as ${newStatus}`,
      });
      fetchReports();
    }
  };

  // ------------------- NEW STATIC PAGE HANDLERS -------------------
  const handleStaticPageActivate = async (id: string, slug: string) => {
      try {
          // 1. Deactivate all existing pages with the same slug
          await supabase
              .from('static_pages')
              .update({ is_active: false })
              .eq('slug', slug)
              .eq('is_active', true);

          // 2. Activate the selected page
          const { error } = await supabase
              .from('static_pages')
              .update({ is_active: true })
              .eq('id', id);

          if (error) throw error;

          toast({
              title: "Success",
              description: `${slug.toUpperCase()} page activated successfully.`,
          });
          fetchStaticPages();
      } catch (error: any) {
          toast({
              title: "Error",
              description: error?.message || "Failed to activate page.",
              variant: "destructive",
          });
      }
  };

  const handleAddStaticPage = async () => {
      if (!newStaticPage.content || !newStaticPage.version || !newStaticPage.title || !newStaticPage.slug) {
          toast({
              title: "Error",
              description: "Please fill in all fields (Title, Slug, Content, Version)",
              variant: "destructive",
          });
          return;
      }

      try {
          // Deactivate all existing pages with the same slug before inserting the new one
          await supabase
              .from('static_pages')
              .update({ is_active: false })
              .eq('slug', newStaticPage.slug)
              .eq('is_active', true);

          // Insert new page as active
          const { error } = await supabase
              .from('static_pages')
              .insert({
                  ...newStaticPage,
                  is_active: true,
                  created_by: user?.id, // assuming you have a created_by column
              });

          if (error) throw error;

          toast({
              title: "Success",
              description: `${newStaticPage.title} added and activated.`,
          });
          setNewStaticPage({ title: '', slug: 'terms', content: '', version: '' });
          fetchStaticPages();
      } catch (error: any) {
          toast({
              title: "Error",
              description: error?.message || "Failed to add static page.",
              variant: "destructive",
          });
      }
  };
  // --------------------------------------------------------------------------

  const filteredReports = reports.filter(report => {
    if (reportFilter === 'all') return true;
    return report.status === reportFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Manage users, listings, and platform settings</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7"> {/* FIX: Grid reduced from 8 to 7 columns */}
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users & KYC
            </TabsTrigger>
            <TabsTrigger value="listings">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="reports">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="slider">Images</TabsTrigger>
            <TabsTrigger value="universities">Universities</TabsTrigger>
            {/* FIX: Combined Terms and Footer Management into Content */}
            <TabsTrigger value="content">
                <BookOpen className="h-4 w-4 mr-2" /> 
                Content (CMS)
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Shield className="h-4 w-4 mr-2" />
              Admins
            </TabsTrigger>
            {/* OLD: TabsTrigger value="footer" REMOVED */}
          </TabsList>

          <TabsContent value="users">
            {/* ... User Management Code (Unchanged) ... */}
            <Card>
              <CardHeader>
                <CardTitle>User Management & KYC Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium">{profile.full_name || 'No name'}</h3>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile.college_name} • {profile.student_id}
                            </p>
                            {profile.verification_document_url && (
                              <div className="mt-2 flex items-center gap-2">
                                <a
                                  href={profile.verification_document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Eye className="h-3 w-3" />
                                  View Uploaded Document
                                </a>
                                <img 
                                  src={profile.verification_document_url} 
                                  alt="Verification Document" 
                                  className="max-w-xs rounded border mt-1"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            {!profile.verification_document_url && profile.verification_status === 'pending' && (
                              <p className="text-xs text-muted-foreground mt-2">No document uploaded</p>
                            )}
                          </div>
                          <Badge variant={
                            profile.verification_status === 'approved' ? 'default' :
                            profile.verification_status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {profile.verification_status || 'Not submitted'}
                          </Badge>
                        </div>
                      </div>
                      {profile.verification_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleVerificationUpdate(profile.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVerificationUpdate(profile.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            {/* ... Listing Management Code (Unchanged) ... */}
             <Card>
              <CardHeader>
                <CardTitle>Listing Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} • {item.is_sold ? 'Sold' : 'Available'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            {/* ... Reports Management Code (Unchanged) ... */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reports & Feedback Management</CardTitle>
                  <Select value={reportFilter} onValueChange={setReportFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter reports" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reports found</p>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <Card key={report.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={
                                    report.status === 'pending' ? 'default' :
                                    report.status === 'reviewed' ? 'secondary' : 'outline'
                                  } className="capitalize">
                                    {report.status}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {report.report_type}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-3 bg-muted/30 rounded-lg">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Reporter:</p>
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                        {report.reporter?.full_name?.charAt(0) || 'U'}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{report.reporter?.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">{report.reporter_email}</p>
                                        {report.reporter?.mck_id && (
                                          <p className="text-xs font-mono text-primary">{report.reporter.mck_id}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {report.report_type === 'seller' && report.reported_user && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Reported User:</p>
                                      <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-semibold text-destructive">
                                          {report.reported_user.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{report.reported_user.full_name || 'Unknown'}</p>
                                          <p className="text-xs text-muted-foreground">{report.reported_user.email}</p>
                                          {report.reported_user.mck_id && (
                                            <p className="text-xs font-mono text-primary">{report.reported_user.mck_id}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                  Reported on: {new Date(report.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium mb-1">Reason:</p>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                {report.reason}
                              </p>
                            </div>

                            <div>
                              <Label htmlFor={`admin-notes-${report.id}`} className="text-sm font-medium mb-2 block">
                                Admin Notes (visible to reported user):
                              </Label>
                              <Textarea
                                id={`admin-notes-${report.id}`}
                                placeholder="Add notes for this report (e.g., actions taken, warnings issued)..."
                                defaultValue={report.admin_notes || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== report.admin_notes) {
                                    handleReportStatusUpdate(report.id, report.status, e.target.value);
                                  }
                                }}
                                rows={3}
                                className="resize-none"
                              />
                            </div>

                            <div className="flex gap-2 pt-2 flex-wrap">
                              <Select
                                value={report.status}
                                onValueChange={(value) => handleReportStatusUpdate(report.id, value, report.admin_notes)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="reviewed">Reviewed</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {report.target_id && report.report_type === 'listing' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/item/${report.target_id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Listing
                                </Button>
                              )}
                              
                              {report.report_type === 'seller' && report.target_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Navigate to seller profile using target_id
                                    navigate(`/profile/${report.reported_user?.mck_id}`);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Seller
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slider">
            {/* ... Slider Image Management Code (Unchanged) ... */}
            <Card>
              <CardHeader>
                <CardTitle>Slider Image Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Slider Image Form */}
                  <div className="border rounded-lg p-4 space-y-4 bg-card">
                    <h3 className="font-medium text-lg">Add New Slider Image</h3>
                    <div className="grid gap-4">
                      {/* File Upload Option */}
                      <div className="space-y-2">
                        <Label>Upload Image File</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
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

                              // Validate file size (10MB)
                              if (file.size > 10 * 1024 * 1024) {
                                toast({
                                  title: "Error",
                                  description: "Image must be less than 10MB",
                                  variant: "destructive",
                                });
                                return;
                              }

                              setImageFile(file);
                            }}
                            className="flex-1"
                          />
                          {imageFile && (
                            <Button
                              variant="outline"
                              onClick={() => setImageFile(null)}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        {imageFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {imageFile.name}
                          </p>
                        )}
                      </div>

                      {/* Or URL Option */}
                      <div className="space-y-2">
                        <Label htmlFor="slider-url">Or Enter Image URL</Label>
                        <Input
                          id="slider-url"
                          placeholder="https://example.com/image.jpg"
                          value={newSliderImage.url}
                          onChange={(e) => setNewSliderImage({ ...newSliderImage, url: e.target.value })}
                          disabled={!!imageFile}
                        />
                      </div>

                      <div>
                        <Label htmlFor="slider-title">Title (Optional)</Label>
                        <Input
                          id="slider-title"
                          placeholder="Enter title"
                          value={newSliderImage.title}
                          onChange={(e) => setNewSliderImage({ ...newSliderImage, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="slider-description">Description (Optional)</Label>
                        <Input
                          id="slider-description"
                          placeholder="Enter description"
                          value={newSliderImage.description}
                          onChange={(e) => setNewSliderImage({ ...newSliderImage, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="slider-link">Link URL (Optional)</Label>
                        <Input
                          id="slider-link"
                          placeholder="https://example.com/page"
                          value={(newSliderImage as any).link_url || ''}
                          onChange={(e) => setNewSliderImage({ ...newSliderImage, link_url: e.target.value } as any)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Add a clickable link to this slider image</p>
                      </div>
                      <Button
                        onClick={async () => {
                          if (!imageFile && !newSliderImage.url) {
                            toast({
                              title: "Error",
                              description: "Please provide an image file or URL",
                              variant: "destructive",
                            });
                            return;
                          }

                          setUploadingImage(true);
                          try {
                            let imageUrl = newSliderImage.url;

                            // Upload file if provided
                            if (imageFile) {
                              const fileExt = imageFile.name.split('.').pop();
                              const fileName = `slider/${Date.now()}.${fileExt}`;

                              console.log('Uploading slider image:', fileName);

                              const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('avatars')
                                .upload(fileName, imageFile, { 
                                  upsert: true,
                                  contentType: imageFile.type
                                });

                              if (uploadError) {
                                console.error('Upload error:', uploadError);
                                throw uploadError;
                              }

                              console.log('Upload success:', uploadData);

                              const { data: publicUrlData } = supabase.storage
                                .from('avatars')
                                .getPublicUrl(fileName);

                              imageUrl = publicUrlData.publicUrl;
                              console.log('Public URL:', imageUrl);
                            }

                            console.log('Inserting into database with URL:', imageUrl);

                            const { data: insertData, error } = await supabase
                              .from('image_slidebar')
                              .insert({
                                image_url: imageUrl,
                                title: newSliderImage.title,
                                description: newSliderImage.description,
                                link_url: (newSliderImage as any).link_url || null,
                                is_active: true,
                                sort_order: sliderImages.length
                              });

                            if (error) {
                              console.error('Database insert error:', error);
                              throw error;
                            }

                            console.log('Database insert success:', insertData);

                            toast({
                              title: "Success",
                              description: "Slider image added successfully",
                            });
                            setNewSliderImage({ url: '', title: '', description: '' });
                            setImageFile(null);
                            fetchSliderImages();
                          } catch (error: any) {
                            console.error('Error adding slider image:', error);
                            toast({
                              title: "Error",
                              description: error?.message || "Failed to add slider image. Check console for details.",
                              variant: "destructive",
                            });
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? 'Uploading...' : 'Add Slider Image'}
                      </Button>
                    </div>
                  </div>

                  {/* Existing Slider Images */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Existing Slider Images</h3>
                    {sliderImages.map((image) => (
                      <div key={image.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{image.title || 'No title'}</h4>
                          <p className="text-sm text-muted-foreground">{image.description || 'No description'}</p>
                          {image.link_url && (
                            <p className="text-xs text-muted-foreground mt-1">Link: {image.link_url}</p>
                          )}
                        </div>
                        <Badge variant={image.is_active ? 'default' : 'secondary'}>
                          {image.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('image_slidebar')
                              .delete()
                              .eq('id', image.id);
                            if (error) {
                              toast({
                                title: "Error",
                                description: "Failed to delete slider image",
                                variant: "destructive",
                              });
                            } else {
                              toast({
                                title: "Success",
                                description: "Slider image deleted",
                              });
                              fetchSliderImages();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="universities">
            {/* ... University Management Code (Unchanged) ... */}
            <Card>
              <CardHeader>
                <CardTitle>University Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {universities.map((university) => (
                    <div key={university.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{university.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {university.code} • {university.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FIX: NEW Content Management System (CMS) Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Static Content Management (CMS)</CardTitle>
                <p className="text-sm text-muted-foreground">Manage Terms, Privacy Policy, About Us, etc. (uses `static_pages` table).</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Page Form */}
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-medium">Add/Update Static Page</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="page-title">Display Title</Label>
                          <Input
                            id="page-title"
                            placeholder="e.g., Privacy Policy"
                            value={newStaticPage.title}
                            onChange={(e) => setNewStaticPage({ ...newStaticPage, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-slug">Page Identifier (Slug)</Label>
                          <Select
                            value={newStaticPage.slug}
                            onValueChange={(value) => setNewStaticPage({ ...newStaticPage, slug: value as 'terms' | 'privacy' | 'about' })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select page type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="terms">Terms & Conditions (terms)</SelectItem>
                              <SelectItem value="privacy">Privacy Policy (privacy)</SelectItem>
                              <SelectItem value="about">About Us (about)</SelectItem>
                              <SelectItem value="shipping">Shipping Info (shipping)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">URL/Identifier. E.g., for Footer Links.</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="page-version">Version</Label>
                      <Input
                        id="page-version"
                        placeholder="e.g., 1.0, 2.1"
                        value={newStaticPage.version}
                        onChange={(e) => setNewStaticPage({ ...newStaticPage, version: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="page-content">Content</Label>
                      <Textarea
                        id="page-content"
                        className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background"
                        placeholder="Enter the page content (e.g., terms, policy, etc.)..."
                        value={newStaticPage.content}
                        onChange={(e) => setNewStaticPage({ ...newStaticPage, content: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddStaticPage}>
                      Add & Activate New Page Version
                    </Button>
                  </div>

                  {/* Existing Pages */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Existing Static Pages</h3>
                    {['terms', 'privacy', 'about', 'shipping'].map(slug => {
                        const pages = staticPages.filter(p => p.slug === slug);
                        if (pages.length === 0) return null;
                        
                        return (
                            <div key={slug} className="space-y-3 p-4 border rounded-lg">
                                <h4 className="font-semibold text-lg capitalize flex items-center gap-2">
                                    <BookOpen className='h-4 w-4' />
                                    {slug.replace('-', ' ')}
                                </h4>
                                {pages.map((page) => (
                                    <div key={page.id} className="p-3 border rounded-md">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h5 className="font-medium text-sm">Title: {page.title} (v{page.version})</h5>
                                                <p className="text-xs text-muted-foreground">
                                                    Created: {new Date(page.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant={page.is_active ? 'success' : 'secondary'}>
                                                {page.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                            {page.content}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    // Logic to view full content in new window (same as before)
                                                    const newWindow = window.open('', '_blank');
                                                    if (newWindow) {
                                                      newWindow.document.write(`
                                                        <html>
                                                          <head>
                                                            <title>${page.title} v${page.version}</title>
                                                            <style>
                                                              body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                                                              h1 { color: #333; }
                                                              .version { color: #666; font-size: 0.9rem; }
                                                            </style>
                                                          </head>
                                                          <body>
                                                            <h1>${page.title}</h1>
                                                            <p class="version">Version: ${page.version}</p>
                                                            <div>${page.content.replace(/\n/g, '<br>')}</div>
                                                          </body>
                                                        </html>
                                                      `);
                                                      newWindow.document.close();
                                                    }
                                                }}
                                            >
                                                View Full
                                            </Button>
                                            {!page.is_active && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStaticPageActivate(page.id, page.slug)}
                                                >
                                                    Activate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="admin-email">Add New Admin</Label>
                      <Input
                        id="admin-email"
                        placeholder="admin@university.edu"
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* OLD: TabsContent value="footer" REMOVED */}
          
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
