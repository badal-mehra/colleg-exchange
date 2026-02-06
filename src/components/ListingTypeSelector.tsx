import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Home, Repeat, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a standard class merger utility

export type ListingType = 'sell' | 'rent' | 'pg';

interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
}

interface SelectionOption {
  id: ListingType;
  title: string;
  description: string;
  icon: React.ElementType;
  tags: string[];
  theme: {
    text: string;
    bg: string;
    border: string;
    ring: string;
  };
}

const selectionOptions: SelectionOption[] = [
  {
    id: 'sell',
    title: 'Sell Item',
    description: 'Find new owners for your pre-loved items',
    icon: ShoppingBag,
    tags: ['Electronics', 'Furniture', 'Fashion'],
    theme: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      border: 'group-hover:border-emerald-500/50',
      ring: 'group-hover:ring-emerald-500/20',
    },
  },
  {
    id: 'rent',
    title: 'Rent Item',
    description: 'Lend your gear temporarily for a fee',
    icon: Repeat,
    tags: ['Cameras', 'Vehicles', 'Tools'],
    theme: {
      text: 'text-blue-600',
      bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
      border: 'group-hover:border-blue-500/50',
      ring: 'group-hover:ring-blue-500/20',
    },
  },
  {
    id: 'pg',
    title: 'PG / Room',
    description: 'List accommodations and living spaces',
    icon: Home,
    tags: ['Student PG', 'Flat', 'Hostel'],
    theme: {
      text: 'text-orange-600',
      bg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
      border: 'group-hover:border-orange-500/50',
      ring: 'group-hover:ring-orange-500/20',
    },
  },
];

const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect }) => {
  const handleKeyDown = (e: React.KeyboardEvent, type: ListingType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(type);
    }
  };

  return (
    <div className="w-full py-8 px-4 animate-in fade-in zoom-in duration-500">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            What are you listing today?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select a category below to start creating your listing.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {selectionOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.id}
                tabIndex={0}
                role="button"
                aria-label={`Select ${option.title}`}
                onClick={() => onSelect(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
                className={cn(
                  "relative h-full cursor-pointer transition-all duration-300 ease-out",
                  "hover:-translate-y-1 hover:shadow-xl hover:ring-2 ring-transparent",
                  "border-border/60 bg-card/50 backdrop-blur-sm",
                  "group overflow-hidden",
                  option.theme.border,
                  option.theme.ring
                )}
              >
                {/* Decorative background gradient */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-br from-transparent via-transparent to-muted/30"
                )} />

                <CardContent className="p-6 md:p-8 flex flex-col items-center text-center h-full relative z-10">
                  {/* Icon Circle */}
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300",
                    option.theme.bg
                  )}>
                    <Icon className={cn("h-10 w-10 transition-transform duration-300 group-hover:scale-110", option.theme.text)} />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 space-y-2 mb-6">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 justify-center mt-auto">
                    {option.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="text-[10px] font-medium px-2.5 py-1 bg-muted/80 text-muted-foreground rounded-md border border-transparent group-hover:border-border/50 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Mobile-only arrow indicator (UX improvement) */}
                  <div className="md:hidden mt-4 text-muted-foreground/50">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListingTypeSelector;
