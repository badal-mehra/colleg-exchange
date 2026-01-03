import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Trophy,
  Package,
  Heart,
  ClipboardList,
  Shield,
  LogOut,
  ChevronRight,
  Star,
  Loader2,
  Home,
  Settings,
  HelpCircle,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  points: number | null;
  is_verified: boolean | null;
  mck_id: string | null;
  deals_completed: number | null;
  average_rating: number | null;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
  action?: () => void;
  badge?: string | number;
  rightElement?: React.ReactNode;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const PWAProfile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch profile
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, university, points, is_verified, mck_id, deals_completed, average_rating")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  // Check dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const menuSections: MenuSection[] = [
    {
      title: "Listings",
      items: [
        {
          icon: Package,
          label: "My Listings",
          description: "Manage your items for sale",
          path: "/my-listings",
        },
        {
          icon: Home,
          label: "My PG Listings",
          description: "Manage your PG/Room listings",
          path: "/my-pg-listings",
        },
        {
          icon: Heart,
          label: "Saved Items",
          description: "Your wishlisted items",
          path: "/my-cart",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          description: "Update your info & photo",
          path: "/profile",
        },
        {
          icon: Shield,
          label: "KYC Verification",
          description: profile?.is_verified ? "Verified ✓" : "Verify your identity",
          path: "/kyc",
          badge: profile?.is_verified ? undefined : "Required",
        },
        {
          icon: ClipboardList,
          label: "My Reports",
          description: "View submitted reports",
          path: "/my-reports",
        },
      ],
    },
    {
      title: "More",
      items: [
        {
          icon: Trophy,
          label: "Leaderboard",
          description: "Top campus sellers",
          path: "/leaderboard",
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage notification settings",
          path: "/profile",
        },
        {
          icon: darkMode ? Sun : Moon,
          label: "Dark Mode",
          description: darkMode ? "Switch to light theme" : "Switch to dark theme",
          rightElement: (
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
              className="ml-auto"
            />
          ),
        },
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "FAQ and contact us",
          path: "/help",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background">
        <div className="px-5 pt-8 pb-6">
          {/* Avatar & Info */}
          <div className="flex items-center gap-4 mb-5">
            <Avatar
              className="h-20 w-20 ring-4 ring-background shadow-xl cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate("/profile")}
            >
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate text-foreground">
                {profile?.full_name || "User"}
              </h1>
              {profile?.mck_id && (
                <p className="text-sm text-muted-foreground font-medium">
                  @{profile.mck_id}
                </p>
              )}
              {profile?.university && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {profile.university}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border/50">
              <p className="text-xl font-bold text-foreground">
                {profile?.points || 0}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Points</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border/50">
              <p className="text-xl font-bold text-foreground">
                {profile?.deals_completed || 0}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Deals</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border/50">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <p className="text-xl font-bold text-foreground">
                  {profile?.average_rating?.toFixed(1) || "N/A"}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">Rating</p>
            </div>
          </div>

          {/* Verification Badge */}
          {profile?.is_verified && (
            <div className="mt-4 flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-2 rounded-lg">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Verified Student</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 py-4 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              {section.title}
            </h2>
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => item.path ? navigate(item.path) : item.action?.()}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left transition-colors",
                      "hover:bg-muted/50 active:bg-muted",
                      item.rightElement && "cursor-default hover:bg-transparent"
                    )}
                    disabled={!!item.rightElement}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{item.label}</p>
                        {item.badge && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.rightElement || (
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive rounded-xl"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          MyCampusKart v1.0.0
        </p>
      </div>
    </div>
  );
};

export default PWAProfile;
