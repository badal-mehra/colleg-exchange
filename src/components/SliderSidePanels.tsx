import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Home, ShieldCheck, ArrowRight } from "lucide-react";

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  title,
  description,
  onClick,
  accent = false,
}) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center gap-4 w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
      accent
        ? "bg-primary text-primary-foreground border-primary hover:opacity-95"
        : "bg-card text-card-foreground border-border/60 hover:border-primary/40 hover:shadow-md"
    }`}
  >
    <div
      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
        accent
          ? "bg-primary-foreground/15"
          : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"
      } transition-colors`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="font-semibold text-sm leading-tight truncate">{title}</div>
      <div
        className={`text-xs mt-0.5 truncate ${
          accent ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {description}
      </div>
    </div>
    <ArrowRight
      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
        accent ? "text-primary-foreground/80" : "text-muted-foreground"
      }`}
    />
  </button>
);

const RightPanel: React.FC = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-full h-full">
      <div className="px-1 mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h3>
      </div>

      <QuickAction
        accent
        icon={<Zap className="w-5 h-5" />}
        title="Sell in 60 seconds"
        description="Snap, list & reach students instantly"
        onClick={() => navigate("/sell")}
      />

      <QuickAction
        icon={<Home className="w-5 h-5" />}
        title="Find a PG"
        description="Budget stays near campus"
        onClick={() => navigate("/browse?tab=pg")}
      />

      <QuickAction
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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-stretch py-6">
      <div className="min-w-0">
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-border/50 bg-card">
          {children}
        </div>
      </div>
      <RightPanel />
    </div>
  </div>
);

const SliderSidePanels = { Layout, RightPanel };
export default SliderSidePanels;
