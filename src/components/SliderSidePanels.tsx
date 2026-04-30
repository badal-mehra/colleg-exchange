import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Home, Camera, ArrowUpRight, Sparkles } from "lucide-react";

// ---------- Micro-animations injected via Tailwind arbitrary values ----------
const animationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
    50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.7); }
  }
  .animate-float {
    animation: float 4s ease-in-out infinite;
  }
  .animate-glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite;
  }
`;

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default" | "instagram";
}

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
    <>
      <style>{animationStyles}</style>
      <button
        onClick={onClick}
        className={`group relative flex-1 w-full text-left p-5 rounded-2xl border overflow-hidden transition-all duration-500
          ${
            isPrimary
              ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-violet-400/50 shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 hover:-translate-y-1"
              : isInstagram
              ? "bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 text-white border-pink-400/60 shadow-xl shadow-pink-500/20 hover:shadow-2xl hover:shadow-pink-500/40 hover:-translate-y-1"
              : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-white/40 dark:border-zinc-700/60 hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5"
          }
        `}
      >
        {/* Decorative background blobs */}
        {isPrimary && (
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-3xl pointer-events-none animate-float" />
        )}
        {isInstagram && (
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-orange-400/20 blur-3xl pointer-events-none animate-float" style={{ animationDelay: "0.5s" }} />
        )}

        {/* Live pulse dot for primary */}
        {isPrimary && (
          <span className="absolute top-3 right-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white" />
          </span>
        )}

        <div className="relative z-10 flex flex-col h-full justify-between gap-3">
          <div className="flex items-start justify-between">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                ${
                  isPrimary
                    ? "bg-white/20 text-white"
                    : isInstagram
                    ? "bg-white/20 text-white"
                    : "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-300 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20"
                }
              `}
            >
              {icon}
            </div>
            <ArrowUpRight
              className={`w-4 h-4 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1
                ${isPrimary || isInstagram ? "text-white/70" : "text-zinc-400 group-hover:text-violet-500"}
              `}
            />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">{title}</div>
            <div className={`text-xs mt-1.5 leading-relaxed ${
              isPrimary || isInstagram ? "text-white/80" : "text-zinc-500 dark:text-zinc-400"
            }`}>
              {description}
            </div>
          </div>

          {/* Instagram: follower count badge */}
          {isInstagram && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                📈 24.5K followers
              </span>
            </div>
          )}
        </div>
      </button>
    </>
  );
};

const RightPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-full h-full">
      {/* Stylish heading */}
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-300" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          Quick Moves
        </h3>
      </div>

      <ActionCard
        variant="primary"
        icon={<Zap className="w-5 h-5" />}
        title="Sell in 60s"
        description="Snap, list & reach students instantly"
        onClick={() => navigate("/sell")}
      />

      <ActionCard
        icon={<Home className="w-5 h-5" />}
        title="Find a PG"
        description="Budget-friendly stays near campus"
        onClick={() => navigate("/browse?tab=pg")}
      />

      <ActionCard
        variant="instagram"
        icon={
          <div className="relative">
            <Camera className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border-2 border-white" />
          </div>
        }
        title="Follow the fam"
        description="Exclusive content & deals in stories"
        onClick={() => window.open("https://instagram.com/campusgram", "_blank")}
      />
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-stretch py-6">
      <div className="min-w-0 rounded-2xl overflow-hidden shadow-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl">
        {children}
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };
export default SliderSidePanels;
