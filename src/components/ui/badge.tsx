import * as React from "react";
import { Check, Star, Info } from 'lucide-react';

// --- UTILITIES (Mocking external libraries for single-file execution) ---

// Utility for merging Tailwind classes
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Simplified cva (Class Variance Authority) implementation
const cva = (base, { variants, defaultVariants }) => {
  return (props) => {
    const { variant, size, ...rest } = { ...defaultVariants, ...props };
    let classes = base;

    if (variant && variants.variant && variants.variant[variant]) {
      classes = cn(classes, variants.variant[variant]);
    }
    if (size && variants.size && variants.size[size]) {
      classes = cn(classes, variants.size[size]);
    }

    return classes;
  };
};

// --- CUSTOM TOOLTIP COMPONENTS (Replacing external shadcn/ui imports) ---

const TooltipContext = React.createContext({});
const useTooltip = () => React.useContext(TooltipContext);

const TooltipProvider = ({ children }) => (
  <div className="relative inline-block">{children}</div>
);

const Tooltip = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [content, setContent] = React.useState(null);

  const contextValue = React.useMemo(() => ({
    setIsOpen,
    setContent,
    content,
    isOpen
  }), [isOpen, content]);

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      {/* TooltipContent is rendered outside the flow for absolute positioning */}
      <TooltipContent />
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = ({ children, tooltipText }) => {
  const { setIsOpen, setContent } = useTooltip();

  const handleMouseEnter = () => {
    setContent(tooltipText);
    setIsOpen(true);
  };
  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  // Clone element to inject mouse/focus handlers
  return React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
    // Note: We use the badge's position as the relative point for the tooltip
  });
};

const TooltipContent = () => {
  const { isOpen, content } = useTooltip();

  if (!isOpen || !content) return null;

  return (
    <div
      className="absolute z-50 px-3 py-1.5 text-xs text-white bg-gray-900 rounded-lg shadow-xl -mt-1 transform -translate-y-full"
      style={{ whiteSpace: 'nowrap', left: '50%', transform: 'translateX(-50%) translateY(-10px)' }}
    >
      {content}
    </div>
  );
};


// --- BADGE VARIANTS DEFINITION ---

