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
    active: 'bg-slate-200 dark:bg-white/20 text-slate-950 dark:text-white border border-slate-400/50 dark:border-white/40 font-bold shadow-xs',
    dot: 'bg-white border border-slate-400/70',
    badge: 'bg-slate-200/80 dark:bg-white/15 text-slate-900 dark:text-white font-semibold',
  },
  London: {
    active: 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/40 font-bold shadow-xs',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold',
  },
  'NY AM': {
    active: 'bg-red-500/20 text-red-800 dark:text-red-300 border border-red-500/40 font-bold shadow-xs',
    dot: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-400 font-semibold',
  },
  'NY PM': {
    active: 'bg-red-400/20 text-red-700 dark:text-red-200 border border-red-400/40 font-bold shadow-xs',
    dot: 'bg-red-400',
    badge: 'bg-red-400/15 text-red-600 dark:text-red-300 font-semibold',
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
 * Returns timeframe typography class. Standardized to crisp text-primary to eliminate unwanted purple or conflicting tints.
 */
export function getTimeframeHorizonStyle(_tf?: string): string {
  return 'text-text-primary';
}

