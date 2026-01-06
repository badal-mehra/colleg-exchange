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
    <div className={cn("flex items-center gap-1.5 md:gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8 md:pl-9 h-9 md:h-11 text-sm rounded-lg md:rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
        />
      </div>
      {showFilter && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl border-muted-foreground/20 flex-shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
      )}
    </div>
  );
};

export default PWASearchBar;
