const FAVORITES_STORAGE_KEY = 'tradegate_favorite_crypto_assets';
const DEFAULT_FAVORITES = ['BTC', 'ETH', 'SOL', 'HYPE', 'XRP', 'DOGE', 'SUI'];

/**
 * Returns the user's saved favorite crypto tickers from localStorage.
 */
export function getFavoriteTickers(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t) => String(t).toUpperCase().trim());
      }
    }
  } catch { }
  return DEFAULT_FAVORITES;
}

/**
 * Saves favorite crypto tickers into localStorage and dispatches an update event.
 */
export function saveFavoriteTickers(tickers: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(tickers));
    window.dispatchEvent(new Event('tradegate_favorites_updated'));
  } catch { }
}

/**
 * Toggles a ticker's favorite state, returning the updated array of favorite tickers.
 */
export function toggleFavoriteTicker(ticker: string): string[] {
  if (!ticker) return getFavoriteTickers();
  const clean = ticker.toUpperCase().trim();
  const current = getFavoriteTickers();
  let updated: string[];

  if (current.includes(clean)) {
    updated = current.filter((t) => t !== clean);
  } else {
    // New favorites go to the very front of favorites
    updated = [clean, ...current];
  }

  saveFavoriteTickers(updated);
  return updated;
}

/**
 * Checks whether a given ticker is favorited.
 */
export function isFavoriteTicker(ticker: string, favorites: string[] = getFavoriteTickers()): boolean {
  if (!ticker) return false;
  return favorites.includes(ticker.toUpperCase().trim());
}

