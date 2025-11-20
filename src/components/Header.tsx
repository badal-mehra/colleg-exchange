// src/components/Header.tsx (Final Version)

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, User, LogOut, Heart, MessageCircle, ShoppingBag, Package, Trophy, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/mycampuskart-logo.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  full_name: string;
  avatar_url: string | null;
}

const Header = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 🔥 FIX 1: Fetch profile and admin status only once when user is available (on initial load)
  const fetchHeaderData = React.useCallback(async () => {
    if (!user) return;
    
    // Fetch Profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Check Admin Status
    const { data: adminData } = await supabase.rpc('is_admin', { user_id: user.id });
    if (adminData) {
      setIsAdmin(true);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      fetchHeaderData();
    }
  }, [user, fetchHeaderData]); // user dependency ensures fetch happens after login/session resolve

  const handleLogout = async () => {
    await signOut();
    toast({
        title: "Logged Out",
        description: "You have been securely logged out.",
    });
    navigate('/home');
  };

  return (
    <header className="border-b glass-effect sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src={logo} 
                alt="MyCampusKart" 
                className="h-10 sm:h-12 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              />
            </div>
            <Button size="sm" onClick={() => navigate('/sell')} className="lg:hidden bg-gradient-to-r from-primary to-primary/80 hover-scale">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation Menu (Static and persistent) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <Button variant="outline" size="sm" onClick={() => navigate('/my-chats')} className="hover-scale shrink-0">
              <MessageCircle className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">My Chats</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-orders')} className="hover-scale shrink-0">
              <ShoppingBag className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Orders</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-cart')} className="hover-scale shrink-0">
              <Heart className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">My Cart</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-listings')} className="hover-scale shrink-0">
              <Package className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">My Items</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/leaderboard')} className="hover-scale shrink-0">
              <Trophy className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Leaderboard</span>
            </Button>
            {/* Profile Button (Conditional Rendering based on Auth) */}
            {user ? (
                <>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="hover-scale gap-2 shrink-0">
                    {profile?.avatar_url ? <Avatar className="h-4 w-4 lg:h-5 lg:w-5">
                        <AvatarImage src={`${supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}`} alt={profile.full_name} />
                        <AvatarFallback className="text-xs">{profile.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar> : <User className="h-4 w-4" />}
                    <span className="hidden lg:inline">Profile</span>
                  </Button>
                  {isAdmin && <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="hover-scale border-primary/50 text-primary shrink-0">
                      <Shield className="h-4 w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Admin</span>
                    </Button>}
                  <Button size="sm" onClick={() => navigate('/sell')} className="hidden lg:flex bg-gradient-to-r from-primary to-primary/80 hover-scale shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Sell Item
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
                    <LogOut className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Logout</span>
                  </Button>
                </>
            ) : (
                <Button size="sm" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 shrink-0">
                    <User className="h-4 w-4 mr-2" />
                    Login
                </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
