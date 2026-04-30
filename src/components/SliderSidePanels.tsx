import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Home,
  Camera,
  Heart,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

/* ==================== ANIMATION INJECTOR ==================== */
const AnimationStyles = (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(2deg); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
      50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes iconPop {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .animate-glow-pulse { animation: glowPulse 2s ease-in-out infinite; }
    .animate-gradient { background-size: 200% 200%; animation: gradientShift 3s ease infinite; }
    .animate-icon-pop { animation: iconPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .card-shine::after {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
      transform: rotate(-45deg);
      opacity: 0;
      transition: all 0.5s;
    }
    .card-shine:hover::after {
      opacity: 1;
      transform: translateX(100%) rotate(-45deg);
    }
    .like-button {
      transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.27);
    }
    .like-button:hover {
      transform: scale(1.2);
    }
    .like-button:active {
      transform: scale(0.9);
    }
  `}</style>
);

/* ==================== ACTION CARD TYPES ==================== */
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default" | "instagram";
}

/* ==================== MODERN GLASSMORPHISM CARD ==================== */
const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = "default",
}) => {
  const isPrimary = variant === "primary";
  const isInstagram = variant === "instagram";

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex-1 w-full text-left p-[18px] rounded-2xl border overflow-hidden
        transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]
        backdrop-blur-2xl shadow-2xl
        ${
          isPrimary
            ? "bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white border-white/30 animate-glow-pulse"
            : isInstagram
            ? "bg-gradient-to-br from-[#F9A8D4] via-[#C084FC] to-[#F97316] text-white border-pink-300/60 animate-gradient"
            : "bg-white/70 dark:bg-zinc-800/70 border-white/40 dark:border-zinc-700/40 hover:border-violet-400/60"
        }
        card-shine
      `}
    >
      {/* Floating decorative blob */}
      {isPrimary && (
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-3xl pointer-events-none animate-float" />
      )}
      {isInstagram && (
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-orange-300/20 blur-3xl pointer-events-none animate-float" style={{ animationDelay: "1s" }} />
      )}

      {/* Live badge for primary */}
      {isPrimary && (
        <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-300" />
          </span>
          LIVE
        </span>
      )}

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          {/* Animated icon container */}
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              transition-all duration-300 group-hover:scale-110 group-hover:rotate-6
              group-hover:shadow-lg
              ${
                isPrimary
                  ? "bg-white/20 text-white shadow-white/10"
                  : isInstagram
                  ? "bg-white/20 text-white"
                  : "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20"
              }
              animate-icon-pop
            `}
          >
            {icon}
          </div>
          <ArrowUpRight
            className={`
              w-5 h-5 transition-all duration-300 group-hover:translate-x-1.5 group-hover:-translate-y-1.5
              ${isPrimary || isInstagram ? "text-white/70" : "text-zinc-400 group-hover:text-violet-500"}
            `}
          />
        </div>

        <div>
          <div className="font-bold text-[15px] tracking-tight leading-snug">
            {title}
          </div>
          <div
            className={`
              text-xs mt-2 leading-relaxed
              ${isPrimary || isInstagram ? "text-white/75" : "text-zinc-500 dark:text-zinc-400"}
            `}
          >
            {description}
          </div>
        </div>

        {/* Instagram: follower badge with interactive like */}
        {isInstagram && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-semibold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              🔥 24.5K followers
            </span>
            <span className="like-button">
              <Heart className="w-4 h-4 text-red-300 fill-red-300" />
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

/* ==================== SIDEBAR PANEL ==================== */
const RightPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col gap-5 w-full h-full">
      {AnimationStyles}

      {/* Stylish heading with animated sparkle */}
      <div className="flex items-center gap-3 px-1">
        <div className="relative p-2 rounded-xl bg-violet-100 dark:bg-violet-500/20 group">
          <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-300 transition-transform group-hover:scale-125 group-hover:rotate-12" />
          <span className="absolute inset-0 rounded-xl bg-violet-400 opacity-0 group-hover:opacity-20 transition-opacity" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Quick Moves
        </h3>
      </div>

      {/* Primary: Sell in 60s */}
      <ActionCard
        variant="primary"
        icon={
          <Zap className="w-6 h-6" />
        }
        title="Sell in 60s"
        description="Snap, list & reach students instantly"
        onClick={() => navigate("/sell")}
      />

      {/* PG Finder */}
      <ActionCard
        icon={
          <Home className="w-6 h-6" />
        }
        title="Find a PG"
        description="Budget-friendly stays near campus"
        onClick={() => navigate("/browse?tab=pg")}
      />

      {/* Instagram vibe: "Follow the fam" */}
      <ActionCard
        variant="instagram"
        icon={
          <Camera className="w-6 h-6" />
        }
        title="Follow the fam"
        description="Exclusive deals & BTS in stories"
        onClick={() => window.open("https://instagram.com/campusgram", "_blank")}
      />
    </aside>
  );
};

/* ==================== LAYOUT ==================== */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem] gap-7 items-stretch py-8">
      {/* Main content glassmorphism */}
      <div className="min-w-0 rounded-3xl overflow-hidden shadow-2xl border border-white/30 dark:border-zinc-800/30 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl">
        {children}
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };
export default SliderSidePanels;
