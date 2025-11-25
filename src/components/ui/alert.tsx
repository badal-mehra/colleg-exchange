import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Define the colors and styles for the 5 modern alert states
const alertVariants = cva(
  "relative w-full rounded-lg border-l-4 p-4 text-sm shadow-md transition-colors duration-200 flex items-start space-x-3", // Added flex container and spacing
  {
    variants: {
      variant: {
        // Default - Neutral/Muted
        default: "bg-muted/30 border-muted-foreground/50 text-foreground",

        // Info - Blue
        info: "bg-blue-50/70 border-blue-600 text-blue-900 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-200",

        // Success - Green
        success: "bg-green-50/70 border-green-600 text-green-900 dark:bg-green-950/40 dark:border-green-400 dark:text-green-200",

        // Warning - Yellow/Amber
        warning: "bg-amber-50/70 border-amber-600 text-amber-900 dark:bg-amber-950/40 dark:border-amber-400 dark:text-amber-200",

        // Destructive - Red
        destructive: "bg-red-50/70 border-red-600 text-red-900 dark:bg-red-950/40 dark:border-red-400 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Define props to include an optional Icon component
interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  Icon?: React.ElementType; // Icon component prop
}

const Alert = React.forwardRef<
  HTMLDivElement,
  AlertProps
>(({ className, variant, Icon, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {/* Render the Icon if provided */}
    {Icon && (
      // Icon sizing and alignment container
      <div className="flex-shrink-0 pt-0.5"> 
        <Icon className="w-5 h-5" /> 
      </div>
    )}
    
    {/* Content Wrapper to maintain structure and alignment */}
    <div className="flex-grow">
        {children}
    </div>
  </div>
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4 ref={ref} className={cn("mb-1 text-base font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    // We use a <p> tag for the description content directly for better semantics
    <p ref={ref} className={cn("text-sm opacity-90 [&_p]:leading-snug", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, type AlertProps };import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Define the colors and styles for the 5 modern alert states
const alertVariants = cva(
  "relative w-full rounded-lg border-l-4 p-4 text-sm shadow-md transition-colors duration-200 flex items-start space-x-3", // Added flex container and spacing
  {
    variants: {
      variant: {
        // Default - Neutral/Muted
        default: "bg-muted/30 border-muted-foreground/50 text-foreground",

        // Info - Blue
        info: "bg-blue-50/70 border-blue-600 text-blue-900 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-200",

        // Success - Green
        success: "bg-green-50/70 border-green-600 text-green-900 dark:bg-green-950/40 dark:border-green-400 dark:text-green-200",

        // Warning - Yellow/Amber
        warning: "bg-amber-50/70 border-amber-600 text-amber-900 dark:bg-amber-950/40 dark:border-amber-400 dark:text-amber-200",

        // Destructive - Red
        destructive: "bg-red-50/70 border-red-600 text-red-900 dark:bg-red-950/40 dark:border-red-400 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Define props to include an optional Icon component
interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  Icon?: React.ElementType; // Icon component prop
}

const Alert = React.forwardRef<
  HTMLDivElement,
  AlertProps
>(({ className, variant, Icon, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {/* Render the Icon if provided */}
    {Icon && (
      // Icon sizing and alignment container
      <div className="flex-shrink-0 pt-0.5"> 
        <Icon className="w-5 h-5" /> 
      </div>
    )}
    
    {/* Content Wrapper to maintain structure and alignment */}
    <div className="flex-grow">
        {children}
    </div>
  </div>
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4 ref={ref} className={cn("mb-1 text-base font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    // We use a <p> tag for the description content directly for better semantics
    <p ref={ref} className={cn("text-sm opacity-90 [&_p]:leading-snug", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, type AlertProps };
