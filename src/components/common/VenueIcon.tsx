import React, { useState } from 'react';
import { Building2, Cpu, Shield, Globe } from 'lucide-react';

export interface VenueIconProps {
  venue: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  network?: string;
  showNetworkBadge?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

const PIXEL_SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

// Official CoinMarketCap Exchange & Coin CDN URLs for 100% genuine logos
const CMC_VENUE_CDN_URLS: Record<string, string> = {
  // CEX
  binance: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png',
  coinbase: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png',
  bybit: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png',
  okx: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png',
  kraken: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png',
  kucoin: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/311.png',
  bitget: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/513.png',
  gateio: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/302.png',
  gate: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/302.png',
  mexc: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/544.png',
  htx: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/102.png',
  huobi: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/102.png',
  deribit: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/424.png',

  // DEX & Protocols
  raydium: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1113.png',
  jupiter: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png',
  raydiumjupiter: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29210.png',
  uniswap: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1344.png',
  uniswapevm: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1344.png',
  hyperliquid: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png',
  hyperliquidspot: 'https://s2.coinmarketcap.com/static/img/coins/64x64/32196.png',
  pancakeswap: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1165.png',
  aerodrome: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29270.png',
  aerodromebase: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29270.png',
  pumpfun: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36507.png',
  curve: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6538.png',
  curvefinance: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6538.png',
  osmosis: 'https://s2.coinmarketcap.com/static/img/coins/64x64/12220.png',

  // Networks
  solana: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  solananetwork: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  ethereum: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  evm: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  ethereumevm: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  bnb: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  bnbchain: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
  arbitrum: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
  arbitrumnetwork: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
  sui: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png',
  suinetwork: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png',
  ton: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png',
  tonnetwork: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png',
  trustwallet: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5964.png',
};

// Normalize string for key mapping
export function normalizeVenueKey(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[\/\-_()&.\s]/g, '')
    .trim();
}

