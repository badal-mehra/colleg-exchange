import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Home, ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default";
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = "default",
}) => {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { 
          opacity: 1, 
          y: 0, 
          transition: { type: "spring", stiffness: 300, damping: 24 } 
        },
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative flex-1 min-h-[110px] w-full text-left p-5 rounded-2xl border overflow-hidden ${
        isPrimary
          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/50 shadow-[0_8px_30px_rgb(var(--primary)/0.24)]"
          : "bg-card/40 backdrop-blur-md text-card-foreground border-border/40 hover:border-primary/30 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/5"
      }`}
    >
      {/* Primary Card Ambient Glow */}
      {isPrimary && (
        <>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl pointer-events-none group-hover:bg-white/30 transition-colors duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </>
      )}

      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors duration-300 ${
              isPrimary
                ? "bg-white/20 text-primary-foreground backdrop-blur-sm"
                : "bg-muted/50 text-foreground group-hover:bg-primary/10 group-hover:text-primary"
            }`}
          >
            {icon}
          </div>
          <ArrowUpRight
            className={`w-4 h-4 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${
              isPrimary
                ? "text-primary-foreground/70 group-hover:text-primary-foreground"
                : "text-muted-foreground/50 group-hover:text-primary"
            }`}
          />
        </div>
        
        <div className="space-y-1.5">
          <h4 className="font-semibold text-[15px] tracking-tight leading-none">
            {title}
          </h4>
          <p
            className={`text-[13px] leading-snug font-medium ${
              isPrimary ? "text-primary-foreground/80" : "text-muted-foreground/80"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

const RightPanel: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "sell",
      variant: "primary" as const,
      icon: <Zap className="w-5 h-5" />,
      title: "Sell in 60 seconds",
      description: "Snap, list & reach students instantly",
      path: "/sell",
    },
    {
      id: "pg",
      variant: "default" as const,
      icon: <Home className="w-5 h-5" />,
      title: "Find a PG",
      description: "Budget-friendly stays near campus",
      path: "/browse?tab=pg",
    },
    {
      id: "verify",
      variant: "default" as const,
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Verified sellers",
      description: "KYC-checked, safe transactions",
      path: "/browse",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-full h-full">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-2 pb-4"
      >
        <div className="p-1 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
          Quick Actions
        </h3>
      </motion.div>

      {/* Cards Container */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.15 },
          },
        }}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3 flex-1"
      >
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            variant={action.variant}
            icon={action.icon}
            title={action.title}
            description={action.description}
            onClick={() => navigate(action.path)}
          />
        ))}
      </motion.div>
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-stretch py-8">
      
      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-w-0 rounded-3xl overflow-hidden shadow-sm border border-border/40 bg-card/50 backdrop-blur-3xl"
      >
        {children}
      </motion.div>
      
      {/* Right Sidebar */}
      <div className="pt-2">
        <RightPanel />
      </div>
      
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };
export default SliderSidePanels;
