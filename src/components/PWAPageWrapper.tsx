import React from "react";
import { cn } from "@/lib/utils";

interface PWAPageWrapperProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * Wrapper component for PWA pages that ensures proper spacing
 * and native app-like behavior with safe areas
 */
const PWAPageWrapper: React.FC<PWAPageWrapperProps> = ({
  children,
  className,
  noPadding = false,
}) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        "pb-20", // Space for bottom nav
        !noPadding && "px-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export default PWAPageWrapper;
