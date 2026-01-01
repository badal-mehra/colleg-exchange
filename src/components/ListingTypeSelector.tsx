import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Home } from 'lucide-react';

export type ListingType = 'sell' | 'pg';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Sell Item Card */}
        <Card 
          className="cursor-pointer group hover:border-primary hover:shadow-lg transition-all duration-200"
          onClick={() => onSelect('sell')}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                Sell Item
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                List products like books, electronics, furniture, and more
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Electronics</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Books</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Furniture</span>
            </div>
          </CardContent>
        </Card>

        {/* PG/Room Card */}
        <Card 
          className="cursor-pointer group hover:border-primary hover:shadow-lg transition-all duration-200"
          onClick={() => onSelect('pg')}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Home className="h-10 w-10 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                PG / Room
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                List PGs, rooms, hostels, or flats for rent near campus
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">PG</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Room</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Hostel</span>
              <span className="text-xs px-2 py-1 bg-muted rounded-full">Flat</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListingTypeSelector;
