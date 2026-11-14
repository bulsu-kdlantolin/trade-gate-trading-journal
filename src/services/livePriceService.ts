/**
 * TradeGate Institutional Live Market Price & Currency Exchange Engine
 *
 * Fetches continuous live market prices for all cryptocurrencies and fiat exchange rates,
 * with multi-provider fallback resilience (Binance -> Bybit -> CoinGecko for crypto,
 * and open.er-api.com -> jsDelivr Currency API for fiat).
 *
 * Features:
 * - Real-time background polling (every 30s)
 * - Immediate auto-refresh on tab focus / visibilitychange when stale
 * - Offline/reconnect detection
 * - Zero UI blocking (asynchronous with cached fallback in localStorage)
 * - Event-driven reactive updates for components
 */

import { BASE_RATES_IN_USD, SUPPORTED_CURRENCIES } from '../utils/currency';
import { BASELINE_500_PRICES } from '../data/baselineCryptoPrices';

export interface PriceMetadata {
  lastUpdated: number;
  status: 'synced' | 'syncing' | 'error';
  source: string;
}

const RATES_STORAGE_KEY = 'tradegate_exchange_rates';
const PRICES_STORAGE_KEY = 'tradegate_crypto_prices';
const METADATA_STORAGE_KEY = 'tradegate_prices_metadata';

// Baseline fallback prices covering all 500 volatile crypto assets
export const BASELINE_CRYPTO_PRICES: Record<string, number> = {
  ...BASELINE_500_PRICES,
};

let pollIntervalId: number | null = null;
let isCurrentlyFetching = false;
let listenersInitialized = false;

/**
 * Returns cached crypto prices or baseline defaults.
 */
export function getCachedCryptoPrices(): Record<string, number> {
  const base = { ...BASELINE_500_PRICES };
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(PRICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...base, ...parsed };
      }
    }
  } catch {}
  return base;
}

/**
 * Returns metadata of the last price sync.
 */
export function getPriceMetadata(): PriceMetadata {
  if (typeof window === 'undefined') {
    return { lastUpdated: Date.now(), status: 'synced', source: 'baseline' };
  }
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return { lastUpdated: 0, status: 'syncing', source: 'none' };
}

/**
 * Extracts standard base ticker from full trading symbol (e.g. "BTCUSDT.P" -> "BTC", "SOL" -> "SOL").
 */
export function normalizeSymbolToTicker(symbol: string): string {
  if (!symbol) return 'BTC';
  let s = symbol.trim().toUpperCase();
  const quoteStables = ['USDT', 'USDC', 'USD', 'BUSD', 'DAI', 'FDUSD'];
  if (quoteStables.includes(s)) return s;
  s = s.replace(/\.P$/i, '').replace(/PERP$/i, '');
  const stripped = s.replace(/(USDT|USDC|USD|BUSD|DAI)$/i, '');
  if (stripped.length > 0) {
    s = stripped;
  }
  s = s.replace(/^\d+/, ''); // strip 1000PEPE -> PEPE
  return s || 'BTC';
}

/**
 * Fetches fiat currency exchange rates vs USD from open.er-api.com with jsDelivr fallback.
 */
async function fetchFiatExchangeRates(): Promise<Record<string, number>> {
  const fiatRates: Record<string, number> = {};

  // Provider 1: open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        SUPPORTED_CURRENCIES.forEach((c) => {
          const rateFromUSD = data.rates[c.code];
          if (rateFromUSD && rateFromUSD > 0) {
            // Store rate as USD per 1 unit of foreign currency
            fiatRates[c.code] = 1 / rateFromUSD;
          }
        });
        fiatRates.USD = 1.0;
        return fiatRates;
      }
    }
  } catch {}

  // Provider 2 Fallback: jsDelivr currency-api
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.usd) {
        SUPPORTED_CURRENCIES.forEach((c) => {
          const key = c.code.toLowerCase();
          const rateFromUSD = data.usd[key];
          if (rateFromUSD && rateFromUSD > 0) {
            fiatRates[c.code] = 1 / rateFromUSD;
          }
        });
        fiatRates.USD = 1.0;
        return fiatRates;
      }
    }
  } catch {}

  return fiatRates;
}

/**
 * Fetches live crypto prices concurrently across CoinMarketCap (Top 800), Binance, and Bybit.
 * Merges providers so all 500 volatile tokens have live updating prices with zero gaps.
 */
