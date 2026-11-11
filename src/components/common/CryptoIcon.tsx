import React, { useState } from 'react';

interface CryptoIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-4 h-4 text-[9px]',
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-6 h-6 text-xs',
  lg: 'w-8 h-8 text-sm',
  xl: 'w-10 h-10 text-base',
};

const PIXEL_SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

export function normalizeCryptoSymbol(raw: string): string {
  if (!raw) return 'BTC';
  let sym = raw.trim().toUpperCase();

  // If the symbol itself is a primary quote/base currency, preserve it directly
  const baseAssets = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'USD', 'EUR', 'DAI'];
  if (baseAssets.includes(sym)) {
    return sym;
  }

  // Strip trading pairs slashes, hyphens, and underscores
  sym = sym.replace(/[\/\-_]/g, '');

  // Strip perpetual suffixes (.P, PERP)
  sym = sym.replace(/\.P$/i, '').replace(/PERP$/i, '');

  // Strip quote currencies (longest first) only if it leaves a symbol intact
  const stripped = sym.replace(/(USDT|USDC|FDUSD|BUSD|TUSD|USD|EUR)$/i, '');
  if (stripped.length > 0) {
    sym = stripped;
  }

  // Strip numeric multiplier prefixes (e.g. 1000PEPE -> PEPE, 1000000BONK -> BONK)
  sym = sym.replace(/^\d+/, '');

  return sym || 'BTC';
}

