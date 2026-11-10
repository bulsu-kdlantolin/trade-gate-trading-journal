import { TradeRecord, TradeJournalMetrics, AnalyticsDateFilter, DateRangeState, isSpotTrade } from '../types/trade';

export function getTradeTimestamp(t: TradeRecord): number {
  if (typeof t.timestamp === 'number' && !isNaN(t.timestamp) && t.timestamp > 0) {
    return t.timestamp;
  }
  if (t.entryTimestamp) {
    const parsed = new Date(t.entryTimestamp).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export function toISODateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filterTradesByDateRange(
  trades: TradeRecord[],
  filter: AnalyticsDateFilter,
  customRange?: DateRangeState
): TradeRecord[] {
  if (filter === 'all') return trades;

  const now = new Date();
  let startMs = 0;
  let endMs = Infinity;

  if (filter === 'daily') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime();
    d.setHours(23, 59, 59, 999);
    endMs = d.getTime();
  } else if (filter === 'weekly') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime();
  } else if (filter === 'monthly') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    startMs = d.getTime();
  } else if (filter === 'yearly') {
    const d = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    startMs = d.getTime();
  } else if (filter === 'custom' && customRange) {
    if (customRange.startDate) {
      startMs = new Date(`${customRange.startDate}T00:00:00`).getTime();
    }
    if (customRange.endDate) {
      endMs = new Date(`${customRange.endDate}T23:59:59.999`).getTime();
    }
  }

  return trades.filter((t) => {
    const time = getTradeTimestamp(t);
    return time >= startMs && time <= endMs;
  });
}

/**
 * Calculates complete institutional trading metrics with memoization friendly structure.
 */
export function calculateTradeMetrics(trades: TradeRecord[]): TradeJournalMetrics {
  const safeTrades = Array.isArray(trades) ? trades : [];

  let closedCount = 0;
  let openCount = 0;
  let pendingCount = 0;
  let wins = 0;
  let losses = 0;
  let breakevens = 0;

  let grossProfits = 0;
  let grossLosses = 0;
  let netPnlDollar = 0;
  let netPnlR = 0;

  let mandatoryPassedTrades = 0;
  let gradeAWins = 0;
  let gradeATotal = 0;
  let gradeBWins = 0;
  let gradeBTotal = 0;

  let activeSpotHoldingsValue = 0;

    safeTrades.forEach((t) => {
      if (!t || typeof t !== 'object') return;

      // Spot Holdings check
      if (isSpotTrade(t) && t.status === 'Open') {
        const alloc = typeof t.allocationDollar === 'number' && Number.isFinite(t.allocationDollar) ? t.allocationDollar : 0;
        activeSpotHoldingsValue += alloc;
      }

      if (t.mandatoryRulesPassed) {
        mandatoryPassedTrades++;
      }

      if (t.setupGrade === 'A+') {
        gradeATotal++;
        if (t.tradeResult === 'Win') gradeAWins++;
      } else if (t.setupGrade === 'A' || t.setupGrade === 'B') {
        gradeBTotal++;
        if (t.tradeResult === 'Win') gradeBWins++;
      }

      if (t.status === 'Open') {
        openCount++;
        return;
      }

      if (t.status === 'Pending') {
        pendingCount++;
        return;
      }

      if (t.status === 'Closed') {
        closedCount++;
        const rawPnl = t.pnlDollar;
        const pnl = typeof rawPnl === 'number' && Number.isFinite(rawPnl) ? rawPnl : 0;
        const rawR = t.pnlR;
        const r = typeof rawR === 'number' && Number.isFinite(rawR) ? rawR : (pnl > 0 ? 1 : pnl < 0 ? -1 : 0);

        netPnlDollar += pnl;
        netPnlR += r;

        if (pnl > 0 || t.tradeResult === 'Win') {
          wins++;
          grossProfits += pnl;
        } else if (pnl < 0 || t.tradeResult === 'Loss') {
          losses++;
          grossLosses += Math.abs(pnl);
        } else {
          breakevens++;
        }
      }
    });

    const winRate = closedCount > 0 ? Number(((wins / closedCount) * 100).toFixed(1)) : 0;
    const profitFactor = grossLosses > 0
      ? Number((grossProfits / grossLosses).toFixed(2))
      : grossProfits > 0 ? 99.99 : 0;

  const adherenceRate = safeTrades.length > 0
      ? Number(((mandatoryPassedTrades / safeTrades.length) * 100).toFixed(1))
      : 100;

    const gradeAWinRate = gradeATotal > 0 ? Number(((gradeAWins / gradeATotal) * 100).toFixed(1)) : 0;
    const gradeBWinRate = gradeBTotal > 0 ? Number(((gradeBWins / gradeBTotal) * 100).toFixed(1)) : 0;

    return {
      totalTrades: safeTrades.length,
      closedTrades: closedCount,
      pendingTrades: pendingCount,
      openTrades: openCount,
      wins,
      losses,
      breakevens,
      winRate,
      profitFactor,
      netPnlDollar: Number(netPnlDollar.toFixed(2)),
      netPnlR: Number(netPnlR.toFixed(2)),
      adherenceRate,
      gradeAWinRate,
      gradeBWinRate,
      gradeATotal,
      gradeBTotal,
      activeSpotHoldingsValue: Number(activeSpotHoldingsValue.toFixed(2)),
    };
  }

