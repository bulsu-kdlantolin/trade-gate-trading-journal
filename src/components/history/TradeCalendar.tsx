import React, { useState, useMemo } from 'react';
import { TradeRecord } from '../../types/trade';
import { CryptoIcon } from '../common/CryptoIcon';
import { getGradeStyle } from '../../utils/gradeStyles';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, Edit, X } from 'lucide-react';

interface TradeCalendarProps {
  trades: TradeRecord[];
  onSelectTrade?: (trade: TradeRecord) => void;
  onEditTrade?: (trade: TradeRecord) => void;
  currencySymbol?: string;
}

export const TradeCalendar: React.FC<TradeCalendarProps> = ({
  trades,
  onSelectTrade,
  onEditTrade,
  currencySymbol = '$',
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group trades by date key (YYYY-MM-DD)
  const tradesByDay = useMemo(() => {
    const map = new Map<string, { trades: TradeRecord[]; netPnl: number; netR: number; wins: number; losses: number }>();

    trades.forEach((t) => {
      const ts =
        typeof t.timestamp === 'number' && Number.isFinite(t.timestamp) && t.timestamp > 0
          ? t.timestamp
          : t.entryTimestamp
            ? new Date(t.entryTimestamp).getTime()
            : 0;

      if (!ts || isNaN(ts)) return;

      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const existing = map.get(key) || { trades: [], netPnl: 0, netR: 0, wins: 0, losses: 0 };
      existing.trades.push(t);

      const pnl = typeof t.pnlDollar === 'number' && Number.isFinite(t.pnlDollar) ? t.pnlDollar : 0;
      const r = typeof t.pnlR === 'number' && Number.isFinite(t.pnlR) ? t.pnlR : pnl > 0 ? 1 : pnl < 0 ? -1 : 0;
      existing.netPnl += pnl;
      existing.netR += r;

      if (pnl > 0 || t.tradeResult === 'Win') existing.wins++;
      else if (pnl < 0 || t.tradeResult === 'Loss') existing.losses++;

      map.set(key, existing);
    });

    return map;
  }, [trades]);

  // Generate calendar days grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday start

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dayNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
      isToday: boolean;
      data?: { trades: TradeRecord[]; netPnl: number; netR: number; wins: number; losses: number };
    }[] = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateKey = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey,
        isToday: false,
        data: tradesByDay.get(dateKey),
      });
    }

    // Current month days
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        dateKey,
        isToday: dateKey === todayKey,
        data: tradesByDay.get(dateKey),
      });
    }

    // Next month padding
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextM = month === 11 ? 1 : month + 2;
        const nextY = month === 11 ? year + 1 : year;
        const dateKey = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
          dayNumber: i,
          isCurrentMonth: false,
          dateKey,
          isToday: false,
          data: tradesByDay.get(dateKey),
        });
      }
    }

    return days;
  }, [year, month, tradesByDay]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Trades for selected day
  const selectedDayData = selectedDayKey ? tradesByDay.get(selectedDayKey) : null;

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between card-glass rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-bold text-text-primary">{monthName}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Strip */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((d, index) => {
          const hasTrades = d.data && d.data.trades.length > 0;
          const isProfitable = hasTrades && d.data!.netPnl > 0;
          const isLoss = hasTrades && d.data!.netPnl < 0;
          const isSelected = selectedDayKey === d.dateKey;

          return (
            <div
              key={index}
              onClick={() => {
                if (hasTrades) {
                  setSelectedDayKey(isSelected ? null : d.dateKey);
                }
              }}
              className={`min-h-[72px] sm:min-h-[84px] p-2 rounded-xl border flex flex-col justify-between transition-all ${d.isCurrentMonth
                ? 'bg-card text-text-primary'
                : 'bg-canvas/30 text-text-muted border-border/40 opacity-30'
                } ${isSelected
                  ? 'border-brand ring-2 ring-brand/50 shadow-md'
                  : d.isToday
                    ? 'border-brand/70'
                    : 'border-border'
                } ${hasTrades ? 'cursor-pointer hover:border-brand/60' : ''
                } ${isProfitable
                  ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                  : isLoss
                    ? 'bg-rose-500/[0.04] border-rose-500/30'
                    : ''
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono ${d.isToday ? 'text-brand' : ''}`}>
                  {d.dayNumber}
                </span>

                {hasTrades && (
                  <div className="flex items-center gap-1">
                    {d.data!.wins > 0 && <span className="w-1.5 h-1.5 rounded-full bg-trade-green" />}
                    {d.data!.losses > 0 && <span className="w-1.5 h-1.5 rounded-full bg-trade-red" />}
                  </div>
                )}
              </div>

              {hasTrades ? (
                <div className="space-y-0.5 text-right font-mono mt-1">
                  <p
                    className={`text-xs font-bold tabular-nums ${isProfitable ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-primary'
                      }`}
                  >
                    {d.data!.netPnl >= 0 ? '+' : ''}{currencySymbol}{Math.round(d.data!.netPnl).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-muted tabular-nums">
                    {d.data!.trades.length} {d.data!.trades.length === 1 ? 'trade' : 'trades'} • {d.data!.netR >= 0 ? '+' : ''}{d.data!.netR.toFixed(1)}R
                  </p>
                </div>
              ) : (
                <div />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Filtered Trades List */}
      {selectedDayKey && selectedDayData && (
        <div className="card-glass rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-text-primary">
                Trades for {selectedDayKey} ({selectedDayData.trades.length} executions)
              </h4>
              <span
                className={`font-mono text-xs font-bold ${selectedDayData.netPnl >= 0 ? 'text-trade-green' : 'text-trade-red'
                  }`}
              >
                Net: {selectedDayData.netPnl >= 0 ? '+' : ''}{currencySymbol}{selectedDayData.netPnl.toLocaleString()} ({selectedDayData.netR >= 0 ? '+' : ''}{selectedDayData.netR.toFixed(1)}R)
              </span>
            </div>
            <button
              onClick={() => setSelectedDayKey(null)}
              className="text-text-muted hover:text-text-primary p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {selectedDayData.trades.map((t) => {
              const isWin = t.tradeResult === 'Win' || (t.pnlDollar && t.pnlDollar > 0);
              const isLoss = t.tradeResult === 'Loss' || (t.pnlDollar && t.pnlDollar < 0);

              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CryptoIcon symbol={t.symbol} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-text-primary">{t.symbol}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-canvas border border-border text-text-secondary">
                          {t.tradeType === 'futures' ? `${t.leverage}x` : 'SPOT'}
                        </span>
                        <span className={`text-[10px] font-bold ${getGradeStyle(t.setupGrade).text}`}>Grade {t.setupGrade}</span>
                      </div>
                      <p className="text-[10px] text-text-muted">{t.strategyName} • Entry: ${t.entryPrice}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono tabular-nums">
                      <span
                        className={`font-bold block ${isWin ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-primary'
                          }`}
                      >
                        {t.pnlDollar !== undefined
                          ? `${t.pnlDollar >= 0 ? '+' : ''}${currencySymbol}${t.pnlDollar}`
                          : t.status}
                      </span>
                      {t.pnlR !== undefined && (
                        <span className="text-[10px] text-text-muted">
                          {t.pnlR >= 0 ? '+' : ''}{t.pnlR}R
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onSelectTrade && (
                        <button
                          onClick={() => onSelectTrade(t)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card transition-colors"
                          title="Inspect details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onEditTrade && (
                        <button
                          onClick={() => onEditTrade(t)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-card transition-colors"
                          title="Edit trade"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
