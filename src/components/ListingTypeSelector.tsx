import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Wallet, PartyPopper, BedDouble } from 'lucide-react';

export type ListingType = 'sell' | 'rent' | 'pg';

interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
}

const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect }) => {
  
  const options = [
    {
      id: 'sell',
      type: 'sell',
      // Funny Copy
      title: 'I need money ASAP',
      subtitle: 'Sell your old textbooks, gadgets, or that guitar you never played.',
      // Visuals
      icon: Wallet,
      badge: 'Instant Cash',
      badgeColor: 'bg-green-100 text-green-700 hover:bg-green-100', // Subtle aesthetic colors
      // Use a relatable image/meme here. 
      // Example concept: "Stonks" or someone holding cash fan
      imageSrc: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
    {
      id: 'rent',
      type: 'rent',
      // Funny Copy
      title: 'Just for the weekend',
      subtitle: 'Rent a DSLR for the trip or a suit for the interview. Don\'t buy it.',
      // Visuals
      icon: PartyPopper,
      badge: 'Smart Move',
      badgeColor: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      // Example concept: "Modern problems require modern solutions" guy
      imageSrc: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
    {
      id: 'pg',
      type: 'pg',
      // Funny Copy
      title: 'Escaping my parents',
      subtitle: 'Find a PG, flat, or roommate who actually washes dishes.',
      // Visuals
      icon: BedDouble,
      badge: 'Freedom',
      badgeColor: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
      // Example concept: "Spongebob Ight Imma Head Out"
      imageSrc: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4">
      
      {/* Header Section */}
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          What are we doing today?
        </h2>
        <p className="text-slate-500 text-lg">
          Choose your path, weary student.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => (
          <Card 
            key={option.id}
            className="group relative overflow-hidden border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl bg-white"
            onClick={() => onSelect(option.type as ListingType)}
          >
            {/* Image Cover Area - This is where the Meme/Vibe lives */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <div className="absolute top-4 left-4 z-10">
                <Badge className={`${option.badgeColor} border-0 px-3 py-1 font-semibold`}>
                  {option.badge}
                </Badge>
              </div>
              <img 
                src={option.imageSrc} 
                alt={option.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient Overlay for text readability if needed, or just style */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content Area */}
            <CardContent className="p-6 pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-slate-50 w-fit group-hover:bg-slate-100 transition-colors`}>
                  <option.icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {option.title}
                </h3>
              </div>
              
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {option.subtitle}
              </p>
            </CardContent>

            {/* Footer / Call to Action */}
            <CardFooter className="p-6 pt-0 flex items-center justify-between text-sm font-semibold text-primary">
              <span>Start Listing</span>
              <ArrowRight className="w-4 h-4 transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ListingTypeSelector;
