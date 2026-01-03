import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Home, Wifi, Utensils, Zap, Eye } from 'lucide-react';

interface PGListing {
  id: string;
  property_type: string;
  for_gender: string;
  sharing_type: string;
  rent_per_month: number;
  security_deposit?: number | null;
  electricity_included?: boolean | null;
  food_included?: boolean | null;
  area_locality: string;
  distance_from_campus?: string | null;
  amenities?: any;
  images: string[];
  views?: number | null;
  created_at: string;
}

interface PGListingCardProps {
  listing: PGListing;
  onClick?: () => void;
}

const getThumb = (url: string) => {
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_400,h_300,c_fill/');
  }
  return url;
};

const PGListingCard: React.FC<PGListingCardProps> = memo(({ listing, onClick = () => {} }) => {
  const thumbnailImage = useMemo(() => {
    return listing.images[0] ? getThumb(listing.images[0]) : '/placeholder.svg';
  }, [listing.images]);

  const propertyTypeLabel = {
    pg: 'PG',
    room: 'Room',
    hostel: 'Hostel',
    flat: 'Flat',
  }[listing.property_type] || listing.property_type;

  const genderLabel = {
    boys: 'Boys',
    girls: 'Girls',
    both: 'Co-ed',
  }[listing.for_gender] || listing.for_gender;

  const sharingLabel = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    any: 'Any Sharing',
  }[listing.sharing_type] || listing.sharing_type;

  const timeAgo = useMemo(() => {
    const now = new Date();
    const created = new Date(listing.created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  }, [listing.created_at]);

  return (
    <div
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-orange-300"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={thumbnailImage}
          alt={`${propertyTypeLabel} in ${listing.area_locality}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Property Type Badge */}
        <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600 text-white">
          <Home className="h-3 w-3 mr-1" />
          {propertyTypeLabel}
        </Badge>

        {/* Gender Badge */}
        <Badge 
          variant="secondary" 
          className={`absolute top-2 right-2 ${
            listing.for_gender === 'boys' ? 'bg-blue-100 text-blue-700' :
            listing.for_gender === 'girls' ? 'bg-pink-100 text-pink-700' :
            'bg-purple-100 text-purple-700'
          }`}
        >
          <Users className="h-3 w-3 mr-1" />
          {genderLabel}
        </Badge>

        {/* Image Count */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-foreground/80 text-background text-xs px-2 py-1 rounded flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {listing.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Rent */}
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-bold text-foreground">
            ₹{listing.rent_per_month.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
          <Badge variant="outline" className="text-xs">
            {sharingLabel}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{listing.area_locality}</span>
          {listing.distance_from_campus && (
            <span className="text-xs">• {listing.distance_from_campus}</span>
          )}
        </div>

        {/* Quick Info Tags */}
        <div className="flex flex-wrap gap-1.5">
          {listing.electricity_included && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
              <Zap className="h-3 w-3" /> Electricity
            </span>
          )}
          {listing.food_included && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
              <Utensils className="h-3 w-3" /> Food
            </span>
          )}
          {(Array.isArray(listing.amenities) ? listing.amenities.includes('wifi') : false) && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
              <Wifi className="h-3 w-3" /> WiFi
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {(listing.security_deposit ?? 0) > 0 && (
            <span>Deposit: ₹{listing.security_deposit?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
});

PGListingCard.displayName = 'PGListingCard';

export default PGListingCard;
