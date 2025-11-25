import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles: Increased border radius (rounded-lg) and added subtle scale effect on click/active
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Default: Updated for modern feel with a subtle shadow
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        // Destructive: No functional change, keeps focus on danger
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Outline: Uses primary color for a modern, high-contrast outline
        outline: "border border-primary text-primary bg-background hover:bg-primary/10 hover:text-primary",
        // Secondary: Updated for modern feel with a subtle shadow
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md",
        // Ghost: Increased hover opacity for better feedback
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        // Link: Unchanged
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Default: Slightly taller (h-10 to h-11)
        default: "h-11 px-5 py-2.5",
        // Small: Slightly taller (h-9 to h-10)
        sm: "h-10 rounded-md px-4",
        // Large: Maintained large size (h-11 to h-12)
        lg: "h-12 rounded-xl px-10",
        // Icon: Matched default height
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
