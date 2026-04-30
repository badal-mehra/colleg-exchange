import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Home,
  ArrowUpRight,
  Sparkles,
  Heart,
  TrendingUp,
  Flame,
} from "lucide-react";
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
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`group relative flex-1 w-full text-left p-5 rounded-3xl border overflow-hidden transition-all duration-300 backdrop-blur-xl ${
        isPrimary
          ? "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 text-white border-white/10 shadow-xl shadow-purple-500/30"
          : "bg-white/60 dark:bg-zinc-900/60 border-white/10 hover:border-purple-400/40 shadow-lg hover:shadow-xl"
      }`}
    >
      {/* glow background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full gap-4">
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{ rotate: 8 }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isPrimary
                ? "bg-white/20 text-white"
                : "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 dark:from-zinc-800 dark:to-zinc-700 dark:text-purple-400"
            }`}
          >
            {icon}
          </motion.div>

          <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
        </div>

        <div>
          <div className="font-semibold text-sm tracking-tight">
            {title}
          </div>
          <div
            className={`text-xs mt-1 leading-snug ${
              isPrimary ? "text-white/90" : "text-zinc-500"
            }`}
          >
            {description}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

const RightPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Quick Actions
          </h3>
        </div>

        <TrendingUp className="w-4 h-4 text-zinc-400" />
      </div>

      {/* Cards */}
      <ActionCard
        variant="primary"
        icon={<Zap className="w-5 h-5" />}
        title="Sell in 60 sec"
        description="Post fast. Reach buyers instantly."
        onClick={() => navigate("/sell")}
      />

      <ActionCard
        icon={<Home className="w-5 h-5" />}
        title="Find PG / Room"
        description="Nearby stays. Budget friendly."
        onClick={() => navigate("/browse?tab=pg")}
      />

      <ActionCard
        icon={<Heart className="w-5 h-5" />}
        title="Follow Trending Sellers"
        description="Like Instagram. Discover popular sellers."
        onClick={() => navigate("/browse?tab=trending")}
      />

      <ActionCard
        icon={<Flame className="w-5 h-5" />}
        title="Hot Deals"
        description="Most viewed items on campus."
        onClick={() => navigate("/browse?tab=hot")}
      />
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-stretch py-6">
      
      {/* Main Content */}
      <div className="relative min-w-0 rounded-3xl overflow-hidden border border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl">
        {children}
      </div>

      {/* Right Panel */}
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };

export default SliderSidePanels;
