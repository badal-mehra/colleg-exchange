import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Home, Repeat, Sparkles } from 'lucide-react';

export type ListingType = 'sell' | 'rent' | 'pg';

interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
}

const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect }) => {
  // We use state to track which card is being hovered to play the GIF
  const [hovered, setHovered] = useState<ListingType | null>(null);

  const options = [
    {
      id: 'sell',
      title: 'Turn Trash to Cash',
      desc: 'Sell old books & gadgets. Get rich quick(er).',
      icon: ShoppingBag,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'hover:border-purple-500',
      // Placeholder for a "Shut up and take my money" or "Stonks" meme
      memeSrc: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm91ZWN4Zmh4dzV4Y3J4Z3BwYWR1Z2t2ZnU3em53a3Z4Y3J4Z3BwYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LdOyjZ7io5Msw/giphy.gif', 
      tags: ['Old Books', 'Gaming Gear', 'Ex-BFs Hoodie']
    },
    {
      id: 'rent',
      title: 'Side Hustle / Rent',
      desc: 'Got a bike or camera? Rent it out. Passive income baby.',
      icon: Repeat,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'hover:border-blue-500',
      // Placeholder for "Modern problems require modern solutions"
      memeSrc: 'https://media.giphy.com/media/9058ZMj6XDsKGzq7u3/giphy.gif?cid=ecf05e4787s9j5s73531737135317371&rid=giphy.gif',
      tags: ['PS5 Controllers', 'Camera', 'Lab Coat']
    },
    {
      id: 'pg',
      title: 'Find Your Den',
      desc: 'No parents, no rules. Find a PG or flatmates.',
      icon: Home,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'hover:border-orange-500',
      // Placeholder for "This is fine" or a party gif
      memeSrc: 'https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif',
      tags: ['No Curfew', 'Chill Landlord', 'WiFi + Food']
    }
  ];

  return (
    <div className="space-y-8 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
           What's the Move? <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
        </h2>
        <p className="text-muted-foreground font-medium">Select a category to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        {options.map((option) => (
          <Card 
            key={option.id}
            className={`relative overflow-hidden cursor-pointer group border-2 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${option.borderColor}`}
            onClick={() => onSelect(option.id as ListingType)}
            onMouseEnter={() => setHovered(option.id as ListingType)}
            onMouseLeave={() => setHovered(null)}
          >
            <CardContent className="p-6 md:p-8 text-center space-y-5 h-full flex flex-col justify-between z-10 relative">
              
              {/* Image/Icon Container */}
              <div className={`w-32 h-32 mx-auto rounded-2xl ${option.bgColor} flex items-center justify-center overflow-hidden transition-all duration-300`}>
                {hovered === option.id ? (
                  // The Meme Image (Shown on Hover)
                  <img 
                    src={option.memeSrc} 
                    alt="Meme" 
                    className="w-full h-full object-cover animate-in fade-in duration-300"
                  />
                ) : (
                  // The Standard Icon (Shown by default)
                  <option.icon className={`h-12 w-12 ${option.color} transform group-hover:scale-110 transition-transform`} />
                )}
              </div>

              {/* Text Content */}
              <div>
                <h3 className={`text-xl font-bold ${option.color} mb-2`}>
                  {option.title}
                </h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {option.desc}
                </p>
              </div>

              {/* Funny Tags */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {option.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ListingTypeSelector;
