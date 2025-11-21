import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Base classes: slightly adjusted padding, more modern rounded corners
  "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Subtle Gradient with Focus on Depth
        default: "bg-gradient-to-r from-primary/95 to-primary text-primary-foreground shadow-sm hover:shadow-md",
        
        // Solid, Clean Secondary
        secondary: "bg-secondary text-secondary-foreground border border-secondary-hover/50 hover:bg-secondary/80",
        
        // Darkened Destructive for Professional Alert
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        
        // Premium Outline with Subtle Background
        outline: "text-foreground border border-border bg-background/80 hover:bg-background/95",
        
        // Success: Refined Green Gradient
        success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm hover:from-emerald-600 hover:to-green-700",
        
        // Warning: Deeper Amber/Orange
        warning: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm hover:from-amber-600 hover:to-orange-700",
        
        // Info: Lighter, more vibrant Blue
        info: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm hover:from-blue-600 hover:to-cyan-700",
        
        // Premium: Sleek, high-contrast Purple/Pink/Gold shimmer effect
        premium: "bg-gradient-to-r from-purple-700 via-pink-600 to-red-500 text-white shadow-lg hover:shadow-xl",
        
        // Verified: Subtle Teal/Blue Gradient
        verified: "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-sm",
        
        // Online/Status: Small, vibrant dot appearance
        online: "bg-emerald-500 text-white h-2.5 w-2.5 p-0 rounded-full animate-pulse", // Specialized look for status indicators
        
        // New: Ghost - for a very minimal, hover-enhanced look
        ghost: "text-foreground bg-transparent hover:bg-muted border border-transparent hover:border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tooltip?: string;
  showTooltip?: boolean;
  iconOnly?: boolean;
}

function Badge({ className, variant, tooltip, showTooltip = true, iconOnly = false, children, ...props }: BadgeProps) {
  // Logic for the 'online' variant to only render the small dot
  const isOnlineVariant = variant === 'online';
  
  // If it's the online variant, it's always iconOnly (a dot) and should ignore text children
  const badgeChildren = isOnlineVariant ? null : children;

  const badge = (
    // Conditional className for online variant to ensure it's a small dot
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {badgeChildren}
    </div>
  );

  // Always show tooltip if tooltip prop is provided or if iconOnly mode
  // The 'online' variant should also have a tooltip
  if ((showTooltip && tooltip) || (iconOnly && typeof children === 'string') || isOnlineVariant) {
    // If online variant, the tooltip should be "Online" or the provided tooltip
    const tooltipText = tooltip || (isOnlineVariant ? 'Online' : (typeof children === 'string' ? children : ''));
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* The trigger itself is the badge */}
            <div className={cn(badgeVariants({ variant }), className)} {...props}>
              {badgeChildren}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export { Badge, badgeVariants };
