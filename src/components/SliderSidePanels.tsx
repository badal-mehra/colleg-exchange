import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowUpRight, Sparkles, UserPlus, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "glass";
  className?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = "glass",
  className = "",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white border-white/10 shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)]";
      case "secondary":
        return "bg-zinc-900 text-white border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 shadow-lg";
      default:
        return "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border-black/5 dark:border-white/10 text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 shadow-sm";
    }
  };

  const isPrimary = variant === "primary";

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, scale: 0.95, y: 15 },
        show: { 
          opacity: 1, 
          scale: 1,
          y: 0, 
          transition: { type: "spring", stiffness: 400, damping: 30 } 
        },
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-6 rounded-3xl border overflow-hidden transition-all duration-300 w-full text-left ${getVariantStyles()} ${className}`}
    >
      {/* Grainy overlay for that modern aesthetic */}
      {isPrimary && (
        <div 
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      )}

      {/* Ambient glow blobs */}
      {isPrimary && (
        <>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/30 blur-3xl rounded-full transition-transform duration-700 group-hover:scale-150" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-400/40 blur-3xl rounded-full transition-transform duration-700 group-hover:scale-150" />
        </>
      )}

      <div className="relative z-10 flex items-start justify-between w-full mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:rotate-6 ${
            isPrimary
              ? "bg-white/20 text-white backdrop-blur-md border border-white/20"
              : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-900 dark:text-white border border-black/5 dark:border-white/5"
          }`}
        >
          {icon}
        </div>
        <div className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-45 ${
          isPrimary ? "bg-white/10 text-white" : "bg-black/5 dark:bg-white/5 text-foreground"
        }`}>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
      
      <div className="relative z-10 space-y-1.5">
        <h4 className="font-bold text-lg tracking-tight leading-none">
          {title}
        </h4>
        <p className={`text-sm font-medium leading-relaxed ${
          isPrimary ? "text-white/90" : "text-muted-foreground"
        }`}>
          {description}
        </p>
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
      icon: <Flame className="w-6 h-6" />,
      title: "Drop a Listing",
      description: "Secure the bag. Sell your stuff in 60s flat.",
      path: "/sell",
      className: "h-[180px]" // Bigger bento block for primary action
    },
    {
      id: "follow",
      variant: "secondary" as const,
      icon: <UserPlus className="w-6 h-6" />,
      title: "Campus Connect",
      description: "Follow the drippiest sellers & catch the vibe.",
      path: "/creators",
    },
    {
      id: "pg",
      variant: "glass" as const,
      icon: <Home className="w-6 h-6" />,
      title: "Find a Base",
      description: "Aesthetic PGs & flats near your college.",
      path: "/browse?tab=pg",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-full h-full">
      {/* Vercel-like Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-between px-1 pb-5"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 to-orange-500">
            <Sparkles className="w-3 h-3 text-white" />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20" />
          </div>
          <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-foreground">
            Explore
          </h3>
        </div>
      </motion.div>

      {/* Bento Grid Container */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.1 },
          },
        }}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 flex-1"
      >
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            variant={action.variant}
            icon={action.icon}
            title={action.title}
            description={action.description}
            onClick={() => navigate(action.path)}
            className={action.className}
          />
        ))}
      </motion.div>
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  // Dotted background for that ultimate dev tool aesthetic
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] gap-8 items-stretch py-8">
      
      {/* Main App Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
        className="min-w-0 rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl"
      >
        {children}
      </motion.div>
      
      {/* Bento Sidebar */}
      <div className="pt-2">
        <RightPanel />
      </div>
      
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };
export default SliderSidePanels;
