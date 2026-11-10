import { StrategyProfile } from '../types/strategy';
import { TradeRecord, isFuturesTrade, isSpotTrade } from '../types/trade';

export interface SystemBackupData {
  version: string;
  exportDate: string;
  source: string;
  strategies: StrategyProfile[];
  trades: TradeRecord[];
}

export function createSystemBackupJson(strategies: StrategyProfile[], trades: TradeRecord[]): string {
  const safeStrategies = Array.isArray(strategies) ? strategies : [];
  const safeTrades = Array.isArray(trades) ? trades : [];

  const data: SystemBackupData = {
    version: '2.0.0-crypto',
    exportDate: new Date().toISOString(),
    source: 'TradeGate Crypto Web Terminal',
    strategies: safeStrategies,
    trades: safeTrades,
  };
  return JSON.stringify(data, null, 2);
}

export function parseSystemBackupJson(jsonString: string): { strategies: StrategyProfile[]; trades: TradeRecord[] } {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    throw new Error('Empty backup file. Please provide a valid TradeGate JSON export.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Corrupt backup file: content is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup format: root must be a JSON object.');
  }

  // Validate strategies array defensively
  const rawStrategies = Array.isArray(parsed.strategies) ? parsed.strategies : [];
  const strategies: StrategyProfile[] = rawStrategies.filter((s: any) => {
    return (
      s &&
      typeof s === 'object' &&
      typeof s.id === 'string' &&
      typeof s.name === 'string' &&
      typeof s.executionMode === 'string'
    );
  });

  // Validate trades array defensively
  const rawTrades = Array.isArray(parsed.trades) ? parsed.trades : [];
  const trades: TradeRecord[] = rawTrades.filter((t: any) => {
    return (
      t &&
      typeof t === 'object' &&
      typeof t.id === 'string' &&
      typeof t.symbol === 'string' &&
      (typeof t.timestamp === 'number' || typeof t.entryTimestamp === 'string')
    );
  });

  if (strategies.length === 0 && trades.length === 0) {
    throw new Error('Backup file contains no valid strategies or trade records.');
  }

  return { strategies, trades };
}

export function exportTradesToCSV(trades: TradeRecord[], strategyName = 'All'): string {
  const headers = [
    'Trade ID',
    'Date & Time',
    'Strategy',
    'Type',
    'Symbol',
    'Direction / Action',
    'Entry Price',
    'Exit Price',
    'Size / Allocation',
    'Leverage / Venue',
    'Stop Loss',
    'Take Profit',
    'PnL ($)',
    'PnL (R)',
    'PnL (%)',
    'Outcome',
    'Grade',
    'Session',
    'Discipline Passed',
    'Mistakes',
    'Notes',
  ];

  const rows = trades.map((t) => {
    const isFut = isFuturesTrade(t);
    const isSp = isSpotTrade(t);
    const dateStr = new Date(t.timestamp).toISOString();
    const type = isFut ? 'FUTURES PERP' : isSp ? 'SPOT' : 'TRADE';
    const dir = isFut ? t.direction : isSp ? t.spotAction : '-';
    const size = isFut ? `${t.calculatedPositionSize} tokens` : isSp ? `$${t.allocationDollar}` : '-';
    const levVenue = isFut ? `${t.leverage}x (${t.marginType})` : isSp ? t.venueTag : '-';
    const sl = isFut ? t.stopLossPrice : isSp ? (t.stopLossPrice || '-') : '-';
    const tp = isFut ? t.takeProfitPrice : isSp ? t.targetSellPrice : '-';
    const errors = (t.executionErrors || []).join('; ');
    const notes = (t.notes || '').replace(/"/g, '""');

    return [
      t.id,
      dateStr,
      t.strategyName,
      type,
      t.symbol,
      dir,
      t.entryPrice,
      t.exitPrice ?? '-',
      `"${size}"`,
      `"${levVenue}"`,
      sl,
      tp,
      t.pnlDollar ?? 0,
      t.pnlR ?? 0,
      t.pnlPercentage ?? 0,
      t.tradeResult ?? t.status,
      t.setupGrade,
      t.session,
      t.mandatoryRulesPassed ? 'YES' : 'NO',
      `"${errors}"`,
      `"${notes}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