// Deterministic gradient generator for custom / unlisted user venues
function getVenueDeterministicGradient(name: string): { from: string; to: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { from: '#F0B90B', to: '#F59E0B', text: '#000000' },
    { from: '#3B82F6', to: '#1D4ED8', text: '#FFFFFF' },
    { from: '#10B981', to: '#059669', text: '#FFFFFF' },
    { from: '#8B5CF6', to: '#6D28D9', text: '#FFFFFF' },
    { from: '#EC4899', to: '#BE185D', text: '#FFFFFF' },
    { from: '#06B6D4', to: '#0E7490', text: '#FFFFFF' },
    { from: '#6366F1', to: '#4338CA', text: '#FFFFFF' },
    { from: '#F97316', to: '#C2410C', text: '#FFFFFF' },
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

// High-fidelity Inline Vector SVGs (Razor-sharp, instant 0ms render, 0 network latency, offline-ready)
const INLINE_VENUE_SVGS: Record<string, (size: number) => React.ReactNode> = {
  binance: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F0B90B" />
      <path fill="#000000" d="M16 6.5l3.2 3.2-3.2 3.2-3.2-3.2L16 6.5zm-6.3 6.3l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm12.6 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm-6.3 3.2l1.6 1.6-1.6 1.6-1.6-1.6 1.6-1.6zm0 3.2l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z" />
    </svg>
  ),
  coinbase: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="8" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="4.5" fill="#0052FF" />
      <rect x="15" y="8" width="8" height="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
    </svg>
  ),
  bybit: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#181A20" />
      <path fill="#F7A600" d="M9 8h6a4 4 0 013.2 6.4A4.5 4.5 0 0115.5 24H9V8zm4 3.5v3.5h2a1.75 1.75 0 000-3.5h-2zm0 5.5v3.5h2.5a1.75 1.75 0 000-3.5H13z" />
      <path fill="#FFFFFF" d="M21 8l-3 16h2.5l3-16H21z" />
    </svg>
  ),
  okx: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <rect x="8" y="8" width="4.5" height="4.5" fill="#FFFFFF" rx="0.5" />
      <rect x="19.5" y="8" width="4.5" height="4.5" fill="#FFFFFF" rx="0.5" />
      <rect x="13.75" y="13.75" width="4.5" height="4.5" fill="#FFFFFF" rx="0.5" />
      <rect x="8" y="19.5" width="4.5" height="4.5" fill="#FFFFFF" rx="0.5" />
      <rect x="19.5" y="19.5" width="4.5" height="4.5" fill="#FFFFFF" rx="0.5" />
    </svg>
  ),
  kraken: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#5841D8" />
      <path fill="#FFFFFF" d="M9 11c0-3.87 3.13-7 7-7s7 3.13 7 7v10a2 2 0 01-4 0v-8a1 1 0 00-2 0v8a2 2 0 01-4 0v-8a1 1 0 00-2 0v8a2 2 0 01-4 0V11z" />
    </svg>
  ),
  kucoin: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#24AE8F" />
      <path fill="#FFFFFF" d="M10 8h4v6.5l4-6.5h4.5l-4.8 7.5 5.3 8.5H18.5l-4.5-7.5V24h-4V8z" />
    </svg>
  ),
  bitget: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#00F0FF" />
      <path fill="#002B49" d="M13 9l6 7-6 7h4l6-7-6-7h-4z" />
      <path fill="#0057FF" d="M9 16l4-4v8l-4-4z" />
    </svg>
  ),
  gateio: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1762FF" />
      <path fill="#00D2A0" d="M16 6a10 10 0 00-10 10c0 4.14 2.52 7.7 6.13 9.21L14.5 21a6 6 0 117.5-6H16v4h10A10 10 0 0016 6z" />
      <circle cx="16" cy="16" r="3.5" fill="#FFFFFF" />
    </svg>
  ),
  gate: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1762FF" />
      <path fill="#00D2A0" d="M16 6a10 10 0 00-10 10c0 4.14 2.52 7.7 6.13 9.21L14.5 21a6 6 0 117.5-6H16v4h10A10 10 0 0016 6z" />
      <circle cx="16" cy="16" r="3.5" fill="#FFFFFF" />
    </svg>
  ),
  mexc: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1867FF" />
      <path fill="#FFFFFF" d="M8 22V10l5 7 3-4 5 9h-3.5l-3-5.5L13 19l-3-4.5V22H8z" />
      <path fill="#00D18F" d="M19 22l3-5.5 3 5.5h-6z" />
    </svg>
  ),
  htx: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0066ED" />
      <path fill="#FFFFFF" d="M16 7c-4 5.5-6 9.5-6 12.5a6 6 0 1012 0c0-3-2-7-6-12.5z" />
      <circle cx="16" cy="19" r="2.5" fill="#00E5FF" />
    </svg>
  ),
  deribit: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#181A20" />
      <path fill="#20C589" d="M10 8h7a8 8 0 010 16h-7V8zm4 3.5v9h3a4.5 4.5 0 000-9h-3z" />
    </svg>
  ),
  uniswap: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FF007A" />
      <path fill="#FFFFFF" d="M22.5 12.5c-.8-.5-2.2-.8-3.5-.2-1.5.7-2.3 2.1-3 3.5-.4.8-1 1.7-1.8 1.8-.8.1-1.4-.4-1.7-1.1-.5-1.1-.3-2.6.4-3.6.4-.6.9-1.2 1.5-1.6.4-.3.9-.5 1.3-.7 0 0-1.8-1.7-3.8-.5-1.5.9-2.2 2.6-2.3 4.3 0 1.2.4 2.4 1.1 3.4.9 1.2 2.3 1.9 3.8 1.9 1.8 0 3.4-.9 4.3-2.4.9-1.5 1.6-3.2 2.8-4.3.3-.2.6-.4.9-.5z" />
    </svg>
  ),
  uniswapevm: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FF007A" />
      <path fill="#FFFFFF" d="M22.5 12.5c-.8-.5-2.2-.8-3.5-.2-1.5.7-2.3 2.1-3 3.5-.4.8-1 1.7-1.8 1.8-.8.1-1.4-.4-1.7-1.1-.5-1.1-.3-2.6.4-3.6.4-.6.9-1.2 1.5-1.6.4-.3.9-.5 1.3-.7 0 0-1.8-1.7-3.8-.5-1.5.9-2.2 2.6-2.3 4.3 0 1.2.4 2.4 1.1 3.4.9 1.2 2.3 1.9 3.8 1.9 1.8 0 3.4-.9 4.3-2.4.9-1.5 1.6-3.2 2.8-4.3.3-.2.6-.4.9-.5z" />
    </svg>
  ),
  jupiter: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F5841F" />
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#FFFFFF" strokeWidth="1.8" strokeOpacity="0.9" transform="rotate(-25 16 16)" />
      <circle cx="16" cy="16" r="4.5" fill="#FFFFFF" />
    </svg>
  ),
  raydium: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2B6AFF" />
      <path fill="#00F0FF" d="M16 6l8 10-8 10-8-10 8-10z" />
      <path fill="#FFFFFF" d="M16 10l5 6-5 6-5-6 5-6z" />
    </svg>
  ),
  raydiumjupiter: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F5841F" />
      <ellipse cx="16" cy="16" rx="10" ry="4" stroke="#FFFFFF" strokeWidth="1.8" strokeOpacity="0.9" transform="rotate(-25 16 16)" />
      <circle cx="16" cy="16" r="4.5" fill="#FFFFFF" />
    </svg>
  ),
  hyperliquid: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0B131E" />
      <path fill="#00F294" d="M10 8h3v6.5h6V8h3v16h-3v-6.5h-6V24h-3V8z" />
      <circle cx="16" cy="16" r="2" fill="#50E3C2" />
    </svg>
  ),
  hyperliquidspot: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0B131E" />
      <path fill="#00F294" d="M10 8h3v6.5h6V8h3v16h-3v-6.5h-6V24h-3V8z" />
      <circle cx="16" cy="16" r="2" fill="#50E3C2" />
    </svg>
  ),
  pancakeswap: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#D1884F" />
      <ellipse cx="12" cy="10" rx="2" ry="4" fill="#FFE0B2" transform="rotate(-15 12 10)" />
      <ellipse cx="20" cy="10" rx="2" ry="4" fill="#FFE0B2" transform="rotate(15 20 10)" />
      <circle cx="16" cy="18" r="7" fill="#FFE0B2" />
      <circle cx="13.5" cy="17" r="1" fill="#795548" />
      <circle cx="18.5" cy="17" r="1" fill="#795548" />
      <ellipse cx="16" cy="20" rx="1.5" ry="1" fill="#1FC7D4" />
    </svg>
  ),
  aerodrome: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="9" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
      <path fill="#FFFFFF" d="M16 10l2 6h-4l2-6zm0 12l-2-6h4l-2 6zM10 16l6-2v4l-6-2zm12 0l-6 2v-4l6 2z" />
    </svg>
  ),
  aerodromebase: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="9" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
      <path fill="#FFFFFF" d="M16 10l2 6h-4l2-6zm0 12l-2-6h4l-2 6zM10 16l6-2v4l-6-2zm12 0l-6 2v-4l6 2z" />
    </svg>
  ),
  pumpfun: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0F172A" />
      <g transform="rotate(-45 16 16)">
        <rect x="10" y="8" width="12" height="8" rx="4" fill="#10B981" />
        <rect x="10" y="16" width="12" height="8" rx="4" fill="#FFFFFF" />
        <line x1="10" y1="16" x2="22" y2="16" stroke="#059669" strokeWidth="1" />
      </g>
    </svg>
  ),
  curve: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1E40AF" />
      <ellipse cx="16" cy="16" rx="8" ry="5" stroke="#F59E0B" strokeWidth="2" transform="rotate(30 16 16)" />
      <circle cx="16" cy="16" r="3" fill="#EF4444" />
    </svg>
  ),
  curvefinance: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1E40AF" />
      <ellipse cx="16" cy="16" rx="8" ry="5" stroke="#F59E0B" strokeWidth="2" transform="rotate(30 16 16)" />
      <circle cx="16" cy="16" r="3" fill="#EF4444" />
    </svg>
  ),
  osmosis: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#5B21B6" />
      <path fill="#EC4899" d="M14 9h4v4l3 6a2 2 0 01-1.8 2.8H12.8A2 2 0 0111 19l3-6V9z" />
      <circle cx="15" cy="16" r="1" fill="#FFFFFF" />
      <circle cx="17" cy="18" r="1" fill="#FFFFFF" />
    </svg>
  ),

  // Wallets
  hardwarecoldwallet: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="24" height="24" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      <rect x="11" y="9" width="10" height="8" rx="2" fill="#FCD535" />
      <path fill="#1E293B" d="M13 11h2v4h-2zm4 0h2v4h-2z" />
      <path fill="#94A3B8" d="M16 19a2.5 2.5 0 00-2.5 2.5c0 1.05.65 1.95 1.58 2.31v1.19h1.84v-1.19c.93-.36 1.58-1.26 1.58-2.31A2.5 2.5 0 0016 19z" />
    </svg>
  ),
  coldwallet: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="24" height="24" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      <rect x="11" y="9" width="10" height="8" rx="2" fill="#FCD535" />
      <path fill="#1E293B" d="M13 11h2v4h-2zm4 0h2v4h-2z" />
      <path fill="#94A3B8" d="M16 19a2.5 2.5 0 00-2.5 2.5c0 1.05.65 1.95 1.58 2.31v1.19h1.84v-1.19c.93-.36 1.58-1.26 1.58-2.31A2.5 2.5 0 0016 19z" />
    </svg>
  ),
  ledger: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="24" height="24" rx="5" fill="#000000" stroke="#333333" strokeWidth="1" />
      <path stroke="#FFFFFF" strokeWidth="2" strokeLinecap="square" d="M9 13V9h4M19 9h4v4M9 19v4h4M23 19v4h-4" />
      <path fill="#FFFFFF" d="M14 12h2v7h4v2h-6v-9z" />
    </svg>
  ),
  trezor: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#00854D" />
      <path fill="#FFFFFF" d="M11 13h10v10l-5 3-5-3V13z" />
      <path fill="#00854D" d="M16 16a2 2 0 100 4 2 2 0 000-4zm-1 4v3h2v-3h-2z" />
      <path stroke="#FFFFFF" strokeWidth="2" d="M13 13V9a3 3 0 016 0v4" />
    </svg>
  ),
  tangem: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="6" width="24" height="20" rx="3.5" fill="#121316" stroke="#333333" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="5" stroke="#E2E8F0" strokeWidth="1.8" />
      <path fill="#E2E8F0" d="M13 13h6v2h-2v4h-2v-4h-2v-2z" />
      <path stroke="#94A3B8" strokeWidth="1" strokeDasharray="1.5 1.5" d="M7 11h3m-3 3h2" />
    </svg>
  ),
  phantom: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#AB9FF2" />
      <path fill="#FFFFFF" d="M22 14c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 3.86 1.8 6.5 2.5 8 .3.6 1.1.7 1.6.3.8-.7 1.9-.7 2.7 0 .5.4 1.3.3 1.6-.3.7-1.5 2.5-4.14 2.5-8z" />
      <circle cx="14" cy="13" r="1" fill="#5341BD" />
      <circle cx="18" cy="13" r="1" fill="#5341BD" />
    </svg>
  ),
  phantombackpack: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#AB9FF2" />
      <path fill="#FFFFFF" d="M22 14c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 3.86 1.8 6.5 2.5 8 .3.6 1.1.7 1.6.3.8-.7 1.9-.7 2.7 0 .5.4 1.3.3 1.6-.3.7-1.5 2.5-4.14 2.5-8z" />
      <circle cx="14" cy="13" r="1" fill="#5341BD" />
      <circle cx="18" cy="13" r="1" fill="#5341BD" />
    </svg>
  ),
  backpack: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#E33E3E" />
      <path fill="#FFFFFF" d="M12 9a4 4 0 018 0v2h2a2 2 0 012 2v9a3 3 0 01-3 3H11a3 3 0 01-3-3v-9a2 2 0 012-2h2V9zm2 2h4V9a2 2 0 00-4 0v2zm-3 5v4h10v-4H11z" />
    </svg>
  ),
  metamask: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F6851B" />
      <path fill="#E2761B" d="M24 7l-7 5.5 1.3-3.2L24 7zM8 7l7 5.5-1.3-3.2L8 7z" />
      <path fill="#E4761B" d="M21.5 20.5l-2.2 3.3-3.3-1.6 4-2.8 1.5 1.1zM10.5 20.5l2.2 3.3 3.3-1.6-4-2.8-1.5 1.1z" />
      <path fill="#D7C1B3" d="M14 18l-3-1.2 2.5-2.3.5 3.5zm4 0l3-1.2-2.5-2.3-.5 3.5z" />
      <path fill="#233447" d="M13.5 22.2l2.5-1.2 2.5 1.2-2.5 2-2.5-2z" />
    </svg>
  ),
  metamaskrabby: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F6851B" />
      <path fill="#E2761B" d="M24 7l-7 5.5 1.3-3.2L24 7zM8 7l7 5.5-1.3-3.2L8 7z" />
      <path fill="#E4761B" d="M21.5 20.5l-2.2 3.3-3.3-1.6 4-2.8 1.5 1.1zM10.5 20.5l2.2 3.3 3.3-1.6-4-2.8-1.5 1.1z" />
      <path fill="#D7C1B3" d="M14 18l-3-1.2 2.5-2.3.5 3.5zm4 0l3-1.2-2.5-2.3-.5 3.5z" />
      <path fill="#233447" d="M13.5 22.2l2.5-1.2 2.5 1.2-2.5 2-2.5-2z" />
    </svg>
  ),
  rabby: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#8697FF" />
      <path fill="#FFFFFF" d="M13 10c0-2 1-3.5 2.5-3.5S17 8 16.5 10c1.5-2 3-2 3.5 0 .5 2-1 4.5-2 6.5 2 0 4 1.5 4 4 0 3-3 4.5-6 4.5s-6-1.5-6-4.5c0-2.5 2-4 4-4-1-2-2.5-4.5-2-6.5z" />
      <circle cx="14" cy="18" r="0.8" fill="#5C6EFF" />
      <circle cx="18" cy="18" r="0.8" fill="#5C6EFF" />
    </svg>
  ),
  trustwallet: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0500FF" />
      <path fill="#FFFFFF" d="M16 6l7 3.5v6.5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V9.5L16 6z" />
      <path fill="#0500FF" d="M14 17l-2-2 1.5-1.5L14 14l4.5-4.5 1.5 1.5L14 17z" />
    </svg>
  ),

  // Networks & Blockchains
  solana: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <path fill="#00FFA3" d="M9 10.5h10.5l3.5-3.5H12.5L9 10.5z" />
      <path fill="#DC1FFF" d="M23 17.5H12.5L9 14h10.5l3.5 3.5z" />
      <path fill="#00FFA3" d="M9 24.5h10.5l3.5-3.5H12.5L9 24.5z" />
    </svg>
  ),
  solananetwork: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <path fill="#00FFA3" d="M9 10.5h10.5l3.5-3.5H12.5L9 10.5z" />
      <path fill="#DC1FFF" d="M23 17.5H12.5L9 14h10.5l3.5 3.5z" />
      <path fill="#00FFA3" d="M9 24.5h10.5l3.5-3.5H12.5L9 24.5z" />
    </svg>
  ),
  ethereum: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF">
        <path fillOpacity=".6" d="M16.5 4v8.9l7.5 3.3z" />
        <path d="M16.5 4L9 16.2l7.5-3.3z" />
        <path fillOpacity=".6" d="M16.5 22v6l7.5-10.4z" />
        <path d="M16.5 28v-6L9 17.6z" />
        <path fillOpacity=".2" d="M16.5 20.6l7.5-4.4-7.5-3.3z" />
        <path fillOpacity=".6" d="M9 16.2l7.5 4.4v-7.7z" />
      </g>
    </svg>
  ),
  evm: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF">
        <path fillOpacity=".6" d="M16.5 4v8.9l7.5 3.3z" />
        <path d="M16.5 4L9 16.2l7.5-3.3z" />
        <path fillOpacity=".6" d="M16.5 22v6l7.5-10.4z" />
        <path d="M16.5 28v-6L9 17.6z" />
        <path fillOpacity=".2" d="M16.5 20.6l7.5-4.4-7.5-3.3z" />
        <path fillOpacity=".6" d="M9 16.2l7.5 4.4v-7.7z" />
      </g>
    </svg>
  ),
  ethereumevm: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF">
        <path fillOpacity=".6" d="M16.5 4v8.9l7.5 3.3z" />
        <path d="M16.5 4L9 16.2l7.5-3.3z" />
        <path fillOpacity=".6" d="M16.5 22v6l7.5-10.4z" />
        <path d="M16.5 28v-6L9 17.6z" />
        <path fillOpacity=".2" d="M16.5 20.6l7.5-4.4-7.5-3.3z" />
        <path fillOpacity=".6" d="M9 16.2l7.5 4.4v-7.7z" />
      </g>
    </svg>
  ),
  base: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path fill="#FFFFFF" d="M16 8a8 8 0 105.66 13.66l-3.3-3.3A3.33 3.33 0 1116 12.67V8z" />
    </svg>
  ),
  basenetwork: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path fill="#FFFFFF" d="M16 8a8 8 0 105.66 13.66l-3.3-3.3A3.33 3.33 0 1116 12.67V8z" />
    </svg>
  ),
  bnb: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F0B90B" />
      <path fill="#FFFFFF" d="M16 6.5l3.2 3.2-3.2 3.2-3.2-3.2L16 6.5zm-6.3 6.3l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm12.6 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm-6.3 3.2l1.6 1.6-1.6 1.6-1.6-1.6 1.6-1.6zm0 3.2l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z" />
    </svg>
  ),
  bnbchain: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F0B90B" />
      <path fill="#FFFFFF" d="M16 6.5l3.2 3.2-3.2 3.2-3.2-3.2L16 6.5zm-6.3 6.3l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm12.6 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm-6.3 3.2l1.6 1.6-1.6 1.6-1.6-1.6 1.6-1.6zm0 3.2l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z" />
    </svg>
  ),
  arbitrum: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#28A0F0" />
      <path fill="#FFFFFF" d="M16 7l8 13.5-3 1.8L16 13.5l-5 8.8-3-1.8L16 7z" />
      <path fill="#12AAFF" d="M16 17l4 6.8h-8L16 17z" />
    </svg>
  ),
  arbitrumnetwork: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#28A0F0" />
      <path fill="#FFFFFF" d="M16 7l8 13.5-3 1.8L16 13.5l-5 8.8-3-1.8L16 7z" />
      <path fill="#12AAFF" d="M16 17l4 6.8h-8L16 17z" />
    </svg>
  ),
  sui: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#4DA2FF" />
      <path fill="#FFFFFF" d="M16 7c-4 5.5-6 9.5-6 12.5a6 6 0 1012 0c0-3-2-7-6-12.5z" />
      <path fill="#2E86DE" d="M16 15c-1.5 2-2.5 3.5-2.5 4.5a2.5 2.5 0 005 0c0-1-1-2.5-2.5-4.5z" />
    </svg>
  ),
  suinetwork: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#4DA2FF" />
      <path fill="#FFFFFF" d="M16 7c-4 5.5-6 9.5-6 12.5a6 6 0 1012 0c0-3-2-7-6-12.5z" />
      <path fill="#2E86DE" d="M16 15c-1.5 2-2.5 3.5-2.5 4.5a2.5 2.5 0 005 0c0-1-1-2.5-2.5-4.5z" />
    </svg>
  ),
  ton: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0088CC" />
      <path fill="#FFFFFF" d="M9 11l7-4 7 4-7 14L9 11z" />
      <path fill="#29B6F6" d="M16 7l7 4-7 14V7z" />
    </svg>
  ),
  tonnetwork: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0088CC" />
      <path fill="#FFFFFF" d="M9 11l7-4 7 4-7 14L9 11z" />
      <path fill="#29B6F6" d="M16 7l7 4-7 14V7z" />
    </svg>
  ),
  cexspot: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F0B90B" />
      <path fill="#000000" d="M10 10h12v3H10zm0 5h12v3H10zm0 5h12v3H10z" />
    </svg>
  ),
  solanadex: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <path fill="#00FFA3" d="M9 10.5h10.5l3.5-3.5H12.5L9 10.5z" />
      <path fill="#DC1FFF" d="M23 17.5H12.5L9 14h10.5l3.5 3.5z" />
      <path fill="#00FFA3" d="M9 24.5h10.5l3.5-3.5H12.5L9 24.5z" />
    </svg>
  ),
  evmdex: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF">
        <path fillOpacity=".6" d="M16.5 4v8.9l7.5 3.3z" />
        <path d="M16.5 4L9 16.2l7.5-3.3z" />
        <path fillOpacity=".6" d="M16.5 22v6l7.5-10.4z" />
        <path d="M16.5 28v-6L9 17.6z" />
      </g>
    </svg>
  ),
};

