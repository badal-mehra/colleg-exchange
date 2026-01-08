import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PWASearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
  className?: string;
}

const PWASearchBar: React.FC<PWASearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  showFilter = false,
  onFilterClick,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
        />
      </div>
      {showFilter && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className="h-11 w-11 rounded-xl border-muted-foreground/20 flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PWASearchBar;
