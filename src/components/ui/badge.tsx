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
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg",
        secondary: "bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground shadow-sm",
        destructive: "bg-gradient-to-br from-destructive to-destructive/90 text-destructive-foreground shadow-md",
        outline: "text-foreground border border-border bg-background/50",
        success: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md",
        warning: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md",
        info: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md",
        premium: "bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white shadow-lg",
        verified: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md",
        online: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm",
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
  const badge = (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );

  // Always show tooltip if tooltip prop is provided or if iconOnly mode
  if ((showTooltip && tooltip) || (iconOnly && typeof children === 'string')) {
    const tooltipText = tooltip || (typeof children === 'string' ? children : '');
    const badgeContent = iconOnly && typeof children === 'string' ? null : children;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(badgeVariants({ variant }), className)} {...props}>
              {badgeContent}
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
