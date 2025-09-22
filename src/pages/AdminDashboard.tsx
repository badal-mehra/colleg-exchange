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
      await Promise.all([fetchProfiles(), fetchItems(), fetchSliderImages()]);
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

  const updateVerificationStatus = async (profileId: string, status: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: status })
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
        description: `Verification status updated to ${status}`,
      });
      fetchProfiles();
    }
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      fetchItems();
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail) return;

    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newAdminEmail)
        .single();

      if (userError || !userData) {
        toast({
          title: "Error",
          description: "User not found with this email",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: userData.user_id,
          email: newAdminEmail,
          role: 'admin'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add admin",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Admin added successfully",
        });
        setNewAdminEmail('');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
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

  const addSliderImage = async () => {
    if (!newSliderImage.url || !newSliderImage.title) return;

    const { error } = await supabase
      .from('image_slidebar')
      .insert({
        image_url: newSliderImage.url,
        title: newSliderImage.title,
        description: newSliderImage.description,
        sort_order: sliderImages.length + 1
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add slider image",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Slider image added successfully",
      });
      setNewSliderImage({ url: '', title: '', description: '' });
      fetchSliderImages();
    }
  };

  const deleteSliderImage = async (imageId: string) => {
    const { error } = await supabase
      .from('image_slidebar')
      .delete()
      .eq('id', imageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete slider image",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Slider image deleted successfully",
      });
      fetchSliderImages();
    }
  };

  const SlidebarManagement = () => (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Slidebar Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={newSliderImage.url}
                onChange={(e) => setNewSliderImage(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="image-title">Title</Label>
              <Input
                id="image-title"
                placeholder="Slide title"
                value={newSliderImage.title}
                onChange={(e) => setNewSliderImage(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="image-description">Description</Label>
              <Input
                id="image-description"
                placeholder="Slide description"
                value={newSliderImage.description}
                onChange={(e) => setNewSliderImage(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={addSliderImage}>
            Add Slider Image
          </Button>

          <div className="space-y-4">
            {sliderImages.map((image) => (
              <div key={image.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <img 
                    src={image.image_url} 
                    alt={image.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium">{image.title}</h3>
                    <p className="text-sm text-muted-foreground">{image.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteSliderImage(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users & KYC
            </TabsTrigger>
            <TabsTrigger value="listings">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="slidebar">
              <Eye className="h-4 w-4 mr-2" />
              Slidebar
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
                          </div>
                          <Badge variant={
                            profile.verification_status === 'approved' ? 'default' :
                            profile.verification_status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {profile.verification_status || 'Not submitted'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVerificationStatus(profile.id, 'approved')}
                          disabled={profile.verification_status === 'approved'}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateVerificationStatus(profile.id, 'rejected')}
                          disabled={profile.verification_status === 'rejected'}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
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
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/item/${item.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
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
                        placeholder="Enter email address"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                    </div>
                    <Button onClick={addAdmin} className="mt-6">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="slidebar">
            <SlidebarManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;