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
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-7 h-8 text-xs rounded-md bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
        />
      </div>
      {showFilter && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className="h-8 w-8 rounded-md border-muted-foreground/20 flex-shrink-0"
        >
          <SlidersHorizontal className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default PWASearchBar;
