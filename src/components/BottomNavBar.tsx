import { Home, MessageCircle, PlusCircle, ShoppingBag, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/my-chats", icon: MessageCircle, label: "Chats" },
  { to: "/sell", icon: PlusCircle, label: "Sell" },
  { to: "/my-orders", icon: ShoppingBag, label: "Orders" },
  { to: "/pwa-profile", icon: User, label: "Me" },
];

const BottomNavBar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to === "/dashboard" && location.pathname === "/");
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200",
                "active:scale-95 touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center",
                item.to === "/sell" && "mb-1"
              )}>
                {item.to === "/sell" ? (
                  <div className={cn(
                    "w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-primary/90 text-primary-foreground hover:bg-primary"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                ) : (
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isActive && "scale-110"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium mt-1 transition-all duration-200",
                item.to === "/sell" && "-mt-1",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
