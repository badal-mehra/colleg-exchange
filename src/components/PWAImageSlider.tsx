import React, { useEffect, useState, useRef } from 'react';
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
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Use a ref for the interval so we can clear it easily
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Data
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

  // 2. Navigation Helper Functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 3. Auto-play Logic (Pauses on interaction)
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      goToNext();
    }, 5000); // 5 seconds per slide

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, isPaused, images.length]);

  // 4. Touch Swipe Handlers (No external library)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    
    // Reset
    setTouchEnd(0);
    setTouchStart(0);
  };

  const handleSlideClick = (linkUrl: string | null) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith('/')) {
      navigate(linkUrl);
    } else {
      window.open(linkUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full aspect-video md:aspect-[21/9] bg-muted/50 rounded-2xl animate-pulse" />
    );
  }

  if (images.length === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider Track */}
      <div 
        className="flex transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="w-full flex-shrink-0 relative"
          >
            {/* Image with improved aspect ratio handling */}
            <div 
              className="relative w-full aspect-[16/9] md:aspect-[21/9] cursor-pointer"
              onClick={() => handleSlideClick(image.link_url)}
            >
              <img
                src={image.image_url}
                alt={image.title || 'Slide'}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable="false"
              />
              
              {/* Text Overlay - Improved gradient for readability */}
              {(image.title || image.description) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-8 pointer-events-none">
                  <div className="transform transition-all duration-500 translate-y-0 opacity-100">
                    {image.title && (
                      <h3 className="text-white font-bold text-lg md:text-2xl mb-1 line-clamp-1 drop-shadow-md">
                        {image.title}
                      </h3>
                    )}
                    {image.description && (
                      <p className="text-gray-200 text-xs md:text-sm line-clamp-2 max-w-2xl drop-shadow-sm">
                        {image.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Only visible on Desktop Hover */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex border border-white/10"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex border border-white/10"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 w-2 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PWAImageSlider;
