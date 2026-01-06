import { Home, MessageCircle, PlusCircle, ShoppingBag, User, Package, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  mck_id: string | null;
}

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadChats, pendingOrders } = useNotificationCounts();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('full_name, avatar_url, mck_id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const mainNavItems = [
    { to: "/dashboard", icon: Home, label: "Home", badge: 0 },
    { to: "/my-chats", icon: MessageCircle, label: "Messages", badge: unreadChats },
    { to: "/my-orders", icon: ShoppingBag, label: "Orders", badge: pendingOrders },
    { to: "/my-listings", icon: Package, label: "My Listings", badge: 0 },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => 
    location.pathname === path || (path === "/dashboard" && location.pathname === "/");

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-card border-r border-border">
      {/* Profile Section */}
      <div className="p-4 lg:p-6">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
          onClick={() => navigate("/pwa-profile")}
        >
          <Avatar className="h-10 w-10 lg:h-12 lg:w-12 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm lg:text-base truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.mck_id || user?.email}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Sell Button */}
      <div className="p-4">
        <Button 
          onClick={() => navigate("/sell")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Sell Item
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-muted/60",
                active 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Separator />

      {/* Bottom Actions */}
      <div className="p-3 space-y-1">
        <NavLink
          to="/pwa-profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-muted/60",
            isActive("/pwa-profile") 
              ? "bg-primary/10 text-primary font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-sm">Profile</span>
        </NavLink>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
