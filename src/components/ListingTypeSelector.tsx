import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Home, Repeat } from 'lucide-react';

export type ListingType = 'sell' | 'rent' | 'pg';

interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
}

const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">What do you want to list?</h2>
        <p className="text-muted-foreground">Choose the type of listing you want to create</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
        {/* Sell Item Card */}
        <Card 
          className="cursor-pointer group hover:border-primary hover:shadow-lg transition-all duration-200"
          onClick={() => onSelect('sell')}
        >
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ShoppingBag className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                Sell Item
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                Sell products permanently to buyers
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Electronics</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Books</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Furniture</span>
            </div>
          </CardContent>
        </Card>

        {/* Rent Item Card */}
        <Card 
          className="cursor-pointer group hover:border-blue-500 hover:shadow-lg transition-all duration-200"
          onClick={() => onSelect('rent')}
        >
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Repeat className="h-8 w-8 md:h-10 md:w-10 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                Rent Item
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                Lend items temporarily for a fee
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Camera</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Bike</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Projector</span>
            </div>
          </CardContent>
        </Card>

        {/* PG/Room Card */}
        <Card 
          className="cursor-pointer group hover:border-orange-500 hover:shadow-lg transition-all duration-200"
          onClick={() => onSelect('pg')}
        >
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Home className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                PG / Room
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                List accommodation for students
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">PG</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Room</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Hostel</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListingTypeSelector;