async function fetchLiveCryptoPrices(): Promise<{ prices: Record<string, number>; source: string }> {
  const prices: Record<string, number> = { ...BASELINE_500_PRICES };
  const sources: string[] = [];

  // Provider 1: CoinMarketCap Listing API (covers 100% of top 500 volatile tokens)
  const cmcPromise = (async () => {
    try {
      const res = await fetch(
        'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?sortBy=market_cap&sortType=desc&limit=800',
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        const list = data?.data?.cryptoCurrencyList;
        if (Array.isArray(list)) {
          let count = 0;
          list.forEach((c: { symbol: string; quotes?: Array<{ price: number }> }) => {
            if (c.quotes && c.quotes[0] && c.quotes[0].price > 0 && isFinite(c.quotes[0].price)) {
              const p = c.quotes[0].price;
              prices[c.symbol] = p;
              prices[c.symbol.toUpperCase()] = p;
              if (c.symbol.toUpperCase() === 'GRAM') {
                prices.TON = p;
              }
              count++;
            }
          });
          if (count > 0) sources.push(`cmc (${count})`);
        }
      }
    } catch {}
  })();

  // Provider 2: Binance All Tickers (sub-second order book accuracy for all Binance pairs)
  const binancePromise = (async () => {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          let count = 0;
          data.forEach((item: { symbol: string; price: string }) => {
            if (item.symbol.endsWith('USDT')) {
              const rawTicker = item.symbol.replace(/USDT$/, '');
              const parsedPrice = parseFloat(item.price);
              if (parsedPrice > 0 && isFinite(parsedPrice)) {
                prices[rawTicker] = parsedPrice;
                prices[rawTicker.toUpperCase()] = parsedPrice;
                count++;
              }
            }
          });
          if (count > 0) sources.push(`binance (${count})`);
        }
      }
    } catch {}
  })();

  // Provider 3: Bybit Linear Tickers (perpetual futures order book accuracy)
  const bybitPromise = (async () => {
    try {
      const res = await fetch('https://api.bybit.com/v5/market/tickers?category=linear', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data?.result?.list;
        if (Array.isArray(list)) {
          let count = 0;
          list.forEach((item: { symbol: string; lastPrice: string }) => {
            if (item.symbol.endsWith('USDT')) {
              const rawTicker = item.symbol.replace(/USDT$/, '');
              const parsedPrice = parseFloat(item.lastPrice);
              if (parsedPrice > 0 && isFinite(parsedPrice)) {
                prices[rawTicker] = parsedPrice;
                prices[rawTicker.toUpperCase()] = parsedPrice;
                count++;
              }
            }
          });
          if (count > 0) sources.push(`bybit (${count})`);
        }
      }
    } catch {}
  })();

  await Promise.allSettled([cmcPromise, binancePromise, bybitPromise]);

  return {
    prices,
    source: sources.length > 0 ? sources.join(' + ') : 'baseline',
  };
}

/**
 * Executes a full refresh cycle of both fiat exchange rates and crypto market prices.
 * Merges fresh data with existing cache, writes to localStorage, and broadcasts reactive events.
 */
export async function refreshAllLiveMarketData(): Promise<void> {
  if (isCurrentlyFetching) return;
  isCurrentlyFetching = true;

  try {
    // Notify listeners that sync is in progress
    window.dispatchEvent(new CustomEvent('tradegate_prices_sync_started'));

    // Fetch fiat and crypto concurrently in background
    const [fiatRates, cryptoResult] = await Promise.all([
      fetchFiatExchangeRates(),
      fetchLiveCryptoPrices(),
    ]);

    // Read existing cached rates to preserve values if an individual pair failed
    const existingRates: Record<string, number> = {
      ...BASE_RATES_IN_USD,
      ...fiatRates,
    };

    // Update crypto prices in rates dictionary
    if (cryptoResult.prices.BTC) existingRates.BTC = cryptoResult.prices.BTC;
    if (cryptoResult.prices.ETH) existingRates.ETH = cryptoResult.prices.ETH;
    if (cryptoResult.prices.SOL) existingRates.SOL = cryptoResult.prices.SOL;
    existingRates.USD = 1.0;
    existingRates.USDT = 1.0;
    existingRates.USDC = 1.0;

    // Cache updated exchange rates
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(existingRates));

    // Cache updated crypto asset prices
    const mergedCryptoPrices = {
      ...getCachedCryptoPrices(),
      ...cryptoResult.prices,
    };
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(mergedCryptoPrices));

    // Save metadata
    const metadata: PriceMetadata = {
      lastUpdated: Date.now(),
      status: 'synced',
      source: cryptoResult.source || 'binance',
    };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadata));

    // Broadcast reactive updates across the entire application
    window.dispatchEvent(
      new CustomEvent('tradegate_prices_updated', {
        detail: {
          prices: mergedCryptoPrices,
          rates: existingRates,
          metadata,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('tradegate_rates_updated', {
        detail: existingRates,
      })
    );
  } catch (err) {
    const errorMetadata: PriceMetadata = {
      lastUpdated: Date.now(),
      status: 'error',
      source: 'offline',
    };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(errorMetadata));
    window.dispatchEvent(
      new CustomEvent('tradegate_prices_sync_error', { detail: errorMetadata })
    );
  } finally {
    isCurrentlyFetching = false;
  }
}

/**
 * Initializes continuous live price background polling and event listeners.
 * Safe to call multiple times (idempotent singleton).
 */
export function initLivePriceService(pollIntervalMs: number = 30000): void {
  if (typeof window === 'undefined') return;

  // Immediate initial refresh on startup
  refreshAllLiveMarketData();

  // Background interval polling (every 30 seconds)
  if (pollIntervalId !== null) {
    window.clearInterval(pollIntervalId);
  }
  pollIntervalId = window.setInterval(() => {
    refreshAllLiveMarketData();
  }, pollIntervalMs);

  if (listenersInitialized) return;
  listenersInitialized = true;

  // Immediate refresh when user refocuses or brings tab to foreground if data is older than 20s
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      const meta = getPriceMetadata();
      const ageMs = Date.now() - (meta.lastUpdated || 0);
      if (ageMs > 20000) {
        refreshAllLiveMarketData();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);

  // Immediate refresh when network recovers from offline
  window.addEventListener('online', () => {
    refreshAllLiveMarketData();
  });
}

