import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
  User,
  Trophy,
  Package,
  Heart,
  ClipboardList,
  Shield,
  Flag,
  LogOut,
  ChevronRight,
  Settings,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  points: number | null;
  is_verified: boolean | null;
  mck_id: string | null;
}

const PWAProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, university, points, is_verified, mck_id")
        .eq("user_id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    {
      icon: User,
      label: "Edit Profile",
      description: "Update your personal info",
      path: "/profile",
    },
    {
      icon: Package,
      label: "My Listings",
      description: "View and manage your items",
      path: "/my-listings",
    },
    {
      icon: Heart,
      label: "My Cart",
      description: "Your saved favorites",
      path: "/my-cart",
    },
    {
      icon: Trophy,
      label: "Leaderboard",
      description: "See top sellers",
      path: "/leaderboard",
    },
    {
      icon: ClipboardList,
      label: "My Reports",
      description: "View submitted reports",
      path: "/my-reports",
    },
    {
      icon: Shield,
      label: "KYC Verification",
      description: "Verify your identity",
      path: "/kyc",
    },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Not Signed In</h2>
        <p className="text-muted-foreground text-center mb-6">
          Sign in to access your profile and settings
        </p>
        <Button onClick={() => navigate("/auth")} className="w-full max-w-xs">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pt-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              {profile?.full_name || "User"}
            </h1>
            {profile?.mck_id && (
              <p className="text-sm text-muted-foreground">
                @{profile.mck_id}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {profile?.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {profile?.points !== null && profile.points > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  {profile.points} pts
                </Badge>
              )}
            </div>
          </div>
        </div>
        {profile?.university && (
          <p className="text-sm text-muted-foreground mt-3 truncate">
            {profile.university}
          </p>
        )}
      </div>

      {/* Menu Items */}
      <div className="p-4">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </button>
                {index < menuItems.length - 1 && (
                  <Separator className="mx-4" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Sign Out Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          MyCampusKart v1.0.0
        </p>
      </div>
    </div>
  );
};

export default PWAProfile;
