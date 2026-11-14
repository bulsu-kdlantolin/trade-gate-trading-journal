import React, { useState, useMemo, useEffect } from 'react';
import { TradeRecord } from '../../types/trade';
import { CryptoIcon } from '../common/CryptoIcon';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { getGradeStyle } from '../../utils/gradeStyles';
import { getSessionStyle } from '../../utils/badgeStyles';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Eye, Edit, X } from 'lucide-react';
import { playMicroTick, playCalendarDayClick, playModalOpen, playModalClose } from '../../utils/audioTelemetry';

interface TradeCalendarProps {
  trades: TradeRecord[];
  onSelectTrade?: (trade: TradeRecord) => void;
  onEditTrade?: (trade: TradeRecord) => void;
  currencySymbol?: string;
  baseCurrency?: string;
}

  export const TradeCalendar: React.FC<TradeCalendarProps> = React.memo(({
    trades,
    onSelectTrade,
    onEditTrade,
    currencySymbol = '$',
    baseCurrency = 'USD',
  }) => {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

    useEffect(() => {
      if (!selectedDayKey) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedDayKey(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDayKey]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handlePrevMonth = () => {
      playMicroTick();
      setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
      playMicroTick();
      setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
      playMicroTick();
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

    // Monthly aggregate metrics for the active calendar view
    const monthStats = useMemo(() => {
      let totalPnl = 0;
      let totalTrades = 0;
      let winningDays = 0;
      let losingDays = 0;
      let totalR = 0;

        calendarDays.forEach((d) => {
          if (d.isCurrentMonth && d.data && d.data.trades.length > 0) {
            totalPnl += d.data.netPnl;
            totalTrades += d.data.trades.length;
            totalR += d.data.netR;
            if (d.data.netPnl > 0) winningDays++;
            else if (d.data.netPnl < 0) losingDays++;
          }
        });

        return { totalPnl, totalTrades, winningDays, losingDays, totalR };
      }, [calendarDays]);

    // Trades for selected day
    const selectedDayData = selectedDayKey ? tradesByDay.get(selectedDayKey) : null;

    return (
      <div className="space-y-4">
        {/* Calendar Header with Monthly Performance Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-glass rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-text-primary">{monthName}</h3>
            </div>

                    {monthStats.totalTrades > 0 && (
                      <div className="hidden sm:flex items-center gap-2 font-mono text-xs pl-2 border-l border-border">
                        <span className="text-text-muted">Net:</span>
                        <span className={`font-bold ${monthStats.totalPnl >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
                          <CurrencyDisplay
                            amount={Math.round(monthStats.totalPnl)}
                            currency={baseCurrency}
                            showSign={true}
                            size="xs"
                            decimals={0}
                          />
                        </span>
                        <span className="text-text-muted text-[11px]">
                          ({monthStats.totalR >= 0 ? '+' : ''}{monthStats.totalR.toFixed(1)}R)
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-text-muted text-[11px]">
                          {monthStats.winningDays}W - {monthStats.losingDays}L Days
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={handleToday}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary transition-colors active:scale-[0.98]"
                    >
                      Today
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary transition-colors active:scale-[0.95]"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary transition-colors active:scale-[0.95]"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weekday Strip */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-wider select-none py-1">
                  <span><span className="hidden sm:inline">Mon</span><span className="sm:hidden">M</span></span>
                  <span><span className="hidden sm:inline">Tue</span><span className="sm:hidden">T</span></span>
                  <span><span className="hidden sm:inline">Wed</span><span className="sm:hidden">W</span></span>
                  <span><span className="hidden sm:inline">Thu</span><span className="sm:hidden">T</span></span>
                  <span><span className="hidden sm:inline">Fri</span><span className="sm:hidden">F</span></span>
                  <span><span className="hidden sm:inline">Sat</span><span className="sm:hidden">S</span></span>
                  <span><span className="hidden sm:inline">Sun</span><span className="sm:hidden">S</span></span>
                </div>

                    {/* Days Grid */ }
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                      {calendarDays.map((d, index) => {
                        const hasTrades = d.data && d.data.trades.length > 0;
                        const isProfitable = hasTrades && d.data!.netPnl > 0;
                        const isLoss = hasTrades && d.data!.netPnl < 0;
                        const isSelected = selectedDayKey === d.dateKey;

                              return (
                                <div
                                  key={index}
                                  role={hasTrades ? 'button' : undefined}
                                  tabIndex={hasTrades ? 0 : undefined}
                                  aria-pressed={hasTrades ? isSelected : undefined}
                                  aria-label={
                                    hasTrades
                                      ? `${d.dateKey}, ${d.data!.trades.length} trades, net PnL ${d.data!.netPnl >= 0 ? '+' : ''}${d.data!.netPnl.toFixed(2)}. Click to inspect daily breakdown.`
                                      : d.dateKey
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === ' ' || e.key === 'Enter') {
                                      e.preventDefault();
                                      if (hasTrades) {
                                        if (isSelected) {
                                          playModalClose();
                                          setSelectedDayKey(null);
                                        } else {
                                          playCalendarDayClick();
                                          setSelectedDayKey(d.dateKey);
                                        }
                                      }
                                    }
              }}
              onClick={() => {
                if (hasTrades) {
                  if (isSelected) {
                    playModalClose();
                    setSelectedDayKey(null);
                  } else {
                    playCalendarDayClick();
                    setSelectedDayKey(d.dateKey);
                  }
                }
              }}
              className={`min-h-[82px] sm:min-h-[110px] md:min-h-[125px] lg:min-h-[135px] p-1.5 sm:p-2.5 md:p-3 rounded-xl border flex flex-col justify-between transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand ${d.isCurrentMonth
                        ? 'bg-card text-text-primary'
                        : 'bg-canvas/30 text-text-muted border-border opacity-30'
                      } ${isSelected
                        ? 'border-brand ring-2 ring-brand/50 shadow-md scale-[1.01]'
                        : d.isToday
                          ? '!border-brand !border-2 ring-1 ring-brand/40 shadow-xs'
                          : isProfitable
                            ? 'border-emerald-500/30 hover:border-emerald-500/50'
                            : isLoss
                              ? 'border-rose-500/30 hover:border-rose-500/50'
                              : 'border-border'
                      } ${hasTrades ? 'cursor-pointer hover:border-brand/60 hover:shadow-xs' : ''
                      } ${isProfitable
                        ? 'bg-emerald-500/[0.04]'
                        : isLoss
                            ? 'bg-rose-500/[0.04]'
                            : ''
                      }`}
            >
                        {/* Top Row: Date & Mini Status */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs sm:text-sm font-mono font-bold leading-none inline-flex items-center justify-center ${d.isToday
                              ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-brand text-text-primary dark:text-brand bg-brand/15 font-extrabold shadow-xs'
                              : d.isCurrentMonth
                                ? 'text-text-primary w-6 h-6 sm:w-7 sm:h-7'
                                : 'text-text-muted/60 w-6 h-6 sm:w-7 sm:h-7'
                              }`}
                          >
                            {d.dayNumber}
                          </span>

                                {hasTrades && (
                                  <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-end">
                                    {d.data!.wins > 0 && (
                      <span className="inline-flex items-center text-[8.5px] sm:text-[9px] font-mono font-bold text-trade-green bg-emerald-500/15 px-1 py-0.2 sm:py-0.5 rounded">
                        {d.data!.wins}W
                      </span>
                    )}
                    {d.data!.losses > 0 && (
                      <span className="inline-flex items-center text-[8.5px] sm:text-[9px] font-mono font-bold text-trade-red bg-rose-500/15 px-1 py-0.2 sm:py-0.5 rounded">
                        {d.data!.losses}L
                      </span>
                                    )}
                                  </div>
                )}
                            </div>

                                    {/* Bottom Area: PnL and Metrics */}
                                    {hasTrades ? (
                                      <div className="space-y-1 text-right font-mono mt-auto pt-2">
                                        <div
                                          className={`text-xs sm:text-sm md:text-base font-extrabold tabular-nums tracking-tight leading-tight ${isProfitable ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-primary'
                                            }`}
                                        >
                                          <CurrencyDisplay
                                            amount={Math.round(d.data!.netPnl)}
                                            currency={baseCurrency}
                                            showSign={true}
                                            size="sm"
                                            decimals={0}
                                          />
                                        </div>
                                            <div className="text-[9.5px] sm:text-[10.5px] text-text-muted tabular-nums truncate flex items-center justify-end gap-1.5">
                                              <span className="hidden sm:inline">
                                                {d.data!.trades.length} {d.data!.trades.length === 1 ? 'trade' : 'trades'} •{' '}
                                              </span>
                                              <span className={`font-semibold ${d.data!.netR >= 0 ? 'text-trade-green/90' : 'text-trade-red/90'}`}>
                                                {d.data!.netR >= 0 ? '+' : ''}{d.data!.netR.toFixed(1)}R
                                              </span>
                                            </div>
                                        </div>
                                        ) : (
                                        <div className="h-6" />
              )}
                                      </div>
                                    );
        })}
                                  </div>

                                      {/* Selected Day Filtered Trades Modal Popup */ }
                                      {
                                        selectedDayKey && selectedDayData && (
                                          <div
                                            role="dialog"
                                            aria-modal="true"
                                            aria-label={`Trades for ${selectedDayKey}`}
                                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
                                            onClick={() => {
                                              playModalClose();
                                              setSelectedDayKey(null);
                                            }}
                                          >
                                            <div
                                              className="card-glass rounded-2xl p-5 space-y-3 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl border border-border animate-in zoom-in-95 duration-150"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className="flex items-center justify-between pb-3 border-b border-border">
                                                <div className="flex items-center gap-2">
                                                  <CalendarIcon className="w-4 h-4 text-brand" />
                                                  <h4 className="text-xs font-bold text-text-primary">
                                                    Trades for {selectedDayKey} ({selectedDayData.trades.length} {selectedDayData.trades.length === 1 ? 'execution' : 'executions'})
                                                  </h4>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                  <span
                                                    className={`font-mono text-xs font-bold inline-flex items-center gap-1 ${selectedDayData.netPnl >= 0 ? 'text-trade-green' : 'text-trade-red'
                                                      }`}
                                                  >
                                                    <span>Net:</span>
                                                    <CurrencyDisplay
                                                      amount={selectedDayData.netPnl}
                                                      currency={baseCurrency}
                                                      showSign={true}
                                                      size="xs"
                                                    />
                                                    <span>({selectedDayData.netR >= 0 ? '+' : ''}{selectedDayData.netR.toFixed(1)}R)</span>
                                                  </span>
                                                  <button
                                                    onClick={() => {
                                                      playModalClose();
                                                      setSelectedDayKey(null);
                                                    }}
                                                    className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-card transition-colors"
                                                    aria-label="Close trades popup"
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
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
                                                                <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${t.tradeType === 'futures'
                                                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                                    }`}
                                                                >
                                                                  {t.tradeType === 'futures' ? `${t.leverage}x` : 'SPOT'}
                                                                </span>
                                                                <span className={`text-[10px] font-bold ${getGradeStyle(t.setupGrade).text}`}>
                                                                  Grade {t.setupGrade}
                                                                </span>
                                                                <span
                                                                  className={`inline-flex items-center gap-1 text-[9.5px] font-bold font-mono px-1.5 py-0.2 rounded ${getSessionStyle(t.session).badge
                                                                    }`}
                                                                >
                                                                  <span
                                                                    className={`w-1 h-1 rounded-full shrink-0 ${getSessionStyle(t.session).dot
                                                                      }`}
                                                                  />
                                                                  {t.session}
                                                                </span>
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
                            {t.pnlDollar !== undefined ? (
                              <CurrencyDisplay
                                amount={t.pnlDollar}
                                currency={baseCurrency}
                                showSign={true}
                                size="xs"
                              />
                            ) : (
                              t.status
                            )}
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
                                                                onClick={() => {
                                                                  playModalOpen();
                                                                  onSelectTrade(t);
                                                                }}
                                                                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card transition-colors"
                                                                title="Inspect details"
                                                              >
                                                                <Eye className="w-3.5 h-3.5" />
                                                              </button>
                                                            )}
                                                            {onEditTrade && (
                                                              <button
                                                                onClick={() => {
                                                                  playModalOpen();
                                                                  onEditTrade(t);
                                                                }}
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
          </div >
                                  )
      }
                                </div >
                                );
});
