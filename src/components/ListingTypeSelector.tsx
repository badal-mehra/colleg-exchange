import React, { useState } from 'react';

// ─── Type Export (matches original import in SellItem.tsx) ─────────────────
export type ListingType = 'sell' | 'rent' | 'pg';

// ─── Card Data ─────────────────────────────────────────────────────────────
interface ListingOption {
  type: ListingType;
  label: string;
  tagline: string;
  description: string;
  perks: string[];
  emoji: string;
  gradient: string;
  accentColor: string;
  iconBg: string;
  badge?: string;
}

const OPTIONS: ListingOption[] = [
  {
    type: 'sell',
    label: 'Sell an Item',
    tagline: 'Turn clutter into cash',
    description: 'List anything — gadgets, books, clothing, furniture — and reach buyers on campus instantly.',
    perks: ['One-time payment', 'Photo gallery', 'Boost with promotions'],
    emoji: '🛍️',
    gradient: 'from-orange-400 to-rose-500',
    accentColor: '#f97316',
    iconBg: 'bg-orange-50 dark:bg-orange-950/40',
    badge: 'Most Popular',
  },
  {
    type: 'rent',
    label: 'Rent Out',
    tagline: 'Earn while you keep it',
    description: 'Put your belongings to work. Set hourly, daily, weekly or monthly rental terms — you stay in control.',
    perks: ['Flexible duration', 'Deposit protection', 'Set your schedule'],
    emoji: '🔄',
    gradient: 'from-violet-500 to-indigo-500',
    accentColor: '#8b5cf6',
    iconBg: 'bg-violet-50 dark:bg-violet-950/40',
  },
  {
    type: 'pg',
    label: 'PG / Room',
    tagline: 'Find the perfect roommate',
    description: 'List your PG, flat, or hostel room. Reach students searching for accommodation near campus.',
    perks: ['Room details & amenities', 'Photo tours', 'Direct WhatsApp contact'],
    emoji: '🏠',
    gradient: 'from-emerald-400 to-teal-500',
    accentColor: '#10b981',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────
interface ListingTypeSelectorProps {
  onSelect: (type: ListingType) => void;
}

// ─── Main Component ─────────────────────────────────────────────────────────
const ListingTypeSelector: React.FC<ListingTypeSelectorProps> = ({ onSelect }) => {
  const [hovered, setHovered] = useState<ListingType | null>(null);
  const [selected, setSelected] = useState<ListingType | null>(null);

  const handleSelect = (type: ListingType) => {
    setSelected(type);
    // Small delay for the "selected" pulse animation to be visible before navigating
    setTimeout(() => onSelect(type), 220);
  };

  return (
    <>
      {/* ── Inline styles (no Tailwind JIT needed for custom keyframes) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');

        .lts-root {
          font-family: 'DM Sans', sans-serif;
        }
        .lts-heading {
          font-family: 'Sora', sans-serif;
        }

        /* ── Entrance animation ── */
        @keyframes lts-slide-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lts-card {
          animation: lts-slide-up 0.45s cubic-bezier(.22,1,.36,1) both;
        }
        .lts-card:nth-child(1) { animation-delay: 0.08s; }
        .lts-card:nth-child(2) { animation-delay: 0.18s; }
        .lts-card:nth-child(3) { animation-delay: 0.28s; }

        /* ── Title block ── */
        @keyframes lts-fade-in {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lts-title-block {
          animation: lts-fade-in 0.4s ease both;
        }

        /* ── Selected pulse ── */
        @keyframes lts-pulse-ring {
          0%   { box-shadow: 0 0 0 0 var(--ring-color); }
          70%  { box-shadow: 0 0 0 12px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        .lts-selected-pulse {
          animation: lts-pulse-ring 0.5s ease forwards;
        }

        /* ── Hover glow ── */
        .lts-card-inner {
          transition: transform 0.22s cubic-bezier(.22,1,.36,1),
                      box-shadow 0.22s cubic-bezier(.22,1,.36,1),
                      border-color 0.18s ease;
        }
        .lts-card-inner:hover {
          transform: translateY(-5px) scale(1.012);
        }

        /* ── Perk row fade-in ── */
        @keyframes lts-perk-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lts-perk {
          animation: lts-perk-in 0.3s ease both;
        }
        .lts-perk:nth-child(1) { animation-delay: 0.05s; }
        .lts-perk:nth-child(2) { animation-delay: 0.12s; }
        .lts-perk:nth-child(3) { animation-delay: 0.19s; }

        /* ── CTA arrow ── */
        .lts-arrow {
          transition: transform 0.2s ease;
          display: inline-block;
        }
        .lts-card-inner:hover .lts-arrow {
          transform: translateX(5px);
        }

        /* ── Emoji bounce on hover ── */
        @keyframes lts-emoji-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          40%       { transform: translateY(-6px) scale(1.12); }
          70%       { transform: translateY(-2px) scale(1.05); }
        }
        .lts-card-inner:hover .lts-emoji {
          animation: lts-emoji-bounce 0.55s ease;
        }

        /* ── Gradient stripe ── */
        .lts-stripe {
          height: 4px;
          border-radius: 4px 4px 0 0;
          transition: height 0.22s ease;
        }
        .lts-card-inner:hover .lts-stripe {
          height: 6px;
        }

        /* ── Badge shimmer ── */
        @keyframes lts-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .lts-badge {
          background: linear-gradient(90deg, #f97316, #fb923c, #fed7aa, #fb923c, #f97316);
          background-size: 200% auto;
          animation: lts-shimmer 2.5s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Dark mode cards ── */
        .dark .lts-card-inner {
          background: #1c1c27;
          border-color: #2e2e40;
        }
        .dark .lts-card-inner:hover {
          border-color: var(--card-accent);
          box-shadow: 0 16px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px var(--card-accent);
        }
      `}</style>

      <div className="lts-root w-full">

        {/* ── Title Block ── */}
        <div className="lts-title-block text-center mb-10 px-4">
          <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
            New Listing
          </div>
          <h2 className="lts-heading text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-3">
            What are you listing<span className="text-orange-500">?</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-md mx-auto">
            Pick a category below and we'll guide you through the rest.
          </p>
        </div>

        {/* ── Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-0">
          {OPTIONS.map((option) => {
            const isHovered  = hovered === option.type;
            const isSelected = selected === option.type;

            return (
              <div key={option.type} className="lts-card">
                <button
                  type="button"
                  className="lts-card-inner w-full text-left rounded-2xl border-2 bg-white dark:bg-[#1c1c27] overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/50"
                  style={{
                    borderColor: isHovered || isSelected ? option.accentColor : undefined,
                    boxShadow: isHovered
                      ? `0 16px 48px -12px ${option.accentColor}33, 0 0 0 1px ${option.accentColor}44`
                      : '0 2px 12px -4px rgba(0,0,0,0.08)',
                    // Used by .dark CSS rule
                    ['--card-accent' as string]: option.accentColor,
                    ['--ring-color' as string]: option.accentColor + '44',
                  } as React.CSSProperties}
                  onMouseEnter={() => setHovered(option.type)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleSelect(option.type)}
                  aria-label={`Select ${option.label}`}
                >
                  {/* Gradient stripe at top */}
                  <div
                    className={`lts-stripe bg-gradient-to-r ${option.gradient}`}
                  />

                  <div className="p-6">
                    {/* Badge row */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Emoji icon */}
                      <div className={`${option.iconBg} w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0`}>
                        <span className="lts-emoji select-none">{option.emoji}</span>
                      </div>

                      {/* "Most Popular" badge */}
                      {option.badge && (
                        <span className="inline-flex items-center gap-1 border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/40 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                          <span className="lts-badge">{option.badge}</span>
                        </span>
                      )}
                    </div>

                    {/* Label + Tagline */}
                    <div className="mb-3">
                      <h3 className="lts-heading text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                        {option.label}
                      </h3>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: option.accentColor }}
                      >
                        {option.tagline}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">
                      {option.description}
                    </p>

                    {/* Perks list */}
                    <ul className="space-y-1.5 mb-6">
                      {option.perks.map((perk) => (
                        <li
                          key={perk}
                          className="lts-perk flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                            style={{ background: option.accentColor }}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                          {perk}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Row */}
                    <div
                      className="flex items-center justify-between pt-4 border-t dark:border-gray-700/60"
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{ color: option.accentColor }}
                      >
                        Get started
                      </span>
                      <span
                        className="lts-arrow w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={{ background: option.accentColor }}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Bottom hint ── */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-8">
          You can always go back and change the listing type.
        </p>
      </div>
    </>
  );
};

export default ListingTypeSelector;
