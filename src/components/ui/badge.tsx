import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-md hover:scale-105 border border-primary/20",
        secondary: "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:shadow-md hover:scale-105 border border-secondary/20",
        destructive: "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground hover:shadow-md hover:scale-105 border border-destructive/20",
        outline: "text-foreground border-2 border-border hover:bg-accent hover:shadow-md hover:scale-105",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-md hover:scale-105 border border-green-400/20",
        warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-md hover:scale-105 border border-amber-400/20",
        info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md hover:scale-105 border border-blue-400/20",
        premium: "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 border border-purple-400/30 animate-pulse-slow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
