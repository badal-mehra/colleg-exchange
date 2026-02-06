import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Home, Repeat, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export type ListingType = 'sell' | 'rent' | 'pg';

interface ListingOption {
  id: ListingType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tags: string[];
}

const LISTING_OPTIONS: ListingOption[] = [
  {
    id: 'sell',
    title: 'Sell Item',
    description: 'Sell products permanently to buyers',
    icon: ShoppingBag,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    tags: ['Electronics', 'Books', 'Furniture']
  },
  {
    id: 'rent',
    title: 'Rent Item',
    description: 'Lend items temporarily for a fee',
    icon: Repeat,
    color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20',
    tags: ['Camera', 'Bike', 'Projector']
  },
  {
    id: 'pg',
    title: 'PG / Room',
    description: 'List accommodation for students',
    icon: Home,
    color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20',
    tags: ['PG', 'Room', 'Hostel']
  }
];

interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
  selectedType?: ListingType;
}

const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect, selectedType }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground"
        >
          What are you listing today?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-sm md:text-base max-w-md mx-auto"
        >
          Select the category that best fits your needs to get started with your listing.
        </motion.p>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {LISTING_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.id;

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                role="button"
                tabIndex={0}
                onClick={() => onSelect(option.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(option.id)}
                className={cn(
                  "relative h-full cursor-pointer overflow-hidden transition-all duration-300",
                  "border-2 hover:shadow-xl",
                  isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                )}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Icon Header */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                    option.color
                  )}>
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Content */}
                  <div className="flex-grow space-y-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {option.title}
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {option.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {option.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 bg-secondary text-secondary-foreground rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Hint (Desktop only) */}
                  <div className="mt-6 pt-4 border-t border-border flex items-center text-primary font-medium text-sm">
                    Select category
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ListingTypeSelector;