function getDeterministicGradients(str: string): { from: string; to: string; text: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { from: '#6366F1', to: '#A855F7', text: '#FFFFFF' },
    { from: '#EC4899', to: '#F43F5E', text: '#FFFFFF' },
    { from: '#F59E0B', to: '#EF4444', text: '#FFFFFF' },
    { from: '#10B981', to: '#06B6D4', text: '#FFFFFF' },
    { from: '#3B82F6', to: '#1D4ED8', text: '#FFFFFF' },
    { from: '#8B5CF6', to: '#6D28D9', text: '#FFFFFF' },
    { from: '#14B8A6', to: '#0F766E', text: '#FFFFFF' },
    { from: '#06B6D4', to: '#0284C7', text: '#FFFFFF' },
  ];
  const idx = Math.abs(hash) % palettes.length;
  return palettes[idx];
}

  const INLINE_CRYPTO_SVGS: Record<string, (size: number, gradId?: string) => React.ReactNode > = {
  BTC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#FFFFFF"
        fillRule="nonzero"
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
      />
    </svg>
  ),
    ETH: (size) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <g fill="#FFFFFF" fillRule="nonzero">
          <path fillOpacity=".6" d="M16.498 4v8.87l7.497 3.35z" />
          <path d="M16.498 4L9 16.22l7.498-3.35z" />
          <path fillOpacity=".6" d="M16.498 21.968v6.027L24 17.616z" />
          <path d="M16.498 27.995v-6.028L9 17.616z" />
          <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.349z" />
          <path fillOpacity=".6" d="M9 16.22l7.498 4.353v-7.702z" />
        </g>
      </svg>
    ),
        SOL: (size, gradId = 'sol_g_default') => (
          <svg width = { size } height = { size } viewBox = "0 0 36 36" fill = "none">
      <defs>
        <linearGradient id = { gradId } x1 = "90.7%" y1 = "34.8%" x2 = "35.5%" y2 = "55.4%">
          <stop stopColor = "#00FFA3" offset = "0%" />
    < stop stopColor = "#03E1FF" offset = "50%" />
      <stop stopColor="#DC1FFF" offset="100%" />
        </linearGradient >
      </defs >
      <circle cx="18" cy="18" r="17.5" fill="#0C0F17" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="1" />
      <g fill="none" fillRule="nonzero" transform="translate(6, 9)">
        {/* Top Bar */}
        <path
          d="M 3.9 0.23 c 0.15 -0.146 0.35 -0.23 0.554 -0.23 h 19.153 c 0.35 0 0.525 0.422 0.277 0.67 l -3.783 3.783 a 0.785 0.785 0 0 1 -0.555 0.23 H 0.393 a 0.392 0.392 0 0 1 -0.277 -0.67 L 3.899 0.229 z"
          fill={`url(#${gradId}) #00FFA3`}
        />
        {/* Middle Bar */}
        <path
          d="M 20.1 7.247 a 0.785 0.785 0 0 0 -0.554 -0.23 H 0.393 a 0.392 0.392 0 0 0 -0.277 0.67 l 3.783 3.784 c 0.145 0.145 0.344 0.23 0.555 0.23 h 19.153 c 0.35 0 0.525 -0.423 0.277 -0.67 l -3.783 -3.784 z"
          fill={`url(#${gradId}) #03E1FF`}
        />
        {/* Bottom Bar */}
        <path
          d="M 3.9 14.355 a 0.785 0.785 0 0 1 0.554 -0.23 h 19.153 c 0.35 0 0.525 0.423 0.277 0.67 l -3.783 3.784 a 0.785 0.785 0 0 1 -0.555 0.23 H 0.393 a 0.392 0.392 0 0 1 -0.277 -0.67 l 3.783 -3.784 z"
          fill={`url(#${gradId}) #DC1FFF`}
        />
      </g>
    </svg >
  ),
  BNB: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <g fill="#FFFFFF" transform="translate(5, 5) scale(0.04296875)">
        <path d="M193.73 214.59l62.27-62.27 62.27 62.27 35.36-35.36L256 108.5 96 268.5l35.36 35.36 62.37-62.27zm0 82.82l62.27 62.27 62.27-62.27 35.36 35.36L256 403.5 96 243.5l35.36-35.36 62.37 62.27zm125.86-41.41L256 193.73l-63.59 63.59L256 320.91l63.59-63.59zM141.31 237.58L106 272.89l50.3 50.3 35.31-35.31-50.3-50.3zm229.38 0l-50.3 50.3 35.31 35.31 50.3-50.3-35.31-35.31z" />
      </g>
    </svg>
  ),
    XRP: (size) => (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15.5" fill="#23292F" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="1" />
        <path
          fill="#FFFFFF"
          d="M22.363 8h2.602l-5.414 5.361a5.06 5.06 0 0 1-7.102 0L7.032 8h2.605l4.113 4.071a3.2 3.2 0 0 0 4.496 0zM9.605 22.906H7l5.45-5.393a5.06 5.06 0 0 1 7.1 0L25 22.906h-2.605L18.25 18.8a3.2 3.2 0 0 0-4.496 0z"
        />
      </svg>
    ),
      HYPE: (size) => (
        <svg width={size} height={size} viewBox="0 0 144 144" fill="none">
          <circle cx="72" cy="72" r="70" fill="#0B1317" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="4" />
          <g transform="translate(18, 18) scale(0.75)">
            <path
              fill="#97FCE4"
              d="M144 71.7c0 47.606-29.134 62.882-44.484 49.28-12.636-11.091-16.395-34.528-35.4-36.934-24.122-3.035-26.21 29.087-42.083 29.087C3.55 113.133 0 86.243 0 72.432c0-14.126 3.968-33.378 19.736-33.378 18.379 0 19.423 27.518 42.396 26.053 22.869-1.57 23.286-30.238 38.115-42.48C113.195 12.06 144 23.464 144 71.7"
            />
          </g>
        </svg>
      ),
        ZEC: (size) => (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#ECB244" />
            <path
              fill="#FFFFFF"
              fillRule="nonzero"
              d="M15.096 19.846h6.297v3.35h-3.875c.064.958.097 1.847.161 2.804h-3.261v-2.77h-3.876c0-1.093-.129-2.187.065-3.213.097-.547.678-1.026 1.033-1.504a462.137 462.137 0 013.714-4.581c.485-.582.969-1.129 1.518-1.778h-6.04v-3.35h3.586V6h3.132v2.735h3.908c0 1.128.129 2.222-.065 3.248-.097.547-.678 1.026-1.065 1.504a462.138 462.138 0 01-3.714 4.581 37.083 37.083 0 01-1.518 1.778z"
            />
          </svg>
        ),
          USDT: (size) => (
            <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#26A17B" />
              <path
                d="M17.9 15.1v-2.2h5.5V9.4H8.6v3.5h5.5v2.2C9.5 15.3 6 16.2 6 17.3c0 1.1 3.5 2 8.1 2.2v5.6h3.8v-5.6c4.6-.2 8.1-1.1 8.1-2.2 0-1.1-3.5-2-8.1-2.2zm0 3.3v-.1c-3.7-.2-6.5-.8-6.5-1.5 0-.7 2.8-1.3 6.5-1.5v3.1zm3.8-1.5c0 .7-2.8 1.3-6.5 1.5v-3.1c3.7.2 6.5.8 6.5 1.6z"
                fill="#FFFFFF"
              />
            </svg>
          ),
            USDC: (size) => (
              <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#2775CA" />
                <path
                  d="M16 6a10 10 0 100 20 10 10 0 000-20zm0 18.2A8.2 8.2 0 1116 7.8a8.2 8.2 0 010 16.4zm.9-12.8h-2.1v.9c-.8.1-1.6.5-2 1.1-.5.7-.7 1.6-.5 2.5.3 1.4 1.5 2.1 2.9 2.4 1.2.3 1.7.6 1.7 1.1 0 .6-.6 1-1.5 1-.9 0-1.6-.4-1.9-1.2l-1.3.6c.4 1.1 1.4 1.8 2.6 2v.9h2.1v-.9c.9-.1 1.7-.6 2.2-1.3.5-.8.6-1.7.4-2.5-.3-1.4-1.5-2.1-2.9-2.4-1.1-.3-1.7-.6-1.7-1.1 0-.6.5-.9 1.4-.9.8 0 1.4.3 1.7 1l1.3-.6c-.4-1-1.3-1.7-2.4-1.9v-.9z"
                  fill="#FFFFFF"
                />
              </svg>
            ),
};

