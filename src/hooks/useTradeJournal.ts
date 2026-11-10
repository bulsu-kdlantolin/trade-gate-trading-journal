import { useState, useEffect, useCallback, useMemo } from 'react';
import { TradeRecord } from '../types/trade';
import { SEED_TRADES } from '../data/seedData';
import { calculateTradeMetrics } from '../utils/metricsCalc';
import { storage } from '../utils/storage';

const STORAGE_KEY_TRADES = 'tradegate_crypto_trades';

export function useTradeJournal(activeStrategyId?: string) {
  const [allTrades, setAllTrades] = useState<TradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load trades from IndexedDB
  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      let loaded = await storage.get<TradeRecord[]>(STORAGE_KEY_TRADES);
      if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        loaded = SEED_TRADES;
        await storage.set(STORAGE_KEY_TRADES, loaded);
      }
      setAllTrades(loaded);
    } catch (e) {
      console.error('Failed to load trade records:', e);
      setAllTrades(SEED_TRADES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // Sync updated trades list to IndexedDB
  const syncToStorage = useCallback(async (updated: TradeRecord[]) => {
    setAllTrades(updated);
    await storage.set(STORAGE_KEY_TRADES, updated);
  }, []);

  // Filtered trades by active strategy
  const trades = useMemo(() => {
    if (!activeStrategyId) return allTrades;
    return allTrades.filter((t) => t.strategyId === activeStrategyId);
  }, [allTrades, activeStrategyId]);

  // Derived metrics with React best practices (memoized)
  const metrics = useMemo(() => {
    return calculateTradeMetrics(trades);
  }, [trades]);

  const allMetrics = useMemo(() => {
    return calculateTradeMetrics(allTrades);
  }, [allTrades]);

  // Log a new trade
  const logTrade = useCallback(
    async (tradeData: TradeRecord) => {
      const updated = [tradeData, ...allTrades];
      await syncToStorage(updated);
      return tradeData;
    },
    [allTrades, syncToStorage]
  );

  // Update existing trade
  const updateTrade = useCallback(
    async (id: string, updates: Partial<TradeRecord>) => {
      const updated = allTrades.map((t) => (t.id === id ? ({ ...t, ...updates } as TradeRecord) : t));
      await syncToStorage(updated);
    },
    [allTrades, syncToStorage]
  );

  // Delete trade
  const deleteTrade = useCallback(
    async (id: string) => {
      const updated = allTrades.filter((t) => t.id !== id);
      await syncToStorage(updated);
    },
    [allTrades, syncToStorage]
  );

  // Clear all trades
  const clearAllTrades = useCallback(async () => {
    await syncToStorage([]);
  }, [syncToStorage]);

  // Reset to default seed trades
  const resetToDefaultTrades = useCallback(async () => {
    await syncToStorage(SEED_TRADES);
  }, [syncToStorage]);

  // Import trades from backup
  const importTrades = useCallback(
    async (importedTrades: TradeRecord[]) => {
      if (!Array.isArray(importedTrades)) return;
      await syncToStorage(importedTrades);
    },
    [syncToStorage]
  );

  return {
    trades,
    allTrades,
    metrics,
    allMetrics,
    isLoading,
    logTrade,
    updateTrade,
    deleteTrade,
    clearAllTrades,
    resetToDefaultTrades,
    importTrades,
    reloadTrades: loadTrades,
  };
}

