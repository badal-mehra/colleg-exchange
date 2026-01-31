import React, { memo, useMemo } from "react";
import { Heart, MapPin, Clock, Eye, Loader2, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RentalMetadata {
  rental_duration?: string;
  rental_deposit?: number;
}

interface PWAListingCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  location?: string;
  condition?: string;
  isNegotiable?: boolean;
  createdAt: string;
  imageCount?: number;
  adType?: string;
  rentalMetadata?: RentalMetadata | null;
  onClick: () => void;
  onFavorite?: (e: React.MouseEvent) => void;
  isFavoriting?: boolean;
  showFavorite?: boolean;
}

const getThumb = (url: string) => {
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/f_auto,q_auto,w_400,h_400,c_fill/");
  }
  return url;
};

const PWAListingCard: React.FC<PWAListingCardProps> = memo(
  ({
    id,
    title,
    price,
    image,
    location,
    condition,
    isNegotiable,
    createdAt,
    imageCount = 1,
    adType,
    rentalMetadata,
    onClick,
    onFavorite,
    isFavoriting = false,
    showFavorite = true,
  }) => {
    const isRental = !!rentalMetadata?.rental_duration;
    
    const rentalDurationLabel = useMemo(() => {
      if (!rentalMetadata?.rental_duration) return null;
      const labels: Record<string, string> = {
        per_hour: "/hr",
        per_day: "/day",
        per_week: "/wk",
        per_month: "/mo",
      };
      return labels[rentalMetadata.rental_duration] || "";
    }, [rentalMetadata]);
    const timeAgo = useMemo(() => {
      const now = new Date();
      const created = new Date(createdAt);
      const diffMs = now.getTime() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) return `${diffDays}d`;
      if (diffHours > 0) return `${diffHours}h`;
      if (diffMinutes > 0) return `${diffMinutes}m`;
      return "now";
    }, [createdAt]);

    const thumbnailImage = useMemo(() => {
      return image ? getThumb(image) : "/placeholder.svg";
    }, [image]);

    const adBadge = useMemo(() => {
      if (!adType || adType === "free") return null;
      const badges: Record<string, { label: string; className: string }> = {
        featured: {
          label: "Featured",
          className: "bg-gradient-to-r from-yellow-500 to-amber-400 text-black",
        },
        premium: {
          label: "Premium",
          className: "bg-gradient-to-r from-purple-600 to-indigo-500 text-white",
        },
        urgent: {
          label: "Urgent",
          className: "bg-gradient-to-r from-red-600 to-pink-500 text-white",
        },
      };
      return badges[adType] || null;
    }, [adType]);

    return (
      <div
        onClick={onClick}
        className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 active:scale-[0.98] transition-transform touch-manipulation"
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted">
          <img
            src={thumbnailImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Rental Badge - Priority over Ad Badge */}
          {isRental ? (
            <Badge
              className="absolute top-2 left-2 text-[10px] px-2 py-0.5 font-semibold shadow-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            >
              <Key className="h-3 w-3 mr-0.5" />
              For Rent
            </Badge>
          ) : adBadge && (
            <Badge
              className={cn(
                "absolute top-2 left-2 text-[10px] px-2 py-0.5 font-semibold shadow-sm",
                adBadge.className
              )}
            >
              {adBadge.label}
            </Badge>
          )}

          {/* Favorite Button */}
          {showFavorite && onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(e);
              }}
              disabled={isFavoriting}
              className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-full shadow-sm active:scale-90 transition-all disabled:opacity-50"
            >
              {isFavoriting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Heart className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}

          {/* Image Count */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 right-2 bg-foreground/80 text-background text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {imageCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-1.5">
          {/* Price with rental duration */}
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-bold text-foreground">
              ₹{price.toLocaleString("en-IN")}
            </p>
            {rentalDurationLabel && (
              <span className="text-xs text-muted-foreground font-medium">
                {rentalDurationLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm text-foreground/90 line-clamp-2 leading-snug min-h-[2.5rem]">
            {title}
          </h3>

          {/* Location & Time */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
            <div className="flex items-center gap-1 truncate max-w-[60%]">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{location || "Campus"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {condition && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {condition === "new"
                  ? "New"
                  : condition === "like_new"
                  ? "Like New"
                  : condition}
              </Badge>
            )}
            {isNegotiable && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 border-primary/40 text-primary"
              >
                Negotiable
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PWAListingCard.displayName = "PWAListingCard";

export default PWAListingCard;
