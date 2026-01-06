import React from "react";
import { cn } from "@/lib/utils";

interface PWACategoryChipProps {
  icon?: string;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const PWACategoryChip: React.FC<PWACategoryChipProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all active:scale-95",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/70 text-muted-foreground hover:bg-muted"
      )}
    >
      {icon && <span className="text-sm md:text-base">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default PWACategoryChip;
