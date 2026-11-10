import { useState, useEffect, useCallback, useMemo } from 'react';
import { BalanceAdjustment } from '../types/strategy';
import { storage } from '../utils/storage';

const STORAGE_KEY_ADJUSTMENTS = 'tradegate_crypto_balance_adjustments';

export function useBalanceAdjustments(strategyId?: string) {
  const [allAdjustments, setAllAdjustments] = useState<BalanceAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAdjustments = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await storage.get<BalanceAdjustment[]>(STORAGE_KEY_ADJUSTMENTS);
      setAllAdjustments(Array.isArray(loaded) ? loaded : []);
    } catch (e) {
      console.error('Failed to load balance adjustments:', e);
      setAllAdjustments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  const strategyAdjustments = useMemo(() => {
    if (!strategyId) return allAdjustments;
    return allAdjustments.filter((a) => a.strategyId === strategyId);
  }, [allAdjustments, strategyId]);

  const netAdjustments = useMemo(() => {
    return strategyAdjustments.reduce((acc, curr) => {
      return curr.type === 'deposit' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [strategyAdjustments]);

  const addAdjustment = useCallback(
    async (type: 'deposit' | 'withdraw', amount: number, note?: string) => {
      if (!strategyId || amount <= 0) return;
      const item: BalanceAdjustment = {
        id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        strategyId,
        type,
        amount,
        note,
        timestamp: Date.now(),
      };
      const updated = [item, ...allAdjustments];
      setAllAdjustments(updated);
      await storage.set(STORAGE_KEY_ADJUSTMENTS, updated);
      return item;
    },
    [allAdjustments, strategyId]
  );

  return {
    adjustments: strategyAdjustments,
    allAdjustments,
    netAdjustments,
    isLoading,
    addAdjustment,
    reloadAdjustments: loadAdjustments,
  };
}