export const CMC_COIN_IDS: Record<string, number> = {
  BTC: 1,
  ETH: 1027,
  USDT: 825,
  BNB: 1839,
  USDC: 3408,
  XRP: 52,
  SOL: 5426,
  TRX: 1958,
  ZEC: 1437,
  HYPE: 32196,
  XMR: 328,
  DOGE: 74,
  LEO: 3957,
  LINK: 1975,
  ADA: 2010,
  XLM: 512,
  USDE: 29470,
  BCH: 1831,
  NEAR: 6535,
  DAI: 4943,
  UNI: 7083,
  LTC: 2,
  AVAX: 5805,
  SUI: 20947,
  HBAR: 4642,
  SHIB: 5994,
  TAO: 22974,
  CRO: 3635,
  QNT: 3155,
  PEPE: 24478,
  ENA: 30171,
  AAVE: 7278,
  OKB: 3897,
  ONDO: 21159,
  MNT: 27075,
  DOT: 6636,
  ICP: 8916,
  BGB: 11092,
  ARB: 11841,
  WLD: 13502,
  JST: 5488,
  MORPHO: 34104,
  ETC: 1321,
  GT: 4269,
  KCS: 2087,
  POL: 28321,
  MATIC: 3890,
  JUP: 29210,
  ALGO: 4030,
  RENDER: 5690,
  RNDR: 5690,
  KAS: 20396,
  INJ: 7226,
  ATOM: 3794,
  CAKE: 7186,
  FIL: 2280,
  XDC: 2634,
  AERO: 29270,
  ZRO: 26997,
  DASH: 131,
  ETHFI: 29814,
  STX: 4847,
  APT: 21794,
  PYTH: 28177,
  RAY: 8526,
  FLR: 7950,
  NEXO: 2694,
  VET: 3077,
  TIA: 22861,
  CRV: 6538,
  PENGU: 34466,
  VIRTUAL: 29420,
  FET: 3773,
  BTT: 16086,
  SEI: 23149,
  BSV: 3602,
  TRUMP: 35336,
  STRK: 22691,
  SUN: 10529,
  GNO: 1659,
  XTZ: 2011,
  PENDLE: 9481,
  LDO: 8000,
  BONK: 23095,
  IMX: 10603,
  OP: 11840,
  LUNC: 4172,
  CFX: 7334,
  BEAM: 28298,
  DCR: 1168,
  AR: 5632,
  GRT: 6719,
  COMP: 5692,
  KAIA: 32880,
  WIF: 28752,
  FLOKI: 10804,
  FTM: 3513,
  S: 3513,
  THETA: 2416,
  MANA: 1966,
  SAND: 5864,
  AXS: 6783,
  DYDX: 28324,
  JTO: 28541,
  DRIFT: 29944,
  ENS: 13855,
  MOVE: 34358,
  BLUR: 23121,
  '1INCH': 8104,
  MEW: 30126,
  RUNE: 4157,
  MKR: 1518,
  CHZ: 4066,
  FLOW: 4558,
  EGLD: 6892,
  IOTA: 1720,
  ROSE: 7653,
  GALA: 7080,
  KAVA: 4846,
  SNX: 2586,
  ASTR: 12885,
  RON: 14101,
  ME: 33878,
  NEO: 1376,
  EOS: 1765,
  KITE: 38828,
  PI: 35697,
  WLFI: 33251,
  PUMP: 36507,
  SPX: 28081,
  DOGS: 32698,
  FDUSD: 26081,
};

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  symbol,
  size = 'md',
  className = '',
}) => {
  const [loadStage, setLoadStage] = useState<'cmc' | 'coincap' | 'fallback'>('cmc');
  const normalized = normalizeCryptoSymbol(symbol);
  const pixelSize = PIXEL_SIZE_MAP[size] || 24;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  // React useId generates a unique instance ID to prevent SVG paint server / linearGradient ID collisions
  const rawId = React.useId();
  const gradId = `sol_g_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  // 1. High-fidelity inline vector SVGs for core tokens
  const inlineSvgRenderer = INLINE_CRYPTO_SVGS[normalized];
  if (inlineSvgRenderer) {
  return (
    <span className={`inline-flex items-center justify-center shrink-0 align-middle ${sizeClass} ${className}`}>
      {inlineSvgRenderer(pixelSize, gradId)}
    </span>
  );
}

// 2. Official CoinMarketCap CDN Logo (64x64)
const cmcId = CMC_COIN_IDS[normalized];
if (cmcId && loadStage === 'cmc') {
  return (
    <img
      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`}
      alt={normalized}
      width={pixelSize}
      height={pixelSize}
      loading="lazy"
      onError={() => setLoadStage('coincap')}
      className={`rounded-full shrink-0 object-cover inline-block align-middle ${sizeClass} ${className}`}
    />
  );
}

// 3. CoinCap 2x CDN Logo
if (loadStage === 'cmc' || loadStage === 'coincap') {
  const cdnUrl = `https://assets.coincap.io/assets/icons/${normalized.toLowerCase()}@2x.png`;
  return (
    <img
      src={cdnUrl}
      alt={normalized}
      width={pixelSize}
      height={pixelSize}
      loading="lazy"
      onError={() => setLoadStage('fallback')}
      className={`rounded-full shrink-0 object-cover inline-block align-middle ${sizeClass} ${className}`}
    />
  );
}

// 4. Deterministic Monogram Fallback
const { from, to, text } = getDeterministicGradients(normalized);
const initials = normalized.slice(0, 3);

return (
  <span
    className={`inline-flex items-center justify-center shrink-0 rounded-full font-mono font-bold uppercase select-none shadow-xs border border-white/10 align-middle ${sizeClass} ${className}`}
    style={{
      background: `linear-gradient(135deg, ${from}, ${to})`,
      color: text,
    }}
    title={symbol}
  >
    {initials}
  </span>
);
};
