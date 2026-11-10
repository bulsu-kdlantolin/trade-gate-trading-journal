/**
 * Unified Client-Side Storage Engine for TradeGate Crypto
 * Uses IndexedDB (via idb-keyval) with seamless localStorage fallback.
 * Allows high-resolution screenshots, massive trade journals, and strategy profiles
 * without browser quota limits or extension dependencies.
 */
import { get, set, del, keys } from 'idb-keyval';

class LocalStorageFallback {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : undefined;
    } catch (e) {
      console.warn(`[Storage] Failed to read ${key} from localStorage:`, e);
      return undefined;
    }
  }

  async set<T>(key: string, val: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`[Storage] Failed to write ${key} to localStorage:`, e);
    }
  }

  async del(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[Storage] Failed to delete ${key} from localStorage:`, e);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (e) {
      return [];
    }
  }
}

const fallback = new LocalStorageFallback();

export const storage = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const idbVal = await get<T>(key);
      if (idbVal !== undefined) return idbVal;
      // If not found in IndexedDB, check localStorage for backward compatibility or migration
      const localVal = await fallback.get<T>(key);
      if (localVal !== undefined) {
        // Silently promote to IndexedDB
        await set(key, localVal).catch(() => {});
        return localVal;
      }
      return undefined;
    } catch (e) {
      console.warn(`[Storage] IndexedDB read failed for ${key}, falling back to localStorage`, e);
      return fallback.get<T>(key);
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await set(key, value);
      // Also sync lightweight items (like theme/active id) to localStorage for instant synchronous startup if needed
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        localStorage.setItem(key, String(value));
      }
    } catch (e) {
      console.warn(`[Storage] IndexedDB write failed for ${key}, falling back to localStorage`, e);
      await fallback.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await del(key);
      localStorage.removeItem(key);
    } catch (e) {
      await fallback.del(key);
    }
  },

  async clearAll(): Promise<void> {
    try {
      const allKeys = await keys();
      for (const k of allKeys) {
        await del(k);
      }
      localStorage.clear();
    } catch (e) {
      localStorage.clear();
    }
  }
};

