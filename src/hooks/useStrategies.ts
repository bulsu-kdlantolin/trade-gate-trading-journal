import { useState, useEffect, useCallback, useMemo } from 'react';
import { StrategyProfile } from '../types/strategy';
import { SEED_STRATEGIES } from '../data/seedData';
import { storage } from '../utils/storage';

const STORAGE_KEY_STRATEGIES = 'tradegate_crypto_strategies';
const STORAGE_KEY_ACTIVE_STRATEGY_ID = 'tradegate_crypto_active_strategy_id';

export function useStrategies() {
  const [strategies, setStrategies] = useState<StrategyProfile[]>([]);
  const [activeStrategyId, setActiveStrategyIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load strategies from IndexedDB with fallback to SEED_STRATEGIES
  const loadStrategies = useCallback(async () => {
    setIsLoading(true);
    try {
      let loaded = await storage.get<StrategyProfile[]>(STORAGE_KEY_STRATEGIES);
      let activeId = await storage.get<string>(STORAGE_KEY_ACTIVE_STRATEGY_ID);

      if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        loaded = SEED_STRATEGIES;
        activeId = SEED_STRATEGIES[0].id;
        await storage.set(STORAGE_KEY_STRATEGIES, loaded);
        await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, activeId);
      } else if (!activeId || !loaded.some((s) => s.id === activeId)) {
        activeId = loaded[0].id;
        await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, activeId);
      }

      setStrategies(loaded);
      setActiveStrategyIdState(activeId);
    } catch (e) {
      console.error('Failed to load strategies:', e);
      setStrategies(SEED_STRATEGIES);
      setActiveStrategyIdState(SEED_STRATEGIES[0].id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  const activeStrategy = useMemo(() => {
    return strategies.find((s) => s.id === activeStrategyId) || strategies[0] || null;
  }, [strategies, activeStrategyId]);

  const setActiveStrategyId = useCallback(async (id: string) => {
    setActiveStrategyIdState(id);
    await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, id);
  }, []);

  const addStrategy = useCallback(
    async (newStratData: Omit<StrategyProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newStrategy: StrategyProfile = {
        ...newStratData,
        id: `strat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...strategies, newStrategy];
      setStrategies(updated);
      setActiveStrategyIdState(newStrategy.id);
      await storage.set(STORAGE_KEY_STRATEGIES, updated);
      await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, newStrategy.id);
      return newStrategy;
    },
    [strategies]
  );

  const updateStrategy = useCallback(
    async (id: string, updates: Partial<StrategyProfile>) => {
      const updated = strategies.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s));
      setStrategies(updated);
      await storage.set(STORAGE_KEY_STRATEGIES, updated);
    },
    [strategies]
  );

  const deleteStrategy = useCallback(
    async (id: string) => {
      if (strategies.length <= 1) return false;
      const updated = strategies.filter((s) => s.id !== id);
      setStrategies(updated);
      const nextActiveId = activeStrategyId === id ? updated[0].id : activeStrategyId;
      setActiveStrategyIdState(nextActiveId);
      await storage.set(STORAGE_KEY_STRATEGIES, updated);
      await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, nextActiveId);
      return true;
    },
    [strategies, activeStrategyId]
  );

  const resetToDefaultStrategies = useCallback(async () => {
    setStrategies(SEED_STRATEGIES);
    setActiveStrategyIdState(SEED_STRATEGIES[0].id);
    await storage.set(STORAGE_KEY_STRATEGIES, SEED_STRATEGIES);
    await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, SEED_STRATEGIES[0].id);
  }, []);

  const importBackupStrategies = useCallback(async (importedStrategies: StrategyProfile[]) => {
    if (!importedStrategies || importedStrategies.length === 0) return;
    setStrategies(importedStrategies);
    setActiveStrategyIdState(importedStrategies[0].id);
    await storage.set(STORAGE_KEY_STRATEGIES, importedStrategies);
    await storage.set(STORAGE_KEY_ACTIVE_STRATEGY_ID, importedStrategies[0].id);
  }, []);

  return {
    strategies,
    activeStrategy,
    activeStrategyId,
    isLoading,
    setActiveStrategyId,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    resetToDefaultStrategies,
    importBackupStrategies,
    reloadStrategies: loadStrategies,
  };
}

