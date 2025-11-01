import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Users, ShoppingBag, CheckCircle, XCircle, UserPlus, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
      await Promise.all([fetchProfiles(), fetchItems(), fetchSliderImages(), fetchUniversities()]);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

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

  const handleVerificationUpdate = async (profileId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: status,
        is_verified: status === 'approved'
      })
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
        description: `Verification ${status}`,
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users & KYC
            </TabsTrigger>
            <TabsTrigger value="listings">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="slider">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Slider Images
            </TabsTrigger>
            <TabsTrigger value="universities">
              <Shield className="h-4 w-4 mr-2" />
              Universities
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Shield className="h-4 w-4 mr-2" />
              Admin Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
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

          <TabsContent value="slider">
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;