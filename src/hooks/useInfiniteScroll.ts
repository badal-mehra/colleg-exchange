import { useEffect, useRef } from 'react';

interface Options {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

/**
 * Attach the returned ref to a sentinel div at the end of a list.
 * When the sentinel intersects the viewport, onLoadMore() fires.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '400px',
}: Options) {
  const sentinelRef = useRef<T | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          onLoadMore();
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, rootMargin]);

  return sentinelRef;
}
