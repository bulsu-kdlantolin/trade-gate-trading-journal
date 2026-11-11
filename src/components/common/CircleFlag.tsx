import React from 'react';

export interface CircleFlagProps {
  country?: string; // Currency code or country code (e.g. 'USD' or 'US')
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PIXEL_SIZES: Record<string, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

const CODE_MAP: Record<string, string> = {
  USD: 'US',
  PHP: 'PH',
  EUR: 'EU',
  GBP: 'GB',
  JPY: 'JP',
  CAD: 'CA',
  AUD: 'AU',
  SGD: 'SG',
  INR: 'IN',
  BRL: 'BR',
  KRW: 'KR',
  CHF: 'CH',
};

const FLAG_RENDERERS: Record<string, (size: number) => React.ReactNode> = {
  // United States (USD)
  US: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="us-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#us-mask)">
        {/* Red background */}
        <rect width="32" height="32" fill="#B22234" />
        {/* White stripes */}
        <path
          d="M0 4.9h32M0 9.8h32M0 14.8h32M0 19.7h32M0 24.6h32M0 29.5h32"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        {/* Blue canton */}
        <rect width="15" height="17.2" fill="#3C3B6E" />
        {/* Stars */}
        <g fill="#FFFFFF" transform="translate(1.5, 1.5) scale(0.75)">
          <circle cx="3" cy="3" r="1.1" />
          <circle cx="8" cy="3" r="1.1" />
          <circle cx="13" cy="3" r="1.1" />
          <circle cx="5.5" cy="7" r="1.1" />
          <circle cx="10.5" cy="7" r="1.1" />
          <circle cx="3" cy="11" r="1.1" />
          <circle cx="8" cy="11" r="1.1" />
          <circle cx="13" cy="11" r="1.1" />
          <circle cx="5.5" cy="15" r="1.1" />
          <circle cx="10.5" cy="15" r="1.1" />
        </g>
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // Philippines (PHP)
  PH: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="ph-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#ph-mask)">
        {/* Blue top */}
        <rect width="32" height="16" fill="#0038A8" />
        {/* Red bottom */}
        <rect y="16" width="32" height="16" fill="#CE1126" />
        {/* White chevron triangle */}
        <polygon points="0,0 17,16 0,32" fill="#FFFFFF" />
        {/* Golden Sun */}
        <circle cx="5.5" cy="16" r="2.8" fill="#FCD116" />
        <g stroke="#FCD116" strokeWidth="0.8">
          <line x1="5.5" y1="11.5" x2="5.5" y2="20.5" />
          <line x1="1" y1="16" x2="10" y2="16" />
          <line x1="2.3" y1="12.8" x2="8.7" y2="19.2" />
          <line x1="2.3" y1="19.2" x2="8.7" y2="12.8" />
        </g>
        {/* Three Yellow Stars */}
        <circle cx="2" cy="4" r="0.8" fill="#FCD116" />
        <circle cx="13" cy="16" r="0.8" fill="#FCD116" />
        <circle cx="2" cy="28" r="0.8" fill="#FCD116" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // European Union (EUR)
  EU: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#003399" />
      <g fill="#FFCC00" transform="translate(16, 16)">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x = 9.5 * Math.sin(rad);
          const y = -9.5 * Math.cos(rad);
          return <circle key={i} cx={x} cy={y} r="1.1" />;
        })}
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // United Kingdom (GBP)
  GB: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="gb-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#gb-mask)">
        <rect width="32" height="32" fill="#012169" />
        {/* White saltire */}
        <line x1="0" y1="0" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="0" y1="32" x2="32" y2="0" stroke="#FFFFFF" strokeWidth="6" />
        {/* Red saltire */}
        <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" strokeWidth="2.4" />
        <line x1="0" y1="32" x2="32" y2="0" stroke="#C8102E" strokeWidth="2.4" />
        {/* White cross */}
        <line x1="16" y1="0" x2="16" y2="32" stroke="#FFFFFF" strokeWidth="9" />
        <line x1="0" y1="16" x2="32" y2="16" stroke="#FFFFFF" strokeWidth="9" />
        {/* Red cross */}
        <line x1="16" y1="0" x2="16" y2="32" stroke="#C8102E" strokeWidth="5" />
        <line x1="0" y1="16" x2="32" y2="16" stroke="#C8102E" strokeWidth="5" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // Japan (JPY)
  JP: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F8F9FA" />
      <circle cx="16" cy="16" r="6.8" fill="#BC002D" />
      <circle cx="16" cy="16" r="15.5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
    </svg>
  ),

  // Canada (CAD)
  CA: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="ca-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#ca-mask)">
        <rect width="32" height="32" fill="#FFFFFF" />
        <rect width="8" height="32" fill="#D80027" />
        <rect x="24" width="8" height="32" fill="#D80027" />
        {/* Maple Leaf */}
        <g fill="#D80027" transform="translate(16, 16) scale(0.68)">
          <path d="M0 -12L1.8 -6.5L6.5 -7.5L4 -2.8L9.5 -1.5L8.5 2.5L3.8 2.5L5 6L2.5 5.5L0.8 10L-0.8 10L-2.5 5.5L-5 6L-3.8 2.5L-8.5 2.5L-9.5 -1.5L-4 -2.8L-6.5 -7.5L-1.8 -6.5Z" />
        </g>
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // Australia (AUD)
  AU: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="au-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#au-mask)">
        <rect width="32" height="32" fill="#00008B" />
        {/* Canton mini-Union Jack */}
        <g transform="scale(0.5)">
          <rect width="32" height="32" fill="#012169" />
          <line x1="0" y1="0" x2="32" y2="32" stroke="#FFFFFF" strokeWidth="5" />
          <line x1="0" y1="32" x2="32" y2="0" stroke="#FFFFFF" strokeWidth="5" />
          <line x1="0" y1="0" x2="32" y2="32" stroke="#C8102E" strokeWidth="2" />
          <line x1="0" y1="32" x2="32" y2="0" stroke="#C8102E" strokeWidth="2" />
          <line x1="16" y1="0" x2="16" y2="32" stroke="#FFFFFF" strokeWidth="7" />
          <line x1="0" y1="16" x2="32" y2="16" stroke="#FFFFFF" strokeWidth="7" />
          <line x1="16" y1="0" x2="16" y2="32" stroke="#C8102E" strokeWidth="4" />
          <line x1="0" y1="16" x2="32" y2="16" stroke="#C8102E" strokeWidth="4" />
        </g>
        {/* Commonwealth Star */}
        <circle cx="8" cy="24" r="2.8" fill="#FFFFFF" />
        {/* Southern Cross stars */}
        <circle cx="24" cy="7" r="1" fill="#FFFFFF" />
        <circle cx="21" cy="13" r="1" fill="#FFFFFF" />
        <circle cx="27" cy="15" r="1" fill="#FFFFFF" />
        <circle cx="24" cy="25" r="1.3" fill="#FFFFFF" />
        <circle cx="22" cy="19" r="0.7" fill="#FFFFFF" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // Singapore (SGD)
  SG: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="sg-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#sg-mask)">
        <rect width="32" height="16" fill="#ED2939" />
        <rect y="16" width="32" height="16" fill="#FFFFFF" />
        {/* Crescent Moon */}
        <circle cx="7" cy="8" r="4.5" fill="#FFFFFF" />
        <circle cx="8.5" cy="8" r="4.2" fill="#ED2939" />
        {/* 5 Stars */}
        <circle cx="9.5" cy="5" r="0.6" fill="#FFFFFF" />
        <circle cx="11.5" cy="6.5" r="0.6" fill="#FFFFFF" />
        <circle cx="11" cy="9.2" r="0.6" fill="#FFFFFF" />
        <circle cx="8.5" cy="9.2" r="0.6" fill="#FFFFFF" />
        <circle cx="8" cy="6.5" r="0.6" fill="#FFFFFF" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // India (INR)
  IN: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <mask id="in-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      </mask>
      <g mask="url(#in-mask)">
        <rect width="32" height="10.7" fill="#FF9933" />
        <rect y="10.7" width="32" height="10.6" fill="#FFFFFF" />
        <rect y="21.3" width="32" height="10.7" fill="#138808" />
        {/* Ashoka Chakra */}
        <circle cx="16" cy="16" r="3.6" stroke="#000080" strokeWidth="0.8" fill="none" />
        <circle cx="16" cy="16" r="1" fill="#000080" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // Brazil (BRL)
  BR: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#009739" />
      {/* Yellow Rhombus */}
      <polygon points="16,4 28,16 16,28 4,16" fill="#FEDD00" />
      {/* Blue Circle */}
      <circle cx="16" cy="16" r="6" fill="#012169" />
      {/* White curved band */}
      <path d="M10.8 17.5C12.5 15.2 16.5 14.8 21.2 16.2" stroke="#FFFFFF" strokeWidth="1" fill="none" />
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),

  // South Korea (KRW)
  KR: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F8F9FA" />
      {/* Taegeuk Symbol */}
      <g transform="translate(16, 16) rotate(-35)">
        <path d="M-6 0A6 6 0 0 0 6 0A3 3 0 0 0 0 0A3 3 0 0 1 -6 0Z" fill="#C60C30" />
        <path d="M6 0A6 6 0 0 0 -6 0A3 3 0 0 0 0 0A3 3 0 0 1 6 0Z" fill="#003478" />
      </g>
      {/* Trigrams */}
      <g stroke="#000000" strokeWidth="0.8" fill="none">
        <line x1="7" y1="8" x2="10" y2="6" />
        <line x1="22" y1="6" x2="25" y2="8" />
        <line x1="7" y1="24" x2="10" y2="26" />
        <line x1="22" y1="26" x2="25" y2="24" />
      </g>
      <circle cx="16" cy="16" r="15.5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
    </svg>
  ),

  // Switzerland (CHF)
  CH: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#D52B1E" />
      {/* Equilateral Cross */}
      <rect x="13.2" y="7" width="5.6" height="18" fill="#FFFFFF" rx="0.6" />
      <rect x="7" y="13.2" width="18" height="5.6" fill="#FFFFFF" rx="0.6" />
      <circle cx="16" cy="16" r="15.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  ),
};

export const CircleFlag: React.FC<CircleFlagProps> = ({
  country = 'US',
  size = 'xs',
  className = '',
}) => {
  const pixelSize = PIXEL_SIZES[size] || 16;
  const normalizedKey = (country || 'US').trim().toUpperCase();
  const countryCode = CODE_MAP[normalizedKey] || normalizedKey;
  const renderer = FLAG_RENDERERS[countryCode] || FLAG_RENDERERS.US;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden shadow-2xs select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-hidden="true"
    >
      {renderer(pixelSize)}
    </span>
  );
};

