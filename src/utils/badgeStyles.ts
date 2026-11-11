/**
 * Institutional Badge & Color Token Utilities
 * Encodes domain meaning, wayfinding, and operational hierarchy across TradeGate surfaces.
 */

export interface SessionStyleConfig {
  active: string;
  dot: string;
  badge: string;
}

export const SESSION_STYLES: Record<string, SessionStyleConfig> = {
  Asia: {
    active: 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs',
    dot: 'bg-slate-500 dark:bg-slate-300',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold',
  },
  London: {
    active: 'bg-amber-500 text-black font-bold shadow-xs',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold',
  },
  'NY AM': {
    active: 'bg-blue-600 text-white font-bold shadow-xs',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold',
  },
  'NY PM': {
    active: 'bg-indigo-600 text-white font-bold shadow-xs',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-semibold',
  },
};

export function getSessionStyle(session?: string): SessionStyleConfig {
  if (!session || !SESSION_STYLES[session]) {
    return {
      active: 'bg-brand text-black font-bold shadow-xs',
      dot: 'bg-brand',
      badge: 'bg-canvas text-text-secondary',
    };
  }
  return SESSION_STYLES[session];
}

/**
 * Returns distinct domain category styles for pre-trade checklist rules (borderless).
 */
export function getRuleCategoryStyle(category?: string): string {
  switch (category) {
    case 'HTF Bias':
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold';
    case 'Execution':
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold';
    case 'Risk':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold';
    case 'Market Context':
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold';
    case 'On-Chain':
      return 'bg-teal-500/15 text-teal-800 dark:text-teal-300 font-semibold';
    case 'General':
    default:
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold';
  }
}

/**
 * Returns directional badge styles for spot portfolio actions (borderless).
 */
export function getSpotActionStyle(action?: string): string {
  switch (action) {
    case 'BUY / ACCUMULATE':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold';
    case 'DCA ADD':
      return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold';
    case 'PARTIAL TP':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold';
    case 'FULL EXIT':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold';
    default:
      return 'bg-canvas text-text-secondary';
  }
}

/**
 * Returns timeframe typography class based on market horizon (Scalp, Intraday, Macro).
 */
export function getTimeframeHorizonStyle(tf: string): string {
  switch (tf) {
    case '1m':
    case '3m':
    case '5m':
      return 'text-amber-600 dark:text-amber-400';
    case '15m':
    case '30m':
    case '1H':
    case '2H':
      return 'text-sky-600 dark:text-sky-400';
    case '4H':
    case '1D':
    case '1W':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-text-secondary';
  }
}

