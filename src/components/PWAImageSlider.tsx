import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
}

const PWAImageSlider = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<SliderImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSliderImages = async () => {
      const { data } = await supabase
        .from('image_slidebar')
        .select('id, image_url, title, description, link_url')
        .eq('is_active', true)
        .order('sort_order');
      
      if (data && data.length > 0) {
        setImages(data);
      }
      setLoading(false);
    };

    fetchSliderImages();
  }, []);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleSlideClick = (linkUrl: string | null) => {
    if (linkUrl) {
      if (linkUrl.startsWith('/')) {
        navigate(linkUrl);
      } else {
        window.open(linkUrl, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-36 bg-muted/50 rounded-2xl animate-pulse" />
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted/30">
      {/* Slider Container */}
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="w-full flex-shrink-0 relative cursor-pointer active:opacity-90 transition-opacity"
            onClick={() => handleSlideClick(image.link_url)}
          >
            <img
              src={image.image_url}
              alt={image.title || 'Promotional banner'}
              className="w-full h-36 object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {/* Overlay gradient */}
            {(image.title || image.description) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="absolute bottom-3 left-3 right-3">
                  {image.title && (
                    <h3 className="text-white font-semibold text-sm line-clamp-1">
                      {image.title}
                    </h3>
                  )}
                  {image.description && (
                    <p className="text-white/80 text-xs line-clamp-1 mt-0.5">
                      {image.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows (only show if more than 1 image) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PWAImageSlider;
