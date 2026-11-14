import { useState, useEffect, useCallback } from 'react';
import {
  getCachedCryptoPrices,
  getPriceMetadata,
  refreshAllLiveMarketData,
  normalizeSymbolToTicker,
  PriceMetadata,
} from '../services/livePriceService';
import { getExchangeRates } from '../utils/currency';

export interface UseLivePricesReturn {
  prices: Record<string, number>;
  rates: Record<string, number>;
  metadata: PriceMetadata;
  isRefreshing: boolean;
  refreshNow: () => Promise<void>;
  getPrice: (symbolOrTicker: string) => number | undefined;
  formatLivePrice: (symbolOrTicker: string) => string;
}

function formatPriceWithPrecision(price: number): string {
  if (price === 0 || !isFinite(price)) return '0.00';
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  if (price >= 0.0001) {
    return price.toFixed(6);
  }
  if (price >= 1e-8) {
    return price.toFixed(8);
  }
  return price.toExponential(3);
}

export function useLivePrices(): UseLivePricesReturn {
  const [prices, setPrices] = useState<Record<string, number>>(() => getCachedCryptoPrices());
  const [rates, setRates] = useState<Record<string, number>>(() => getExchangeRates());
  const [metadata, setMetadata] = useState<PriceMetadata>(() => getPriceMetadata());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handlePricesUpdated = (e: Event) => {
      const custom = e as CustomEvent<{
        prices: Record<string, number>;
        rates: Record<string, number>;
        metadata: PriceMetadata;
      }>;
      if (custom.detail) {
        if (custom.detail.prices) setPrices(custom.detail.prices);
        if (custom.detail.rates) setRates(custom.detail.rates);
        if (custom.detail.metadata) setMetadata(custom.detail.metadata);
      }
      setIsRefreshing(false);
    };

    const handleSyncStarted = () => {
      setIsRefreshing(true);
    };

    const handleSyncError = (e: Event) => {
      const custom = e as CustomEvent<PriceMetadata>;
      if (custom.detail) setMetadata(custom.detail);
      setIsRefreshing(false);
    };

    window.addEventListener('tradegate_prices_updated', handlePricesUpdated);
    window.addEventListener('tradegate_prices_sync_started', handleSyncStarted);
    window.addEventListener('tradegate_prices_sync_error', handleSyncError);

    return () => {
      window.removeEventListener('tradegate_prices_updated', handlePricesUpdated);
      window.removeEventListener('tradegate_prices_sync_started', handleSyncStarted);
      window.removeEventListener('tradegate_prices_sync_error', handleSyncError);
    };
  }, []);

  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    await refreshAllLiveMarketData();
  }, []);

  const getPrice = useCallback(
    (symbolOrTicker: string): number | undefined => {
      if (!symbolOrTicker) return undefined;
      const ticker = normalizeSymbolToTicker(symbolOrTicker);
      const direct = prices[ticker] ?? prices[ticker.toUpperCase()] ?? prices[symbolOrTicker] ?? prices[symbolOrTicker.toUpperCase()];
      if (direct !== undefined && direct > 0) return direct;
      if (ticker === 'TON' || ticker === 'GRAM') return prices.TON ?? prices.GRAM;
      return undefined;
    },
    [prices]
  );

  const formatLivePrice = useCallback(
    (symbolOrTicker: string): string => {
      const p = getPrice(symbolOrTicker);
      if (p === undefined) return '—';
      return formatPriceWithPrecision(p);
    },
    [getPrice]
  );

  return {
    prices,
    rates,
    metadata,
    isRefreshing,
    refreshNow,
    getPrice,
    formatLivePrice,
  };
}

