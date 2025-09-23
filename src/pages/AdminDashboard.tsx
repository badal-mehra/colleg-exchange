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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users & KYC
            </TabsTrigger>
            <TabsTrigger value="listings">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Listings
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
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(profile.verification_document_url, '_blank')}
                                  className="text-xs p-1 h-6"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Document
                                </Button>
                              </div>
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
                    </div>
                  ))}
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