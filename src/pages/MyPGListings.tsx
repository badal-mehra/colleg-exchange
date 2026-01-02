import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Plus, MoreVertical, Eye, Pencil, Pause, Play, Trash2,
  Home, MapPin, Users, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/mycampuskart-logo.png';

interface PGListing {
  id: string;
  property_type: string;
  for_gender: string;
  sharing_type: string;
  rent_per_month: number;
  area_locality: string;
  images: string[];
  views: number;
  is_active: boolean;
  status: string;
  created_at: string;
}

const getThumb = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_200,h_150,c_fill/');
  }
  return url;
};

const MyPGListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PGListing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('pg_listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching PG listings:', error);
      toast({ title: 'Error', description: 'Failed to load listings', variant: 'destructive' });
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const handleToggleActive = async (listing: PGListing) => {
    setActionLoading(listing.id);
    const newStatus = !listing.is_active;
    
    const { error } = await supabase
      .from('pg_listings')
      .update({ is_active: newStatus })
      .eq('id', listing.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update listing', variant: 'destructive' });
    } else {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: newStatus } : l));
      toast({ title: 'Success', description: newStatus ? 'Listing activated' : 'Listing paused' });
    }
    setActionLoading(null);
  };

  const handleMarkRented = async (listing: PGListing) => {
    setActionLoading(listing.id);
    
    const { error } = await supabase
      .from('pg_listings')
      .update({ status: 'rented', is_active: false })
      .eq('id', listing.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update listing', variant: 'destructive' });
    } else {
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'rented', is_active: false } : l));
      toast({ title: 'Success', description: 'Listing marked as rented' });
    }
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!selectedListing) return;
    setActionLoading(selectedListing.id);
    
    const { error } = await supabase
      .from('pg_listings')
      .delete()
      .eq('id', selectedListing.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete listing', variant: 'destructive' });
    } else {
      setListings(prev => prev.filter(l => l.id !== selectedListing.id));
      toast({ title: 'Deleted', description: 'Listing removed successfully' });
    }
    setDeleteDialogOpen(false);
    setSelectedListing(null);
    setActionLoading(null);
  };

  const propertyLabels: Record<string, string> = { pg: 'PG', room: 'Room', hostel: 'Hostel', flat: 'Flat' };
  const genderLabels: Record<string, string> = { boys: 'Boys', girls: 'Girls', both: 'Co-ed' };
  const sharingLabels: Record<string, string> = { single: 'Single', double: 'Double', triple: 'Triple', any: 'Any' };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">My PG Listings</h1>
          </div>
          <img src={logo} alt="Logo" className="h-8" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Create New Button */}
        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={() => navigate('/sell?type=pg')}
        >
          <Plus className="h-4 w-4 mr-2" /> Create New PG Listing
        </Button>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Home className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">You haven't listed any PG/Rooms yet</p>
            <Button variant="outline" onClick={() => navigate('/sell?type=pg')}>
              Create Your First Listing
            </Button>
          </div>
        )}

        {/* Listings Grid */}
        <div className="space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  {/* Thumbnail */}
                  <div 
                    className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => navigate(`/pg/${listing.id}`)}
                  >
                    <img
                      src={listing.images[0] ? getThumb(listing.images[0]) : '/placeholder.svg'}
                      alt="PG"
                      className="w-full h-full object-cover"
                    />
                    {!listing.is_active && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {listing.status === 'rented' ? 'Rented' : 'Paused'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {propertyLabels[listing.property_type] || listing.property_type}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              listing.for_gender === 'boys' ? 'bg-blue-100 text-blue-700' :
                              listing.for_gender === 'girls' ? 'bg-pink-100 text-pink-700' :
                              'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {genderLabels[listing.for_gender] || listing.for_gender}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">₹{listing.rent_per_month.toLocaleString()}/mo</p>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {listing.area_locality}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{sharingLabels[listing.sharing_type] || listing.sharing_type}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {listing.views || 0}
                          </span>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {actionLoading === listing.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/pg/${listing.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/sell?type=pg&edit=${listing.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(listing)}>
                            {listing.is_active ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" /> Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          {listing.status !== 'rented' && (
                            <DropdownMenuItem onClick={() => handleMarkRented(listing)}>
                              <Users className="h-4 w-4 mr-2" /> Mark as Rented
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedListing(listing);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your PG listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPGListings;