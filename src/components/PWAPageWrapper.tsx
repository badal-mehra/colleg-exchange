import React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PWAPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Wrapper component for PWA pages that ensures proper spacing
 * and native app-like behavior with safe areas
 */
const PWAPageWrapper: React.FC<PWAPageWrapperProps> = ({
  children,
  className,
  noPadding = false,
  title,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        "pb-20", // Space for bottom nav
        className
      )}
    >
      {/* Header */}
      {(title || showBack || rightAction) && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-top">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left - Back button */}
            <div className="flex-1 flex items-center">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-foreground" />
                </button>
              )}
            </div>

            {/* Center - Title */}
            {title && (
              <h1 className="text-base font-semibold text-foreground truncate">
                {title}
              </h1>
            )}

            {/* Right - Action */}
            <div className="flex-1 flex items-center justify-end">
              {rightAction}
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <div className={cn(!noPadding && !title && "px-4")}>
        {children}
      </div>
    </div>
  );
};

export default PWAPageWrapper;
