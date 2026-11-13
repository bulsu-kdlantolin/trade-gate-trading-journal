import React, { useState, useMemo } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { TradeRecord, AnalyticsDateFilter, DateRangeState } from '../../types/trade';
import { EquityChart } from './EquityChart';
import { filterTradesByDateRange, calculateTradeMetrics, toISODateString } from '../../utils/metricsCalc';
import { getCurrencySymbol } from '../../utils/currency';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { getGradeStyle } from '../../utils/gradeStyles';
import { getSessionStyle } from '../../utils/badgeStyles';
import { playMicroTick } from '../../utils/audioTelemetry';
import { CustomDateRangePicker } from '../common/CustomDateRangePicker';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  Scale,
  Coins,
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  Layers,
  Plus,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  trades: TradeRecord[];
  activeStrategy: StrategyProfile | null;
  onNavigateToTerminal?: () => void;
}

const FILTER_BUTTONS: { id: AnalyticsDateFilter; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
  { id: 'yearly', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

  export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = React.memo(({
    trades,
    activeStrategy,
    onNavigateToTerminal,
  }) => {
    const [dateFilter, setDateFilter] = useState<AnalyticsDateFilter>('all');
    const [customRange, setCustomRange] = useState<DateRangeState>(() => {
      const now = new Date();
      const past = new Date();
      past.setDate(past.getDate() - 30);
      return { startDate: toISODateString(past), endDate: toISODateString(now) };
    });

    const currencySymbol = getCurrencySymbol(activeStrategy?.baseCurrency);

    // Filtered trades by date
    const filteredTrades = useMemo(() => {
      return filterTradesByDateRange(trades, dateFilter, customRange);
    }, [trades, dateFilter, customRange]);

    // Derived metrics (strictly memoized)
    const metrics = useMemo(() => {
      return calculateTradeMetrics(filteredTrades);
    }, [filteredTrades]);

    // Breakdown by Setup Grade
    const gradeBreakdown = useMemo(() => {
      const grades = ['A+', 'A', 'B', 'B+', 'C'] as const;
      return grades
        .filter((g) => g !== 'B+' || filteredTrades.some((t) => t.setupGrade === 'B+'))
        .map((grade) => {
          const matched = filteredTrades.filter((t) => t.setupGrade === grade);
          const closed = matched.filter((t) => t.status === 'Closed');
          const wins = closed.filter((t) => t.tradeResult === 'Win' || (t.pnlDollar && t.pnlDollar > 0)).length;
          const netPnl = closed.reduce((acc, t) => acc + (t.pnlDollar || 0), 0);
          const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

          return {
            grade,
            total: matched.length,
            closed: closed.length,
            wins,
            netPnl,
            winRate: Number(winRate.toFixed(1)),
          };
        });
    }, [filteredTrades]);

    // Breakdown by Trading Session
    const sessionBreakdown = useMemo(() => {
      const sessions = ['London', 'NY AM', 'NY PM', 'Asia'] as const;
      return sessions.map((sess) => {
        const matched = filteredTrades.filter((t) => t.session === sess);
        const closed = matched.filter((t) => t.status === 'Closed');
        const wins = closed.filter((t) => t.tradeResult === 'Win' || (t.pnlDollar && t.pnlDollar > 0)).length;
        const netPnl = closed.reduce((acc, t) => acc + (t.pnlDollar || 0), 0);
        const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

        return {
          session: sess,
          total: matched.length,
          netPnl,
          winRate: Number(winRate.toFixed(1)),
        };
      });
    }, [filteredTrades]);

    // Breakdown by Execution Mistakes
    const mistakeBreakdown = useMemo(() => {
      const map = new Map<string, { count: number; totalLoss: number }>();
      filteredTrades.forEach((t) => {
        if (t.executionErrors) {
          t.executionErrors.forEach((err) => {
            if (err !== 'None') {
              const cur = map.get(err) || { count: 0, totalLoss: 0 };
              cur.count++;
              if (t.pnlDollar && t.pnlDollar < 0) {
                cur.totalLoss += Math.abs(t.pnlDollar);
              }
              map.set(err, cur);
            }
          });
        }
      });

      return Array.from(map.entries())
        .map(([tag, data]) => ({ tag, count: data.count, totalLoss: data.totalLoss }))
        .sort((a, b) => b.totalLoss - a.totalLoss);
    }, [filteredTrades]);

    const isNetPositive = metrics.netPnlDollar >= 0;

    return (
      <div className="space-y-6">
        {/* Date Filter Bar */}
        <div className="card-glass rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {FILTER_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  playMicroTick();
                  setDateFilter(btn.id);
                }}
                aria-pressed={dateFilter === btn.id}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${dateFilter === btn.id
                  ? 'bg-brand text-black shadow-xs'
                  : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <CustomDateRangePicker
              value={customRange}
              onChange={setCustomRange}
              align="right"
              defaultOpen={true}
            />
          )}
        </div>

        {/* Empty States Handling */}
        {trades.length === 0 ? (
          <div className="card-glass rounded-2xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center text-brand mx-auto shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-text-primary text-balance">No Analytics Available Yet</h3>
            <p className="text-xs text-text-muted leading-relaxed text-pretty max-w-sm mx-auto">
              Performance analytics, equity curves, win rates by setup grade, and discipline audits will calculate automatically once you begin logging trades in the Journal & Gate.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {onNavigateToTerminal && (
                <button
                  type="button"
                  onClick={onNavigateToTerminal}
                  className="px-4 py-2 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Your First Trade
                </button>
              )}
            </div>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-canvas border border-border flex items-center justify-center text-text-muted mx-auto shadow-xs">
              <Calendar className="w-5 h-5 text-brand" />
            </div>
            <h4 className="text-sm font-bold text-text-primary text-balance">No Trades in Selected Timeframe</h4>
            <p className="text-xs text-text-muted leading-relaxed text-pretty max-w-sm mx-auto">
              There are no recorded trades within the chosen date filter. Try expanding your date range to view historical performance.
            </p>
            <button
              onClick={() => setDateFilter('all')}
              className="px-3.5 py-1.5 rounded-xl bg-card border border-border hover:border-brand/40 text-xs font-semibold text-text-primary transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              Show All Time
            </button>
          </div>
        ) : (
          <>
            {/* KPI Bento Grid (6 Key Performance Indicators) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* 1. Net P&L */}
              <div className="card-glass rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Net Realized P&L</span>
                  {isNetPositive ? (
                    <TrendingUp className="w-4 h-4 text-trade-green" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-trade-red" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-xl font-extrabold font-mono tabular-nums inline-flex items-center gap-1.5 ${isNetPositive ? 'text-trade-green' : 'text-trade-red'
                      }`}
                  >
                    <CurrencyDisplay
                      amount={metrics.netPnlDollar}
                      currency={activeStrategy?.baseCurrency}
                      showSign={true}
                      size="xs"
                    />
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {metrics.netPnlR >= 0 ? '+' : ''}{metrics.netPnlR}R Total
                  </p>
                </div>
              </div>

              {/* 2. Win Rate */}
              <div className="card-glass rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Win Rate</span>
                  <Target className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p
                    className={`text-xl font-extrabold font-mono tabular-nums ${metrics.winRate >= 50 && metrics.closedTrades > 0 ? 'text-trade-green' : 'text-text-primary'
                      }`}
                  >
                    {metrics.winRate}%
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {metrics.wins}W • {metrics.losses}L • {metrics.breakevens}BE
                  </p>
                </div>
              </div>

              {/* 3. Discipline Rate */}
              <div className="card-glass rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Discipline Rate</span>
                  <ShieldCheck className="w-4 h-4 text-trade-green" />
                </div>
                <div>
                  <p className="text-xl font-extrabold font-mono tabular-nums text-trade-green">
                    {metrics.adherenceRate}%
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Required rules met
                  </p>
                </div>
              </div>

              {/* 4. A+ Setup Win Rate */}
              <div className="card-glass rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider">A+ Setup Win Rate</span>
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xl font-extrabold font-mono tabular-nums text-brand">
                    {metrics.gradeAWinRate}%
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {metrics.gradeATotal} Pristine Setups
                  </p>
                </div>
              </div>

              {/* 5. Profit Factor */}
              <div className="card-glass rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Profit Factor</span>
                  <Scale className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p
                    className={`text-xl font-extrabold font-mono tabular-nums ${metrics.profitFactor >= 1.5
                      ? 'text-trade-green'
                      : metrics.profitFactor >= 1.0
                        ? 'text-text-primary'
                        : metrics.losses > 0
                          ? 'text-trade-red'
                          : 'text-text-primary'
                      }`}
                  >
                    {metrics.profitFactor}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Gross Win / Gross Loss
                  </p>
                </div>
              </div>

              {/* 6. Active Spot Holdings Value */}
              <div className="card-glass rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Active Spot Bags</span>
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-extrabold font-mono tabular-nums text-text-primary inline-flex items-center gap-1.5">
                    <CurrencyDisplay
                      amount={metrics.activeSpotHoldingsValue}
                      currency={activeStrategy?.baseCurrency}
                      size="xs"
                    />
                  </p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {metrics.openTrades} Open Positions
                  </p>
                </div>
              </div>
            </div>

            {/* Equity Curve Chart */}
            <EquityChart trades={filteredTrades} currencySymbol={currencySymbol} baseCurrency={activeStrategy?.baseCurrency} />

            {/* Breakdown Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Setup Grade Performance */}
              <div className="card-glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary text-balance">
                      Setup Grade Win Rates
                    </h4>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">Confidence Tier</span>
                </div>

                <div className="space-y-3">
                  {gradeBreakdown.map((item) => (
                    <div key={item.grade} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {/* Containerless Setup Grade Label (No background, No container border) */}
                          <span
                            className={`font-mono text-xs ${getGradeStyle(item.grade).text}`}
                          >
                            {item.grade}
                          </span>
                          <span className="text-text-secondary text-[11px]">
                            {item.closed} closed ({item.wins} wins)
                          </span>
                        </div>
                        {/* Win Rate displayed in official setup grade color */}
                        <span className={`font-mono font-bold tabular-nums text-xs ${getGradeStyle(item.grade).text}`}>
                          {item.winRate}% WR
                        </span>
                      </div>
                      {/* Progress bar in official setup grade color */}
                      <div className="w-full bg-card-hover h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getGradeStyle(item.grade).progress}`}
                          style={{ width: `${Math.min(100, item.winRate)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Liquidity Performance */}
              <div className="card-glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary text-balance">
                      Session Performance
                    </h4>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">Liquidity Windows</span>
                </div>

                <div className="space-y-3">
                  {sessionBreakdown.map((item) => {
                    const isWin = item.netPnl >= 0;
                    return (
                      <div key={item.session} className="flex items-center justify-between text-xs p-2 rounded-xl bg-canvas border border-border">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${getSessionStyle(item.session).dot
                              }`}
                          />
                          <div>
                            <span className="font-bold text-text-primary block">{item.session}</span>
                            <span className="text-[10px] text-text-muted font-mono">{item.total} trades logged</span>
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <span className={`font-bold block ${isWin ? 'text-trade-green' : 'text-trade-red'}`}>
                            <CurrencyDisplay
                              amount={item.netPnl}
                              currency={activeStrategy?.baseCurrency}
                              showSign={true}
                              size="xs"
                            />
                          </span>
                          <span className="text-[10px] text-text-muted">{item.winRate}% Win</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Mistake Cost Audit */}
              <div className="card-glass rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-trade-red" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary text-balance">
                      Discipline Mistake Cost
                    </h4>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">Leak Audit</span>
                </div>

                {mistakeBreakdown.length === 0 ? (
                  <p className="text-xs text-text-muted py-6 text-center text-pretty">
                    No discipline errors recorded! Pristine trading execution.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {mistakeBreakdown.map((m) => (
                      <div
                        key={m.tag}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-canvas border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-trade-red">
                            {m.count}x
                          </span>
                          <span className="font-medium text-text-primary">{m.tag}</span>
                        </div>
                        <span className="font-mono font-bold text-trade-red tabular-nums inline-flex items-center gap-0.5">
                          <CurrencyDisplay
                            amount={-m.totalLoss}
                            currency={activeStrategy?.baseCurrency}
                            size="xs"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
});

