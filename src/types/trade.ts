import { TimeframeTag, SessionTag } from './strategy';

export type TradeExecutionMode = 'LiveGate' | 'Backtest' | 'BacktestSpeed';
export type TradeStatus = 'Pending' | 'Open' | 'Closed' | 'Cancelled';
export type TradeDirection = 'Long' | 'Short';
export type SpotAction = 'BUY / ACCUMULATE' | 'DCA ADD' | 'PARTIAL TP' | 'FULL EXIT';
export type MarginType = 'Isolated' | 'Cross';
export type VenueCustodyTag =
  | 'CEX Spot'
  | 'Hardware / Cold Wallet'
  | 'Solana DEX'
  | 'EVM DEX'
  | 'Hyperliquid Spot';

export type TradeGrade = 'A+' | 'A' | 'B+' | 'B' | 'C';
export type TradeResult = 'Win' | 'Loss' | 'Breakeven';

export type ExecutionErrorTag =
  | 'FOMO'
  | 'Moved SL'
  | 'Early Exit'
  | 'Over-leveraged'
  | 'Late Entry'
  | 'Impulse Trade'
  | 'Chased Price'
  | 'Revenge Trade'
  | 'No Invalidation'
  | 'None';

export interface CheckedRuleState {
  ruleId: string;
  ruleLabel: string;
  isMandatory: boolean;
  weight: number;
  isTicked: boolean;
}

export interface BaseTradeRecord {
  id: string;
  timestamp: number;
  strategyId: string;
  strategyName: string;
  executionMode: TradeExecutionMode;
  status: TradeStatus;
  symbol: string;
  accountBalance: number;

  // Checklist & Discipline Gate
  checkedRules: CheckedRuleState[];
  mandatoryRulesPassed: boolean;
  confluenceScore: number;
  maxConfluenceScore: number;
  setupGrade: TradeGrade;

  // Metadata
  timeframe: TimeframeTag;
  session: SessionTag;
  executionErrors?: ExecutionErrorTag[];
  notes?: string;
  screenshotUrl?: string;
  screenshotBase64?: string;
  entryTimestamp?: string;
  exitTimestamp?: string;

  // Outcome
  exitPrice?: number;
  pnlDollar?: number;
  pnlR?: number;
  pnlPercentage?: number;
  tradeResult?: TradeResult;
}

export interface FuturesTradeRecord extends BaseTradeRecord {
  tradeType: 'futures';
  direction: TradeDirection;
  leverage: number;
  marginType: MarginType;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskPercentage: number;
  riskAmountDollar: number;
  calculatedPositionSize: number; // Token quantity e.g. 0.45 BTC
  notionalValue: number;          // Position size * entry price
  estLiquidationPrice: number;
  riskRewardRatio: number;
}

export interface SpotTradeRecord extends BaseTradeRecord {
  tradeType: 'spot';
  spotAction: SpotAction;
  entryPrice: number;
  allocationDollar: number;
  tokenQuantity: number;          // Allocation dollar / entry price
  portfolioWeight: number;        // (Allocation / Balance) * 100
  targetSellPrice: number;        // TP target
  stopLossPrice?: number;         // Optional Invalidation SL
  venueTag: VenueCustodyTag;
  projectedRoi: number;           // ((TP - Entry) / Entry) * 100
  targetMultiple: number;         // TP / Entry e.g. 2.5x
  riskRewardRatio?: number;
}

export type TradeRecord = FuturesTradeRecord | SpotTradeRecord;

/**
 * Type guards for discriminated union
 */
export function isFuturesTrade(trade: TradeRecord): trade is FuturesTradeRecord {
  return trade.tradeType === 'futures';
}

export function isSpotTrade(trade: TradeRecord): trade is SpotTradeRecord {
  return trade.tradeType === 'spot';
}

export interface TradeJournalMetrics {
  totalTrades: number;
  closedTrades: number;
  pendingTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  profitFactor: number;
  netPnlDollar: number;
  netPnlR: number;
  adherenceRate: number; // Discipline rate
  gradeAWinRate: number;
  gradeBWinRate: number;
  gradeATotal: number;
  gradeBTotal: number;
  activeSpotHoldingsValue: number;
}

export type AnalyticsDateFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface DateRangeState {
  startDate: string;
  endDate: string;
}

