import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

interface PWAHeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  showMore?: boolean;
  onSearchClick?: () => void;
  onMoreClick?: () => void;
  rightContent?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}

const PWAHeader: React.FC<PWAHeaderProps> = ({
  title,
  showBack = true,
  showSearch = false,
  showNotification = false,
  showMore = false,
  onSearchClick,
  onMoreClick,
  rightContent,
  transparent = false,
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // If we came from somewhere, go back. Otherwise go home.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full safe-area-top",
        transparent
          ? "bg-transparent"
          : "bg-background/95 backdrop-blur-md border-b border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-full hover:bg-muted/80 active:scale-95 transition-all flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              className="h-9 w-9 rounded-full hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          {showNotification && <NotificationBell variant="icon" />}
          {showMore && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoreClick}
              className="h-9 w-9 rounded-full hover:bg-muted/80 active:scale-95 transition-all"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
};

export default PWAHeader;
