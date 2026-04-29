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
  Home,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  cta?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onClick,
  cta,
}) => {
  const isInteractive = !!onClick;
  const Component = isInteractive ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`group relative flex flex-col w-full text-left p-5 h-full rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 ${
        isInteractive
          ? "cursor-pointer hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
          : ""
      }`}
    >
      {/* Subtle hover gradient background */}
      {isInteractive && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary bg-primary/10 ring-1 ring-primary/20 transition-colors">
            {icon}
          </div>
          {isInteractive && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-1.5">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed flex-grow">
          {description}
        </p>

        {cta && (
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {cta}
          </div>
        )}
      </div>
    </Component>
  );
};

const StatPill: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-sm font-bold text-foreground leading-none mb-1">
        {value}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
        {label}
      </div>
    </div>
  </div>
);

const LeftPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-full">
      <FeatureCard
        icon={<Sparkles className="w-5 h-5" />}
        title="Today's Top Picks"
        description="Curated deals from verified students near you."
        onClick={() => navigate("/browse")}
        cta="Explore deals"
      />
      <FeatureCard
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Verified & Safe"
        description="KYC-verified sellers and secure in-app chat."
      />
      <FeatureCard
        icon={<Tag className="w-5 h-5" />}
        title="Bargain Smart"
        description="Negotiate prices directly — save up to 40%."
      />
    </aside>
  );
};

const RightPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-full">
      <FeatureCard
        icon={<Zap className="w-5 h-5" />}
        title="Sell in 60 Seconds"
        description="Snap, list, sell. Reach thousands instantly."
        onClick={() => navigate("/sell")}
        cta="List an item"
      />
      <FeatureCard
        icon={<Home className="w-5 h-5" />}
        title="Find a PG"
        description="Discover budget-friendly stays near campus."
        onClick={() => navigate("/browse?tab=pg")}
        cta="Browse PGs"
      />
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <StatPill
          icon={<Users className="w-4 h-4" />}
          value="10K+"
          label="Students"
        />
        <StatPill
          icon={<TrendingUp className="w-4 h-4" />}
          value="2K+"
          label="Active Deals"
        />
      </div>
    </aside>
  );
};

/**
 * Layout wrapper: places left panel + children (slider) + right panel
 * in a centered 3-column grid on lg+.
 */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,16rem)] xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,18rem)] gap-6 xl:gap-8 items-stretch py-6">
      <LeftPanel />
      <div className="min-w-0 flex items-stretch">
        {/* Ensures the slider container takes full height and width smoothly */}
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-border/50 bg-card">
          {children}
        </div>
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, LeftPanel, RightPanel };
export default SliderSidePanels;
