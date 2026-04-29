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
  featured?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onClick,
  cta,
  featured = false,
}) => {
  const isInteractive = !!onClick;
  const Component = isInteractive ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`group relative flex flex-col w-full text-left p-6 h-full rounded-[2rem] bg-background overflow-hidden transition-all duration-500 ease-out border ${
        featured
          ? "border-primary/30 shadow-[0_0_40px_-15px_rgba(var(--primary),0.15)]"
          : "border-border/40 shadow-sm"
      } ${
        isInteractive
          ? "cursor-pointer hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
          : ""
      }`}
    >
      {/* Base subtle gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent pointer-events-none" />

      {/* Spotlight hover effect - mimics a light source revealing the card */}
      {isInteractive && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Icon & Animated Arrow */}
        <div className="flex items-start justify-between mb-6">
          <div
            className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              featured
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-muted/80 text-foreground group-hover:bg-primary/10 group-hover:text-primary ring-1 ring-border/50 group-hover:ring-primary/20"
            }`}
          >
            {icon}
          </div>
          {isInteractive && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border/50 bg-background/80 backdrop-blur-md text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:border-primary/40 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Crisp Typography */}
        <h3 className="font-bold text-foreground text-base tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-grow font-medium">
          {description}
        </p>

        {/* Minimalist CTA */}
        {cta && (
          <div className="mt-6 pt-4 border-t border-border/40 flex items-center text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-300">
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
  <div className="group flex items-center gap-4 rounded-[1.5rem] bg-background border border-border/40 p-4 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
    <div className="w-10 h-10 rounded-xl bg-muted/80 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-border/50 transition-colors duration-300">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-base font-bold text-foreground tracking-tight leading-none mb-1.5">
        {value}
      </div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest truncate">
        {label}
      </div>
    </div>
  </div>
);

const LeftPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-5 w-full">
      <FeatureCard
        featured
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
    <aside className="hidden lg:flex flex-col gap-5 w-full">
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
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <StatPill
          icon={<Users className="w-4 h-4" />}
          value="10K+"
          label="Students"
        />
        <StatPill
          icon={<TrendingUp className="w-4 h-4" />}
          value="2K+"
          label="Deals"
        />
      </div>
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,18rem)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,20rem)] gap-6 xl:gap-8 items-stretch py-8">
      <LeftPanel />
      <div className="min-w-0 flex items-stretch">
        {/* Upgraded slider container to match the Bento aesthetic */}
        <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-lg border border-border/40 bg-background relative group">
          <div className="absolute inset-0 bg-muted/10 pointer-events-none z-0" />
          <div className="relative z-10 h-full w-full">{children}</div>
        </div>
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, LeftPanel, RightPanel };
export default SliderSidePanels;
