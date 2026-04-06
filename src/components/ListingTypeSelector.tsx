import React, { useState } from 'react';
import { ShoppingBag, Clock, Home, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ListingType = 'sell' | 'rent' | 'pg';

interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const OPTIONS = [
  {
    id: 'sell' as ListingType,
    number: '01',
    title: 'Sell an item',
    description:
      'List any pre-owned item for a one-time sale — electronics, books, clothing and more.',
    badge: 'Most popular',
    tags: ['Electronics', 'Books', 'Furniture', 'Fashion'],
    Icon: ShoppingBag,
    accent: {
      bar:        'bg-emerald-600',
      icon:       'text-emerald-600',
      iconBg:     'bg-emerald-600/[0.07]',
      arrow:      'text-emerald-600',
      arrowBorder:'group-hover:border-emerald-500 group-[.is-active]:border-emerald-500',
      arrowBg:    'group-hover:bg-emerald-600/[0.07] group-[.is-active]:bg-emerald-600/[0.07]',
      badge:      'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300',
      tag:        'bg-emerald-600/[0.07] text-emerald-800 dark:text-emerald-300 border-emerald-600/[0.15]',
    },
  },
  {
    id: 'rent' as ListingType,
    number: '02',
    title: 'Rent an item',
    description:
      'Lend your belongings on a flexible schedule — hourly, daily, or monthly — and earn passively.',
    badge: null,
    tags: ['Cameras', 'Vehicles', 'Tools', 'Gadgets'],
    Icon: Clock,
    accent: {
      bar:        'bg-blue-600',
      icon:       'text-blue-600',
      iconBg:     'bg-blue-600/[0.07]',
      arrow:      'text-blue-600',
      arrowBorder:'group-hover:border-blue-500 group-[.is-active]:border-blue-500',
      arrowBg:    'group-hover:bg-blue-600/[0.07] group-[.is-active]:bg-blue-600/[0.07]',
      badge:      '',
      tag:        'bg-blue-600/[0.07] text-blue-800 dark:text-blue-300 border-blue-600/[0.15]',
    },
  },
  {
    id: 'pg' as ListingType,
    number: '03',
    title: 'PG / Room',
    description:
      'List your accommodation — PG, hostel room, or apartment — for students seeking a place to stay.',
    badge: null,
    tags: ['Student PG', 'Flat', 'Hostel'],
    Icon: Home,
    accent: {
      bar:        'bg-amber-600',
      icon:       'text-amber-600',
      iconBg:     'bg-amber-600/[0.07]',
      arrow:      'text-amber-600',
      arrowBorder:'group-hover:border-amber-500 group-[.is-active]:border-amber-500',
      arrowBg:    'group-hover:bg-amber-600/[0.07] group-[.is-active]:bg-amber-600/[0.07]',
      badge:      '',
      tag:        'bg-amber-600/[0.07] text-amber-800 dark:text-amber-300 border-amber-600/[0.15]',
    },
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect }) => {
  const [active, setActive] = useState<ListingType | null>(null);

  const handleSelect = (id: ListingType) => {
    setActive(id);
    setTimeout(() => onSelect(id), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: ListingType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(id);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-0 sm:px-2">

      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">
          Step 1 of 2
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground leading-snug">
          What are you listing?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a listing type to get started.
        </p>
      </div>

      {/* ── Card list ── */}
      <div className="flex flex-col rounded-xl border border-border/60 overflow-hidden divide-y divide-border/60 shadow-sm">
        {OPTIONS.map((opt) => {
          const isActive = active === opt.id;
          const { Icon, accent } = opt;

          return (
            <div
              key={opt.id}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`Select ${opt.title}`}
              onClick={() => handleSelect(opt.id)}
              onKeyDown={(e) => handleKeyDown(e, opt.id)}
              className={cn(
                'group relative flex items-center gap-5 px-6 py-5',
                'bg-card cursor-pointer select-none outline-none',
                'transition-colors duration-150 ease-out',
                'hover:bg-muted/40 focus-visible:bg-muted/40',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                isActive && 'is-active bg-muted/40',
              )}
            >
              {/* Left accent bar — scales in on hover / active */}
              <span
                className={cn(
                  'absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full',
                  accent.bar,
                  'scale-y-0 origin-center transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
                  'group-hover:scale-y-100 group-[.is-active]:scale-y-100',
                )}
                aria-hidden
              />

              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                  accent.iconBg,
                )}
              >
                <Icon className={cn('w-5 h-5', accent.icon)} strokeWidth={1.75} />
              </div>

              {/* Text body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                    {opt.number}
                  </span>
                  {opt.badge && (
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md', accent.badge)}>
                      {opt.badge}
                    </span>
                  )}
                </div>

                <p className="text-base font-semibold text-foreground leading-tight mb-1">
                  {opt.title}
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>

                {/* Category tags */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {opt.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'text-[11px] font-medium px-2 py-0.5 rounded-md border',
                        accent.tag,
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow CTA */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  'border border-border/60 bg-transparent',
                  'transition-all duration-150',
                  accent.arrowBorder,
                  accent.arrowBg,
                  'group-hover:translate-x-0.5 group-[.is-active]:translate-x-0.5',
                )}
                aria-hidden
              >
                <ArrowRight className={cn('w-3.5 h-3.5', accent.arrow)} strokeWidth={2.25} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer hint ── */}
      <p className="text-center text-xs text-muted-foreground mt-5">
        You can change this before submitting your listing.
      </p>
    </div>
  );
};

export default ListingTypeSelector;
