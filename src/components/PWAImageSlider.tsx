import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSliderImageUrl } from '@/utils/cloudinaryUpload';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const SLIDE_DURATION = 6000;
const TRANSITION_MS  = 600;

/* ─────────────────────────────────────────────
   Loading skeleton
───────────────────────────────────────────── */
const SliderSkeleton = () => (
  <div className="w-full aspect-video rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 animate-pulse" />
);

/* ─────────────────────────────────────────────
   Error state
───────────────────────────────────────────── */
const SliderError = () => (
  <div className="w-full aspect-video rounded-2xl overflow-hidden flex items-center justify-center bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <span className="text-3xl">⚠️</span>
      <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm">Could not load slides</p>
      <p className="text-xs text-rose-400">Check your connection and try again</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const PWAImageSlider = () => {
  const navigate = useNavigate();

  const [images, setImages]                   = useState<SliderImage[]>([]);
  const [currentIndex, setCurrentIndex]       = useState(0);
  const [loading, setLoading]                 = useState(true);
  const [fetchError, setFetchError]           = useState(false);
  const [isPaused, setIsPaused]               = useState(false);
  const [isAutoPlay, setIsAutoPlay]           = useState(true);
  const [progress, setProgress]               = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef       = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lengthRef    = useRef(0);
  const pausedRef    = useRef(false);
  const autoPlayRef  = useRef(true);
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);

  useEffect(() => { lengthRef.current = images.length; }, [images.length]);
  useEffect(() => { pausedRef.current = isPaused; },     [isPaused]);
  useEffect(() => { autoPlayRef.current = isAutoPlay; }, [isAutoPlay]);

  /* ── Fetch ─────────────────────────────── */
  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        const { data, error } = await supabase
          .from('image_slidebar')
          .select('id, image_url, title, description, link_url')
          .eq('is_active', true)
          .order('sort_order');
        if (error) throw error;
        if (data?.length) setImages(data);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSliderImages();
  }, []);

  /* ── Go-to-slide ───────────────────────── */
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = performance.now();
    if (announcerRef.current) {
      announcerRef.current.textContent =
        `Slide ${index + 1} of ${lengthRef.current}` +
        (images[index]?.title ? `: ${images[index].title}` : '');
    }
    setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
  }, [isTransitioning, images]);

  const goToNext     = useCallback(() =>
    goToSlide((currentIndex + 1) % lengthRef.current),
    [currentIndex, goToSlide]);

  const goToPrevious = useCallback(() =>
    goToSlide(currentIndex === 0 ? lengthRef.current - 1 : currentIndex - 1),
    [currentIndex, goToSlide]);

  /* ── Progress RAF ──────────────────────── */
  const stopProgress = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    startTimeRef.current = performance.now();
    const tick = (now: number) => {
      if (pausedRef.current || !autoPlayRef.current) return;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopProgress]);

  /* ── Auto-play ─────────────────────────── */
  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current && autoPlayRef.current && lengthRef.current > 1) {
        setCurrentIndex(prev => {
          const next = (prev + 1) % lengthRef.current;
          setProgress(0);
          startTimeRef.current = performance.now();
          return next;
        });
      }
    }, SLIDE_DURATION);
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    if (isAutoPlay && !isPaused) {
      startAutoPlay();
      startProgress();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopProgress();
      if (!isAutoPlay) setProgress(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopProgress();
    };
  }, [isAutoPlay, isPaused, images.length, startAutoPlay, startProgress, stopProgress]);

  useEffect(() => {
    if (images.length > 1 && isAutoPlay && !isPaused) {
      stopProgress();
      startProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  /* ── Keyboard ──────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const focused = document.activeElement;
      const inside  = containerRef.current?.contains(focused) || focused === document.body;
      if (!inside) return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); goToPrevious(); break;
        case 'ArrowRight': e.preventDefault(); goToNext();     break;
        case ' ':          e.preventDefault(); setIsAutoPlay(p => !p); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToNext, goToPrevious]);

  /* ── Touch ─────────────────────────────── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx > 0 ? goToNext() : goToPrevious();
    }
  };

  /* ── Link click ────────────────────────── */
  const handleSlideClick = (linkUrl: string | null) => {
    if (!linkUrl) return;
    linkUrl.startsWith('/') ? navigate(linkUrl) : window.open(linkUrl, '_blank');
  };

  /* ── Guards ────────────────────────────── */
  if (loading)        return <SliderSkeleton />;
  if (fetchError)     return <SliderError />;
  if (!images.length) return null;

  const slide  = images[currentIndex];
  const hasNav = images.length > 1;

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div className="w-full">

      {/* Screen-reader live region */}
      <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* ── Slider container ───────────────── */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Image carousel"
        tabIndex={0}
        className="relative w-full aspect-video overflow-hidden rounded-2xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* ── Slide images ───────────────── */}
        {images.map((image, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={image.id}
              aria-hidden={!isActive}
              className={[
                'absolute inset-0 transition-opacity ease-in-out',
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0',
              ].join(' ')}
              style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            >
              <img
                src={getSliderImageUrl(image.image_url)}
                alt={image.title || `Slide ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable="false"
              />
              {/* Single smooth gradient — bottom only, no overlap */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            </div>
          );
        })}

        {/* ── TOP: Progress bars + play/pause ── */}
        {hasNav && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1.5 px-3 pt-3 sm:px-5 sm:pt-4">
            {/* Stories-style progress bars */}
            <div className="flex items-center gap-1 flex-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === currentIndex ? 'true' : undefined}
                  className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                >
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width:
                        index < currentIndex  ? '100%'
                        : index === currentIndex ? `${isAutoPlay && !isPaused ? progress : 0}%`
                        : '0%',
                      transition: index === currentIndex ? 'none' : 'width 0.3s ease',
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Play / Pause */}
            <button
              className="ml-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 active:scale-90 transition-all duration-200 flex-shrink-0"
              onClick={() => setIsAutoPlay(p => !p)}
              aria-label={isAutoPlay ? 'Pause autoplay' : 'Resume autoplay'}
            >
              {isAutoPlay
                ? <Pause className="w-3 h-3 fill-current" />
                : <Play  className="w-3 h-3 fill-current" />}
            </button>
          </div>
        )}

        {/* ── BOTTOM: Text + arrows ──────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between gap-3 px-4 pb-4 sm:px-6 sm:pb-5">

          {/* Slide text */}
          <div
            key={`content-${currentIndex}`}
            className="flex-1 min-w-0 animate-in slide-in-from-bottom-2 fade-in duration-500"
            style={{ pointerEvents: slide.link_url ? 'auto' : 'none' }}
          >
            {slide.link_url ? (
              <button
                className="text-left w-full group/link"
                onClick={() => handleSlideClick(slide.link_url)}
                aria-label={slide.title ? `${slide.title} — open link` : 'Open slide link'}
              >
                <SlideText slide={slide} />
              </button>
            ) : (
              <SlideText slide={slide} />
            )}
          </div>

          {/* Arrow buttons — desktop only */}
          {hasNav && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={goToPrevious}
                disabled={isTransitioning}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToNext}
                disabled={isTransitioning}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Dot indicators — mobile only ───── */}
        {hasNav && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:hidden pointer-events-none">
            {images.map((_, index) => (
              <div
                key={index}
                className={[
                  'rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/40',
                ].join(' ')}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Slide text sub-component
───────────────────────────────────────────── */
const SlideText = ({
  slide,
}: {
  slide: { title: string | null; description: string | null; link_url: string | null };
}) => (
  <div className="space-y-1">
    {slide.title && (
      <h3 className="text-white font-bold text-base sm:text-2xl leading-snug drop-shadow line-clamp-2 group-hover/link:underline underline-offset-4">
        {slide.title}
      </h3>
    )}
    {slide.description && (
      <p className="text-white/70 text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-sm sm:max-w-xl">
        {slide.description}
      </p>
    )}
    {slide.link_url && (
      <div className="inline-flex items-center gap-1 text-white/60 text-xs font-medium mt-0.5 group-hover/link:text-white transition-colors">
        <ArrowUpRight className="w-3 h-3" />
        <span>Learn more</span>
      </div>
    )}
  </div>
);

export default PWAImageSlider;
