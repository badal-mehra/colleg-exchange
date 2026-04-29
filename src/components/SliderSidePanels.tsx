import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Tag,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  Gift,
  Home,
} from "lucide-react";

/**
 * Attractive side panels that flank the hero slider on desktop/laptop (lg+).
 * Hidden on mobile/tablet/PWA so existing layout stays untouched.
 *
 * Usage:
 *   <SliderSidePanels.Layout>
 *     <YourSliderHere />
 *   </SliderSidePanels.Layout>
 */

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  onClick?: () => void;
  cta?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient,
  iconBg,
  onClick,
  cta,
}) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    }}
    className={`group relative overflow-hidden rounded-2xl p-5 ${gradient} ${
      onClick ? "cursor-pointer" : ""
    } shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/40 dark:border-white/10`}
  >
    {/* Decorative blob */}
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20 blur-2xl group-hover:scale-125 transition-transform duration-500" />

    <div className="relative z-10">
      <div
        className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-white shadow-md mb-3 group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-foreground text-base leading-tight mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
      {cta && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
          {cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  </div>
);

const StatPill: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="flex items-center gap-2.5 rounded-xl bg-background/70 backdrop-blur-sm border border-border/50 px-3 py-2.5 shadow-sm">
    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-sm font-bold text-foreground leading-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight truncate">{label}</div>
    </div>
  </div>
);

const LeftPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-full">
      <FeatureCard
        icon={<Sparkles className="w-5 h-5" />}
        title="Today's Top Picks"
        description="Curated deals from verified students near you."
        gradient="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/30"
        iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
        onClick={() => navigate("/browse")}
        cta="Explore"
      />
      <FeatureCard
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Verified & Safe"
        description="KYC-verified sellers and secure in-app chat."
        gradient="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/30"
        iconBg="bg-gradient-to-br from-emerald-500 to-teal-500"
      />
      <FeatureCard
        icon={<Tag className="w-5 h-5" />}
        title="Bargain Smart"
        description="Negotiate prices directly — save up to 40%."
        gradient="bg-gradient-to-br from-violet-50 to-fuchsia-100 dark:from-violet-950/40 dark:to-fuchsia-950/30"
        iconBg="bg-gradient-to-br from-violet-500 to-fuchsia-500"
      />
    </aside>
  );
};

const RightPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-full">
      <FeatureCard
        icon={<Zap className="w-5 h-5" />}
        title="Sell in 60 Seconds"
        description="Snap, list, sell. Reach thousands instantly."
        gradient="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/30"
        iconBg="bg-gradient-to-br from-rose-500 to-pink-500"
        onClick={() => navigate("/sell")}
        cta="List item"
      />
      <FeatureCard
        icon={<Home className="w-5 h-5" />}
        title="Find a PG"
        description="Discover budget-friendly stays near campus."
        gradient="bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-sky-950/40 dark:to-cyan-950/30"
        iconBg="bg-gradient-to-br from-sky-500 to-cyan-500"
        onClick={() => navigate("/browse?tab=pg")}
        cta="Browse PGs"
      />
      <div className="grid grid-cols-2 gap-2">
        <StatPill icon={<Users className="w-4 h-4" />} value="10K+" label="Students" />
        <StatPill icon={<TrendingUp className="w-4 h-4" />} value="2K+" label="Active deals" />
      </div>
    </aside>
  );
};

/**
 * Layout wrapper: places left panel + children (slider) + right panel
 * in a centered 3-column grid on lg+. On smaller screens, only children render.
 */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,15rem)] xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,17rem)] gap-5 lg:gap-6 items-stretch">
      <LeftPanel />
      <div className="min-w-0 flex items-center">
        <div className="w-full">{children}</div>
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, LeftPanel, RightPanel };
export default SliderSidePanels;
