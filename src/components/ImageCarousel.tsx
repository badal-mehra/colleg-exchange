import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ShoppingBag } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, alt, className = "" }) => {
  if (!images || images.length === 0) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mb-2" />
          <span className="text-xs">No Image</span>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`relative overflow-hidden bg-muted ${className}`}>
        <img 
          src={images[0]} 
          alt={alt}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative bg-muted ${className}`}>
      <Carousel className="w-full h-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <img 
                  src={image} 
                  alt={`${alt} - Image ${index + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-background/80 hover:bg-background" />
        <CarouselNext className="right-2 bg-background/80 hover:bg-background" />
      </Carousel>
      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs">
        {images.length} photos
      </div>
    </div>
  );
};

export default ImageCarousel;