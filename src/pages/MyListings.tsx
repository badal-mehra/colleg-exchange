import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Eye,
  Trash2,
  Edit,
  Calendar,
  MapPin,
  Package,
  CheckCircle,
  ImageOff,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { deleteFromCloudinary } from '@/utils/cloudinaryDelete';

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string | null;
  images: string[] | null;
  location: string | null;
  is_sold: boolean | null;
  views: number | null;
  created_at: string;
  seller_id: string;
  ad_type: string | null;
  is_negotiable: boolean | null;
  status?: string | null;
}

const formatCondition = (condition?: string | null) =>
  condition ? condition.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Used';

const ListingImage = ({ item }: { item: Item }) => {
  const [broken, setBroken] = useState(false);
  const firstImage = item.images?.find(Boolean);

  if (!firstImage || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={firstImage}
      alt={item.title}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setBroken(true)}
    />
  );
};

const MyListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const fetchMyListings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your listings',
        variant: 'destructive',
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const deleteItem = async (itemId: string) => {
    if (!user) return;
    const shouldDelete = window.confirm('Delete this listing permanently?');
    if (!shouldDelete) return;

    setBusyItemId(itemId);
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('images')
      .eq('id', itemId)
      .eq('seller_id', user.id)
      .single();

    if (fetchError) {
      setBusyItemId(null);
      toast({ title: 'Error', description: 'Failed to fetch item details', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('seller_id', user.id);

    setBusyItemId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
      return;
    }

    if (item?.images?.length) {
      try {
        await Promise.all(item.images.filter(Boolean).map((url: string) => deleteFromCloudinary(url)));
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
      }
    }

    toast({ title: 'Deleted', description: 'Listing removed successfully' });
    fetchMyListings();
  };

  const toggleSoldStatus = async (itemId: string, currentStatus: boolean | null) => {
    if (!user) return;
    const nextSold = !currentStatus;
    setBusyItemId(itemId);
    const { error } = await supabase
      .from('items')
      .update({ is_sold: nextSold, status: nextSold ? 'sold' : 'available' })
      .eq('id', itemId)
      .eq('seller_id', user.id);

    setBusyItemId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update item status', variant: 'destructive' });
      return;
    }

    toast({ title: 'Updated', description: `Listing marked as ${nextSold ? 'sold' : 'available'}` });
    fetchMyListings();
  };

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter((item) => !item.is_sold).length,
    sold: items.filter((item) => item.is_sold).length,
    totalViews: items.reduce((sum, item) => sum + (item.views || 0), 0),
  }), [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="h-44 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="w-fit px-0 hover:bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-normal">My Listings</h1>
              <p className="text-sm text-muted-foreground">Edit listings, check views, and update sale status.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/sell')} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Available</p><p className="text-2xl font-bold text-primary">{stats.available}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Sold</p><p className="text-2xl font-bold text-accent">{stats.sold}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Views</p><p className="text-2xl font-bold">{stats.totalViews}</p></CardContent></Card>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No listings yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create your first listing and manage it here.</p>
            <Button onClick={() => navigate('/sell')} className="mt-5">
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => {
              const isBusy = busyItemId === item.id;
              const isSold = Boolean(item.is_sold);

              return (
                <Card key={item.id} className="group overflow-hidden">
                  <CardContent className="grid gap-0 p-0 sm:grid-cols-[180px_1fr]">
                    <button
                      type="button"
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="relative aspect-[4/3] overflow-hidden bg-muted text-left sm:aspect-auto sm:min-h-full"
                    >
                      <ListingImage item={item} />
                      <Badge variant={isSold ? 'destructive' : 'default'} className="absolute left-2 top-2">
                        {isSold ? 'Sold' : 'Available'}
                      </Badge>
                    </button>

                    <div className="flex min-w-0 flex-col gap-4 p-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <button type="button" onClick={() => navigate(`/item/${item.id}`)} className="min-w-0 text-left">
                            <h2 className="line-clamp-2 text-base font-semibold leading-snug hover:text-primary">{item.title}</h2>
                          </button>
                          <p className="shrink-0 text-lg font-bold text-primary">₹{Number(item.price || 0).toLocaleString()}</p>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.views || 0} views</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(item.created_at).toLocaleDateString('en-IN')}</span>
                          <span>{formatCondition(item.condition)}</span>
                          {item.location && <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5" /><span className="truncate">{item.location}</span></span>}
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/item/${item.id}`)} disabled={isBusy}>
                          <Eye className="mr-1.5 h-4 w-4" /> View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/edit-item/${item.id}`)} disabled={isBusy}>
                          <Edit className="mr-1.5 h-4 w-4" /> Edit
                        </Button>
                        <Button size="sm" variant={isSold ? 'secondary' : 'default'} onClick={() => toggleSoldStatus(item.id, isSold)} disabled={isBusy}>
                          {isSold ? <RotateCcw className="mr-1.5 h-4 w-4" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
                          {isSold ? 'Relist' : 'Sold'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)} disabled={isBusy}>
                          <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyListings;
