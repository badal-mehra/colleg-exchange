import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Home, ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";

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
    <button
      onClick={onClick}
      className={`group relative flex-1 min-h-0 w-full text-left p-5 rounded-2xl border overflow-hidden transition-all duration-300 ${
        isPrimary
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/40 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          : "bg-card text-card-foreground border-border/60 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {isPrimary && (
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl pointer-events-none" />
      )}
      <div className="relative z-10 flex flex-col h-full justify-between gap-3">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
              isPrimary
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"
            }`}
          >
            {icon}
          </div>
          <ArrowUpRight
            className={`w-4 h-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
              isPrimary ? "text-primary-foreground/80" : "text-muted-foreground group-hover:text-primary"
            }`}
          />
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight">{title}</div>
          <div
            className={`text-xs mt-1 leading-snug ${
              isPrimary ? "text-primary-foreground/85" : "text-muted-foreground"
            }`}
          >
            {description}
          </div>
        </div>
      </div>
    </button>
  );
};

const RightPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-full h-full">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Quick Actions
        </h3>
      </div>

      <ActionCard
        variant="primary"
        icon={<Zap className="w-5 h-5" />}
        title="Sell in 60 seconds"
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
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Verified sellers"
        description="KYC-checked, safe transactions"
        onClick={() => navigate("/browse")}
      />
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem] gap-5 items-stretch py-6">
      <div className="min-w-0 rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card">
        {children}
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };
export default SliderSidePanels;
