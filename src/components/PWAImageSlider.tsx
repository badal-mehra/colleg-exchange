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

/* ─────────────────────────────────────────────
   Loading skeleton
───────────────────────────────────────────── */
const SliderSkeleton = () => (
  <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 gap-3">
      <div className="h-7 w-2/5 rounded-lg bg-slate-300/60 dark:bg-slate-700/60" />
      <div className="h-4 w-3/5 rounded-md bg-slate-300/40 dark:bg-slate-700/40" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Error state
───────────────────────────────────────────── */
const SliderError = () => (
  <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 border border-rose-100 dark:border-rose-900/50">
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
  <div className="space-y-2">
    {slide.title && (
      <h3 className="text-white font-bold text-xl md:text-3xl leading-tight drop-shadow-lg line-clamp-2 group-hover/link:underline underline-offset-4">
        {slide.title}
      </h3>
    )}
    {slide.description && (
      <p className="text-white/70 text-sm md:text-base line-clamp-2 max-w-xl leading-relaxed">
        {slide.description}
      </p>
    )}
    {slide.link_url && (
      <div className="inline-flex items-center gap-1.5 text-white/60 text-xs font-medium mt-1 group-hover/link:text-white/90 transition-colors">
        <ArrowUpRight className="w-3.5 h-3.5" />
        <span>Learn more</span>
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
  if (loading)       return <SliderSkeleton />;
  if (fetchError)    return <SliderError />;
  if (!images.length) return null;

  const slide  = images[currentIndex];
  const hasNav = images.length > 1;

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div className="w-full space-y-3">

      {/* Screen-reader live region */}
      <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* ── Main slider ───────────────────── */}
      <div
        ref={containerRef}
        role="region"
        aria-label="Image carousel"
        tabIndex={0}
        className="relative w-full overflow-hidden rounded-3xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide image stack */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9]">
          {images.map((image, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={image.id}
                aria-hidden={!isActive}
                className={[
                  'absolute inset-0 transition-all ease-in-out',
                  isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-[1.04]',
                ].join(' ')}
                style={{ transitionDuration: `${TRANSITION_MS}ms` }}
              >
                <img
                  src={image.image_url}
                  alt={image.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable="false"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
              </div>
            );
          })}

          {/* ── Overlay UI (3-zone layout: top / middle / bottom) ── */}
          <div className="absolute inset-0 z-20 flex flex-col pointer-events-none">

            {/* ── ZONE 1: TOP ─ progress bars + controls ─────────── */}
            <div className="flex flex-col gap-2.5 px-4 md:px-6 pt-4">

              {/* Stories-style segmented progress bars */}
              {hasNav && (
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === currentIndex ? 'true' : undefined}
                      className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/30 relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
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

              {/* Counter + play/pause */}
              <div className="flex items-center justify-between">
                {hasNav ? (
                  <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1 flex items-center gap-1.5">
                    <span className="text-white font-bold text-xs tabular-nums tracking-wide">
                      {String(currentIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white/30 text-[10px]">／</span>
                    <span className="text-white/50 text-[10px] tabular-nums">
                      {String(images.length).padStart(2, '0')}
                    </span>
                  </div>
                ) : <div />}

                {hasNav && (
                  <button
                    className="bg-black/30 backdrop-blur-md border border-white/10 rounded-full w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 active:scale-90 transition-all duration-200 pointer-events-auto"
                    onClick={() => setIsAutoPlay(p => !p)}
                    aria-label={isAutoPlay ? 'Pause autoplay' : 'Resume autoplay'}
                  >
                    {isAutoPlay
                      ? <Pause className="w-3 h-3 fill-current" />
                      : <Play  className="w-3 h-3 fill-current" />}
                  </button>
                )}
              </div>
            </div>

            {/* ── ZONE 2: MIDDLE ─ flex spacer ───────────────────── */}
            <div className="flex-1" />

            {/* ── ZONE 3: BOTTOM ─ text + arrows ─────────────────── */}
            <div className="flex items-end justify-between gap-4 px-4 md:px-6 pb-5 md:pb-7">

              {/* Slide text — re-mounts on change for entrance animation */}
              <div
                key={`content-${currentIndex}`}
                className="flex-1 min-w-0 animate-in slide-in-from-bottom-3 fade-in duration-500 fill-mode-both"
                style={{ pointerEvents: slide.link_url ? 'auto' : 'none' }}
              >
                {slide.link_url ? (
                  <button
                    className="text-left group/link w-full"
                    onClick={() => handleSlideClick(slide.link_url)}
                    aria-label={slide.title ? `${slide.title} — open link` : 'Open slide link'}
                  >
                    <SlideContent slide={slide} />
                  </button>
                ) : (
                  <SlideContent slide={slide} />
                )}
              </div>

              {/* Arrow buttons — desktop only */}
              {hasNav && (
                <div className="hidden md:flex items-center gap-2 pointer-events-auto flex-shrink-0">
                  <button
                    onClick={goToPrevious}
                    disabled={isTransitioning}
                    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={isTransitioning}
                    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
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
          className="flex gap-2 overflow-x-auto"
          role="tablist"
          aria-label="Slide thumbnails"
          style={{ scrollbarWidth: 'none' }}
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
                className={[
                  'relative flex-shrink-0 w-16 h-10 md:w-24 md:h-[3.5rem] rounded-xl overflow-hidden',
                  'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isActive
                    ? 'ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.06]'
                    : 'opacity-45 hover:opacity-75 hover:scale-[1.04]',
                ].join(' ')}
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