export const VenueIcon: React.FC<VenueIconProps> = React.memo(({
  venue,
  size = 'md',
  className = '',
  network,
  showNetworkBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const normalized = normalizeVenueKey(venue);
  const px = PIXEL_SIZE_MAP[size];
  const sizeClasses = SIZE_MAP[size];

  const cdnUrl = CMC_VENUE_CDN_URLS[normalized];
  const inlineSvgRenderer = INLINE_VENUE_SVGS[normalized];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
      {/* 1. Try Official CDN image if available and hasn't errored */}
      {cdnUrl && !imageError ? (
        <img
          src={cdnUrl}
          alt={venue}
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain rounded-full select-none"
        />
      ) : inlineSvgRenderer ? (
        /* 2. Razor-sharp authentic Vector SVG */
        <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden select-none">
          {inlineSvgRenderer(px)}
        </div>
      ) : (
        /* 3. High-quality custom venue fallback */
        (() => {
          const palette = getVenueDeterministicGradient(venue || 'Venue');
          const cleanInitials = (venue || 'V')
            .split(/[\s/_-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join('') || 'V';

          return (
            <div
              style={{
                background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                color: palette.text,
              }}
              className="w-full h-full rounded-full flex items-center justify-center font-bold font-mono shadow-xs select-none uppercase tracking-tighter"
            >
              <span style={{ fontSize: `${Math.max(8, Math.round(px * 0.44))}px` }}>
                {cleanInitials}
              </span>
            </div>
          );
        })()
      )}

      {/* Optional micro network overlay badge */}
      {showNetworkBadge && network && (
        <span
          title={`Network: ${network}`}
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-card border border-border shadow-xs flex items-center justify-center overflow-hidden"
        >
          <NetworkIcon network={network} size="xs" />
        </span>
      )}
    </div>
  );
});

// Dedicated Network Icon component
export const NetworkIcon: React.FC<{
  network: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}> = React.memo(({ network, size = 'xs', className = '' }) => {
  const norm = normalizeVenueKey(network);
  const px = PIXEL_SIZE_MAP[size];
  const sizeClasses = SIZE_MAP[size];
  const svgRenderer = INLINE_VENUE_SVGS[norm] || INLINE_VENUE_SVGS[`${norm}network`];

  if (svgRenderer) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
        {svgRenderer(px)}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeClasses} rounded-full bg-card border border-border text-[9px] font-mono font-bold text-text-muted ${className}`}>
      {network.slice(0, 2).toUpperCase()}
    </div>
  );
});
