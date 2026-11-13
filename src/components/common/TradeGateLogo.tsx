import React from 'react';

export interface TradeGateLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withBackground?: boolean;
  variant?: 'mark-only' | 'full';
  showBadge?: boolean;
  badgeText?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-4 h-4', text: 'text-xs', badge: 'text-[9px]' },
  sm: { box: 'w-6 h-6', text: 'text-sm', badge: 'text-[9px]' },
  md: { box: 'w-8 h-8', text: 'text-sm sm:text-base', badge: 'text-[10px]' },
  lg: { box: 'w-10 h-10', text: 'text-lg', badge: 'text-[11px]' },
  xl: { box: 'w-14 h-14', text: 'text-2xl', badge: 'text-xs' },
};

export const TradeGateLogo: React.FC<TradeGateLogoProps> = ({
  size = 'md',
  className = '',
  withBackground = true,
  variant = 'mark-only',
  showBadge = true,
  badgeText = 'CRYPTO',
}) => {
  const currentSize = SIZE_MAP[size];

  const Mark = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentSize.box} shrink-0 ${className}`}
      aria-label="TradeGate Logo"
    >
      <defs>
        <linearGradient id="tg-monolith-gradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#FCD535" />
          <stop offset="100%" stopColor="#F0B90B" />
        </linearGradient>
      </defs>

      {/* Optional Elevated Squircle Container (Adaptive for Light and Dark modes) */}
      {withBackground && (
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="22"
          strokeWidth="2.5"
          className="fill-[#EAECEF] dark:fill-[#1E2329] stroke-[#D0D5DD] dark:stroke-[#2B313A] transition-colors"
        />
      )}

      {/* Top T Crossbar (Gate Lintel) */}
      <path
        d="M22 26H78"
        stroke="url(#tg-monolith-gradient)"
        strokeWidth="8.5"
        strokeLinecap="round"
      />

      {/* Interlocking Monogram: T Stem looping into G Terminal */}
      <path
        d="M42 26V74H68C73.5228 74 78 69.5228 78 64V52H56"
        stroke="url(#tg-monolith-gradient)"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Execution Core Accent */}
      <circle cx="56" cy="39" r="3.5" fill="#F0B90B" />
    </svg>
  );

  if (variant === 'mark-only') {
    return Mark;
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0 select-none">
      {Mark}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`font-black tracking-tight text-text-primary ${currentSize.text}`}>
          TradeGate
        </span>
        {showBadge && (
          <span
            className={`font-mono font-bold px-1.5 py-0.5 rounded-md bg-brand/15 text-brand tracking-wider ${currentSize.badge}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

