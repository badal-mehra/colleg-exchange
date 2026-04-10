import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
const TRANSITION_MS  = 650;
const CONTAINER_CLASSES = "w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] min-h-[320px] rounded-3xl overflow-hidden relative";

/* ─────────────────────────────────────────────
   Loading skeleton
───────────────────────────────────────────── */
const SliderSkeleton = () => (
  <div className={`${CONTAINER_CLASSES} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900`}>
    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 gap-3">
      <div className="h-7 w-3/4 md:w-2/5 rounded-lg bg-slate-300/60 dark:bg-slate-700/60" />
      <div className="h-4 w-full md:w-3/5 rounded-md bg-slate-300/40 dark:bg-slate-700/40" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Error state
───────────────────────────────────────────── */
const SliderError = () => (
  <div className={`${CONTAINER_CLASSES} flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 border border-rose-100 dark:border-rose-900/50`}>
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-2xl">⚠️</div>
      <p className="font-semibold text-rose-700 dark:text-rose-300 text-base">Could not load slides</p>
      <p className="text-xs text-rose-400 dark:text-rose-500">Check your connection and try refreshing</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Slide text content
───────────────────────────────────────────── */
const SlideContent = ({ slide }: { slide: { title: string | null; description: string | null; link_url: string | null } }) => (
  <div className="space-y-1.5 md:space-y-2 pointer-events-none text-left">
    {slide.title && (
      <h3 className="text-white font-bold text-xl md:text-3xl leading-tight drop-shadow-lg line-clamp-2 sm:line-clamp-3 group-hover/link:underline underline-offset-4 pointer-events-auto">
        {slide.title}
      </h3>
    )}
    {slide.description && (
      <p className="text-white/80 text-sm md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md pointer-events-auto">
        {slide.description}
      </p>
    )}
    {slide.link_url && (
      <div className="inline-flex items-center gap-1.5 text-white/70 text-xs md:text-sm font-medium mt-1 md:mt-2 group-hover/link:text-white transition-colors pointer-events-auto bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        <span>Learn more</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const PWAImageSlider = () => {
  const navigate = useNavigate();

  const [images, setImages]               = useState<SliderImage[]>([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(false);
  const [isPaused, setIsPaused]           = useState(false);
  const [isAutoPlay, setIsAutoPlay]       = useState(true);
  const [progress, setProgress]           = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef   = useRef<HTMLDivElement>(null);
  const announcerRef   = useRef<HTMLDivElement>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef         = useRef<number | null>(null);
  const startTimeRef   = useRef<number>(0);
  const lengthRef      = useRef(0);
  const pausedRef      = useRef(false);
  const autoPlayRef    = useRef(true);
  const touchStartX    = useRef(0);
  const touchStartY    = useRef(0);

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
  if (loading)       return <SliderSkeleton />;
  if (fetchError)    return <SliderError />;
  if (!images.length) return null;

  const slide  = images[currentIndex];
  const hasNav = images.length > 1;

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div className="w-full space-y-3 md:space-y-4">

      {/* Screen-reader live region */}
      <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* ── Main slider ───────────────────── */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Image carousel"
        tabIndex={0}
        className="group relative w-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide image stack */}
        <div className={CONTAINER_CLASSES}>
          {images.map((image, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={image.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-all ease-in-out ${
                  isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-[1.04]'
                }`}
                style={{ transitionDuration: `${TRANSITION_MS}ms` }}
              >
                <img
                  src={image.image_url}
                  alt={image.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable="false"
                />
                {/* Responsive Gradient Overlays for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30 md:via-black/10 md:to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden md:block" />
              </div>
            );
          })}

          {/* ── Overlay UI ────────────────────────────────────────── */}
          {/* Changed to a rigid flex column to ensure proper spacing  */}
          <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none p-4 md:p-6 lg:p-8">

            {/* ── ZONE 1: TOP ─ progress bars + controls ─────────── */}
            <div className="flex flex-col gap-3 w-full">
              {hasNav && (
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === currentIndex ? 'true' : undefined}
                      className="h-1 md:h-[3px] flex-1 rounded-full overflow-hidden bg-white/30 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        style={{
                          width:
                            index < currentIndex ? '100%'
                            : index === currentIndex ? `${isAutoPlay && !isPaused ? progress : 0}%`
                            : '0%',
                          transition: index === currentIndex ? 'none' : 'width 0.3s ease',
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                {hasNav ? (
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 pointer-events-auto">
                    <span className="text-white font-bold text-xs tabular-nums tracking-wide">
                      {String(currentIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white/40 text-[10px]">／</span>
                    <span className="text-white/60 text-[10px] tabular-nums">
                      {String(images.length).padStart(2, '0')}
                    </span>
                  </div>
                ) : <div />}

                {hasNav && (
                  <button
                    className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 active:scale-90 transition-all duration-200 pointer-events-auto"
                    onClick={() => setIsAutoPlay(p => !p)}
                    aria-label={isAutoPlay ? 'Pause autoplay' : 'Resume autoplay'}
                  >
                    {isAutoPlay
                      ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                      : <Play  className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current ml-0.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* ── ZONE 2: MIDDLE ─ Spacer ────────────────────────── */}
            <div className="flex-1 min-h-[2rem]" />

            {/* ── ZONE 3: BOTTOM ─ text + arrows ─────────────────── */}
            {/* Added proper width constraints to prevent collisions  */}
            <div className="flex flex-row items-end justify-between gap-4 md:gap-8 w-full pointer-events-none pb-2 md:pb-0">

              <div
                key={`content-${currentIndex}`}
                className="flex-1 min-w-0 w-full md:max-w-[calc(100%-8rem)] animate-in slide-in-from-bottom-3 fade-in duration-500 fill-mode-both"
              >
                {slide.link_url ? (
                  <button
                    className="w-full text-left group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                    onClick={() => handleSlideClick(slide.link_url)}
                    aria-label={slide.title ? `${slide.title} — open link` : 'Open slide link'}
                  >
                    <SlideContent slide={slide} />
                  </button>
                ) : (
                  <SlideContent slide={slide} />
                )}
              </div>

              {hasNav && (
                <div className="hidden md:flex items-center gap-2.5 pointer-events-auto flex-shrink-0">
                  <button
                    onClick={goToPrevious}
                    disabled={isTransitioning}
                    className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-6 w-6 pr-0.5" />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={isTransitioning}
                    className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-6 w-6 pl-0.5" />
                  </button>
                </div>
              )}
            </div>

          </div>{/* end overlay */}
        </div>{/* end slide stack */}
      </div>{/* end main slider */}

      {/* ── Thumbnail strip ───────────────── */}
      {hasNav && (
        <div
          className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory px-1 py-1"
          role="tablist"
          aria-label="Slide thumbnails"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {images.map((image, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={image.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Slide ${index + 1}${image.title ? `: ${image.title}` : ''}`}
                onClick={() => goToSlide(index)}
                className={`relative flex-shrink-0 snap-center w-[4.5rem] h-[3rem] md:w-28 md:h-[4rem] rounded-xl overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? 'ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.06]'
                    : 'opacity-50 hover:opacity-80 hover:scale-[1.04]'
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable="false"
                />
                {isActive && (
                  <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PWAImageSlider;
