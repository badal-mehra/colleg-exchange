import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-lg backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground hover:shadow-primary/50 hover:scale-105 border border-primary/30 shadow-primary/20",
        secondary: "bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 text-secondary-foreground hover:shadow-secondary/50 hover:scale-105 border border-secondary/30 shadow-secondary/20",
        destructive: "bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 text-destructive-foreground hover:shadow-destructive/50 hover:scale-105 border border-destructive/30 shadow-destructive/20",
        outline: "text-foreground border-2 border-border/50 bg-background/80 hover:bg-accent hover:shadow-lg hover:scale-105 hover:border-primary/50",
        success: "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-500 text-white hover:shadow-emerald-500/50 hover:scale-105 border border-emerald-400/40 shadow-emerald-500/20",
        warning: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-500 text-white hover:shadow-amber-500/50 hover:scale-105 border border-amber-400/40 shadow-amber-500/20",
        info: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-500 text-white hover:shadow-blue-500/50 hover:scale-105 border border-blue-400/40 shadow-blue-500/20",
        premium: "bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 text-white hover:shadow-purple-500/60 hover:scale-110 border border-purple-400/50 shadow-purple-500/30 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer",
        verified: "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 text-white hover:shadow-blue-500/50 hover:scale-105 border border-blue-400/40 shadow-blue-500/20",
        online: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border border-emerald-400/40 shadow-emerald-500/30 animate-pulse",
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
