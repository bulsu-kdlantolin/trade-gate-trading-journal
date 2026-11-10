import React, { useState, useMemo } from 'react';
import { TradeRecord } from '../../types/trade';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface EquityChartProps {
  trades: TradeRecord[];
  currencySymbol?: string;
}

interface ChartPoint {
  index: number;
  dateStr: string;
  symbol: string;
  pnl: number;
  r: number;
  cumulativeDollar: number;
  cumulativeR: number;
  value: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({
  trades,
  currencySymbol = '$',
}) => {
  const { isDark } = useTheme();
  const [chartMode, setChartMode] = useState<'dollar' | 'r'>('dollar');

  // Filter and sort closed trades chronologically
  const chartData = useMemo(() => {
    const getSafeTimestamp = (t: TradeRecord) => {
      if (typeof t.timestamp === 'number' && Number.isFinite(t.timestamp) && t.timestamp > 0) {
        return t.timestamp;
      }
      if (t.entryTimestamp) {
        const parsed = new Date(t.entryTimestamp).getTime();
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
      return 0;
    };

    const closed = [...trades]
      .filter((t) => t.status === 'Closed' || t.pnlDollar !== undefined)
      .sort((a, b) => getSafeTimestamp(a) - getSafeTimestamp(b));

    let cumDollar = 0;
    let cumR = 0;

    const points: ChartPoint[] = [
      {
        index: 0,
        dateStr: 'Baseline',
        symbol: 'START',
        pnl: 0,
        r: 0,
        cumulativeDollar: 0,
        cumulativeR: 0,
        value: 0,
      },
    ];

    closed.forEach((t, i) => {
      const pnl = typeof t.pnlDollar === 'number' && Number.isFinite(t.pnlDollar) ? t.pnlDollar : 0;
      const r = typeof t.pnlR === 'number' && Number.isFinite(t.pnlR) ? t.pnlR : pnl > 0 ? 1 : pnl < 0 ? -1 : 0;

      cumDollar += pnl;
      cumR += r;

      const ts = getSafeTimestamp(t);
      const dateStr =
        ts > 0
          ? new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : `Trade ${i + 1}`;

      points.push({
        index: i + 1,
        dateStr,
        symbol: t.symbol,
        pnl,
        r,
        cumulativeDollar: Number(cumDollar.toFixed(2)),
        cumulativeR: Number(cumR.toFixed(2)),
        value: chartMode === 'dollar' ? Number(cumDollar.toFixed(2)) : Number(cumR.toFixed(2)),
      });
    });

    return points;
  }, [trades, chartMode]);

  const latestVal = chartData[chartData.length - 1]?.value || 0;
  const isPositive = latestVal >= 0;

  // Visual stroke and fill colors based on Dark vs Light theme
  const strokeColor = isPositive ? (isDark ? '#10B981' : '#059669') : (isDark ? '#F43F5E' : '#E11D48');
  const fillColor = isPositive ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.12)') : (isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(225, 29, 72, 0.12)');
  const gridColor = isDark ? '#1F2430' : '#E2E8F0';

  return (
    <div className="card-glass rounded-2xl p-5 space-y-4">
      {/* Chart Top Header & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Cumulative Growth Curve
            </span>
            <span
              className={`flex items-center gap-1 text-xs font-mono font-bold ${isPositive ? 'text-trade-green' : 'text-trade-red'
                }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {chartMode === 'dollar' ? `${isPositive ? '+' : ''}${currencySymbol}${latestVal.toLocaleString()}` : `${isPositive ? '+' : ''}${latestVal}R`}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Normalized equity performance across all executed setups
          </p>
        </div>

        {/* Currency vs R-Multiple Switcher */}
        <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-border">
          <button
            onClick={() => setChartMode('dollar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'dollar'
              ? 'bg-brand text-black shadow-xs'
              : 'text-text-muted hover:text-text-primary'
              }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Capital ({currencySymbol})
          </button>
          <button
            onClick={() => setChartMode('r')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'r'
              ? 'bg-brand text-black shadow-xs'
              : 'text-text-muted hover:text-text-primary'
              }`}
          >
            <Percent className="w-3.5 h-3.5" />
            R-Multiple
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        {chartData.length <= 1 ? (
          <div className="h-full flex items-center justify-center text-xs text-text-muted">
            No closed trades recorded yet to plot equity curve.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="dateStr"
                stroke={isDark ? '#64748B' : '#94A3B8'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={isDark ? '#64748B' : '#94A3B8'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) =>
                  chartMode === 'dollar' ? `${currencySymbol}${val}` : `${val}R`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartPoint;
                    return (
                      <div className="bg-card border border-border p-2.5 rounded-xl shadow-xl text-xs space-y-1 font-mono">
                        <p className="font-bold text-text-primary font-sans">{data.symbol} ({data.dateStr})</p>
                        <p className={data.value >= 0 ? 'text-trade-green' : 'text-trade-red'}>
                          Net Cumulative: {chartMode === 'dollar' ? `${currencySymbol}${data.cumulativeDollar}` : `${data.cumulativeR}R`}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          Trade Return: {data.pnl >= 0 ? '+' : ''}${data.pnl} ({data.r >= 0 ? '+' : ''}{data.r}R)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