const badgeVariants = cva(
  // Base classes: pill shape, slight shadow, modern typography, responsive margin
  "inline-flex items-center justify-center text-center whitespace-nowrap rounded-full font-semibold uppercase tracking-wider transition-all duration-300 transform active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed m-0.5",
  {
    variants: {
      variant: {
        // Primary: Deep Navy/Slate to Primary Blue Gradient with strong shadow
        default: "bg-gradient-to-br from-slate-700 to-blue-600 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:from-slate-600 hover:to-blue-700 focus:ring-blue-500/50",

        // Secondary: Light Gray background with sharp border, minimal shadow
        secondary: "bg-gray-100 text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-200 focus:ring-gray-300/50",

        // Destructive: Sharp Red with strong shadow
        destructive: "bg-red-600 text-white shadow-md shadow-red-500/40 hover:bg-red-700 focus:ring-red-500/50",

        // Outline: Floating, transparent background with border
        outline: "text-slate-700 border border-slate-300 bg-white/50 backdrop-blur-sm hover:bg-slate-50 focus:ring-slate-400/50",

        // Success: Vibrant Lime Green Gradient, text for contrast
        success: "bg-gradient-to-br from-lime-500 to-green-600 text-slate-900 shadow-lg shadow-green-500/40 hover:shadow-xl hover:from-lime-600 hover:to-green-700 focus:ring-green-500/50",

        // Warning: Deep Orange/Sunset Gradient, text for contrast
        warning: "bg-gradient-to-br from-orange-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/40 hover:shadow-xl hover:from-orange-500 hover:to-amber-600 focus:ring-amber-500/50",

        // Info: Professional Cyan/Sky Blue
        info: "bg-sky-500 text-white shadow-md shadow-sky-500/40 hover:bg-sky-600 focus:ring-sky-500/50",

        // Premium: The "Gold Card" Gradient
        premium: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-gray-900 font-bold shadow-2xl shadow-yellow-500/50 focus:ring-yellow-500/50",

        // Verified: Subtle, deep Teal
        verified: "bg-teal-600 text-white shadow-md hover:bg-teal-700 focus:ring-teal-500/50",

        // Online/Status: Small, vibrant dot appearance (Note: Padded for margin, but h/w is tiny)
        // This is styled as a separate small component, usually applied to an avatar container.
        online: "bg-emerald-500 h-3 w-3 p-0 rounded-full animate-ping-slow absolute top-0 right-0 border-2 border-white shadow-lg",

        // Ghost: Very minimal, text-only, strong hover
        ghost: "text-slate-600 bg-transparent hover:bg-slate-100 border border-transparent hover:border-slate-200 focus:ring-slate-300/50",
      },
      size: {
        sm: "h-5 px-2 text-[10px]",        // Small (e.g., table tags)
        default: "h-6 px-3 text-xs",       // Default (e.g., standard buttons)
        lg: "h-8 px-4 text-sm",            // Large (e.g., card headers)
        dot: "h-3 w-3 p-0",                // For online status dot
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tooltip?: string;
  showTooltip?: boolean;
}

// NOTE: The 'online' variant is a specialized status dot. It should be applied to an external container.
// Here we adapt the component to handle both regular badges and the specialized 'online' dot.
function Badge({ className, variant, size, tooltip, showTooltip = true, children, ...props }: BadgeProps) {

  const isStatusDot = variant === 'online';
  
  // For the status dot, we force the size and ignore children
  const effectiveSize = isStatusDot ? 'dot' : size;
  const badgeContent = isStatusDot ? null : children;
  
  // Set the final class name using cva
  const finalClass = cn(
    badgeVariants({ variant, size: effectiveSize }),
    // Status dot needs absolute positioning, others need relative/static
    isStatusDot ? 'absolute top-0 right-0' : 'relative',
    className
  );

  const badgeElement = (
    <div className={finalClass} {...props}>
      {badgeContent}
    </div>
  );
  
  // Tooltip logic
  const tooltipText = tooltip || (isStatusDot ? 'Online' : (typeof children === 'string' ? children : ''));
  const needsTooltip = (showTooltip && tooltip) || isStatusDot || (React.isValidElement(children) && typeof tooltipText === 'string');
  
  if (needsTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger tooltipText={tooltipText}>
            {/* The trigger must be the badge itself */}
            {badgeElement}
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeElement;
}

// --- DEMONSTRATION APP ---

const BadgeDemo = () => {
    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-6">Professional Badge System</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-start">
                {/* Standard Badges */}
                <div className="flex flex-col space-y-2 col-span-2">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700">Core Variants</h2>
                    <Badge variant="default" size="default">Default Project</Badge>
                    <Badge variant="secondary" size="default">v1.2.5</Badge>
                    <Badge variant="destructive" size="default">Critical Error</Badge>
                    <Badge variant="outline" size="default">Draft Pending</Badge>
                </div>
                
                {/* Semantic Badges */}
                <div className="flex flex-col space-y-2 col-span-2">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700">Status & Semantic</h2>
                    <Badge variant="success" size="default">Deployment Successful</Badge>
                    <Badge variant="warning" size="default">Pending Review</Badge>
                    <Badge variant="info" size="default">New Feature</Badge>
                    <Badge variant="ghost" size="default" tooltip="Click for details">Documentation</Badge>
                </div>

                {/* Premium & Verified Badges */}
                <div className="flex flex-col space-y-2 col-span-2">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700">Special</h2>
                    <Badge variant="premium" size="lg">
                        <Star className="w-4 h-4 mr-1 fill-gray-900" />
                        PREMIUM USER
                    </Badge>
                    <Badge variant="verified" size="default" tooltip="Account is Verified">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                    </Badge>
                    <Badge variant="default" size="sm">Small Tag</Badge>
                    <Badge variant="info" size="lg">LARGE INFO TICKET</Badge>
                </div>
            </div>

            {/* Online Status Demo */}
            <h2 className="text-xl font-semibold pt-4 border-t mt-8 text-gray-700">Online Status Dot (Hover for Tooltip)</h2>
            <div className="flex space-x-8 items-center">
                
                {/* Avatar example with online status dot */}
                <div className="relative w-16 h-16 rounded-full bg-slate-300 shadow-lg flex items-center justify-center text-white text-3xl font-bold">
                    JD
                    {/* The online badge placed absolutely on the avatar container */}
                    <Badge variant="online" tooltip="Jane Doe is Currently Online" />
                </div>
                
                {/* Another avatar example */}
                 <div className="relative w-12 h-12 rounded-full bg-blue-500 shadow-md flex items-center justify-center text-white text-xl font-bold">
                    SM
                    <Badge variant="online" tooltip="Sam Miller is Online" />
                </div>
                
                {/* A standalone badge with custom tooltip */}
                <Badge variant="default" tooltip="This is a custom tooltip text" showTooltip={true}>
                    Hover Me
                </Badge>

                {/* A badge that uses its content for tooltip */}
                <Badge variant="success" tooltip="Task Completed">
                    <Info className="w-3 h-3 mr-1" />
                    Complete
                </Badge>
                
            </div>
        </div>
    );
};

// Main App component
const App = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <style>
            {`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .animate-shimmer {
                background-size: 400% 100%;
                background-image: linear-gradient(
                    to right,
                    #fef9c3 0%,
                    #fcd34d 20%,
                    #fef9c3 40%,
                    #fcd34d 100%
                );
            }
            @keyframes ping-slow {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
            }
            .animate-ping-slow {
                animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            `}
        </style>
        <BadgeDemo />
    </div>
);

export default App;

export { Badge, badgeVariants };
