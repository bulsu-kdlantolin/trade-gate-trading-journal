import React, { useState, useMemo, lazy, Suspense } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { TradeRecord, isFuturesTrade, isSpotTrade } from '../../types/trade';
import { CryptoIcon } from '../common/CryptoIcon';
import { TradeCalendar } from './TradeCalendar';
import { TradeDetailModal } from '../common/TradeDetailModal';
import { TradeEditModal } from './TradeEditModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { AnimatedSelect, SelectOption } from '../common/AnimatedSelect';
import { getCurrencySymbol } from '../../utils/currency';
import { getGradeStyle } from '../../utils/gradeStyles';
import { useToast } from '../../context/ToastContext';

// Lazy-load ShareTradeModal so html-to-image is deferred until share action
const ShareTradeModal = lazy(() =>
  import('../dashboard/ShareTradeModal').then((m) => ({ default: m.ShareTradeModal }))
);
import {
  LayoutList,
  Calendar,
  Search,
  Trash2,
  Eye,
  Edit2,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Filter,
  BookOpen,
  RotateCcw,
  Plus,
} from 'lucide-react';

interface TradeTableProps {
  trades: TradeRecord[];
  activeStrategy: StrategyProfile | null;
  onDeleteTrade: (id: string) => Promise<any>;
  onUpdateTrade: (id: string, updates: Partial<TradeRecord>) => Promise<any>;
  onNavigateToTerminal?: () => void;
}

const OUTCOME_OPTIONS: SelectOption<'all' | 'wins' | 'losses' | 'open'>[] = [
  { value: 'all', label: 'All Outcomes' },
  { value: 'wins', label: 'Winning Trades' },
  { value: 'losses', label: 'Losing Trades' },
  { value: 'open', label: 'Active (Open) Positions' },
];

const GRADE_OPTIONS: SelectOption<string>[] = [
  { value: 'all', label: 'All Grades' },
  { value: 'A+', label: 'Grade A+ Setup' },
  { value: 'A', label: 'Grade A Setup' },
  { value: 'B', label: 'Grade B Setup' },
  { value: 'B+', label: 'Grade B+ Setup' },
  { value: 'C', label: 'Grade C (Disqualified)' },
];

const SESSION_OPTIONS: SelectOption<string>[] = [
  { value: 'all', label: 'All Sessions' },
  { value: 'London', label: 'London Session' },
  { value: 'NY AM', label: 'NY AM Session' },
  { value: 'NY PM', label: 'NY PM Session' },
  { value: 'Asia', label: 'Asia Session' },
];

export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  activeStrategy,
  onDeleteTrade,
  onUpdateTrade,
  onNavigateToTerminal,
}) => {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeTypeFilter, setTradeTypeFilter] = useState<'all' | 'futures' | 'spot'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'wins' | 'losses' | 'open'>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');

  // Modals
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<TradeRecord | null>(null);
  const [selectedTradeForEdit, setSelectedTradeForEdit] = useState<TradeRecord | null>(null);
  const [selectedTradeForShare, setSelectedTradeForShare] = useState<TradeRecord | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<{ id: string; symbol: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const currencySymbol = getCurrencySymbol(activeStrategy?.baseCurrency);

  // Filtered trades computation
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toUpperCase();
        const matchesSymbol = t.symbol.toUpperCase().includes(q);
        const matchesNotes = (t.notes || '').toUpperCase().includes(q);
        if (!matchesSymbol && !matchesNotes) return false;
      }

      if (tradeTypeFilter === 'futures' && t.tradeType !== 'futures') return false;
      if (tradeTypeFilter === 'spot' && t.tradeType !== 'spot') return false;

      if (gradeFilter !== 'all' && t.setupGrade !== gradeFilter) return false;

      if (sessionFilter !== 'all' && t.session !== sessionFilter) return false;

      if (outcomeFilter === 'wins' && t.tradeResult !== 'Win' && (!t.pnlDollar || t.pnlDollar <= 0)) return false;
      if (outcomeFilter === 'losses' && t.tradeResult !== 'Loss' && (!t.pnlDollar || t.pnlDollar >= 0)) return false;
      if (outcomeFilter === 'open' && t.status !== 'Open') return false;

      return true;
    });
  }, [trades, searchQuery, tradeTypeFilter, gradeFilter, outcomeFilter, sessionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  // Paginated window for optimal DOM node performance
  const paginatedTrades = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, validPage, pageSize]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setTradeTypeFilter('all');
    setGradeFilter('all');
    setOutcomeFilter('all');
    setSessionFilter('all');
    setCurrentPage(1);
  };

      const handleDeleteClick = (id: string, symbol: string) => {
        setTradeToDelete({ id, symbol });
      };

      const handleConfirmDelete = async () => {
        if (!tradeToDelete) return;
        try {
          await onDeleteTrade(tradeToDelete.id);
          toast.success('Trade Deleted', `Removed ${tradeToDelete.symbol} entry from ledger.`);
        } catch (err: any) {
          toast.error('Delete Failed', err.message);
        } finally {
          setTradeToDelete(null);
        }
      };

      return (
        <div className="space-y-4">
          {/* Top Filter and Controls Bar */}
          <div className="card-glass rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mode Segmented Switcher (All / Futures / Spot) with Sliding Indicator */}
              <div className="relative grid grid-cols-3 p-1 rounded-xl bg-canvas border border-border select-none min-w-[280px] sm:min-w-[320px]">
                {/* Sliding highlight indicator */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] rounded-lg transition-all duration-200 ease-out shadow-xs pointer-events-none ${tradeTypeFilter === 'all'
                    ? 'left-1 bg-card shadow-xs'
                    : tradeTypeFilter === 'futures'
                      ? 'left-[calc(33.333%+2px)] bg-blue-500/20'
                      : 'left-[calc(66.666%+3px)] bg-emerald-500/20'
                    }`}
                />
                <button
                  onClick={() => { setTradeTypeFilter('all'); setCurrentPage(1); }}
                  className={`relative z-10 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors duration-200 text-center active:scale-[0.98] ${tradeTypeFilter === 'all'
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  All ({trades.length})
                </button>
                <button
                  onClick={() => { setTradeTypeFilter('futures'); setCurrentPage(1); }}
                  className={`relative z-10 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors duration-200 text-center active:scale-[0.98] ${tradeTypeFilter === 'futures'
                    ? 'text-blue-400'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Perps
                </button>
                <button
                  onClick={() => { setTradeTypeFilter('spot'); setCurrentPage(1); }}
                  className={`relative z-10 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors duration-200 text-center active:scale-[0.98] ${tradeTypeFilter === 'spot'
                    ? 'text-emerald-400'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Spot
                </button>
              </div>

              {/* View Mode Toggle: Table vs Calendar with Sliding Indicator */}
              <div className="relative grid grid-cols-2 p-1 rounded-xl bg-canvas border border-border sm:ml-auto select-none min-w-[200px]">
                {/* Sliding highlight indicator */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-brand shadow-xs transition-all duration-200 ease-out pointer-events-none ${viewMode === 'table' ? 'left-1' : 'left-[calc(50%+3px)]'
                    }`}
                />
                <button
                  onClick={() => setViewMode('table')}
                  className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 active:scale-[0.98] ${viewMode === 'table'
                    ? 'text-black font-extrabold'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 active:scale-[0.98] ${viewMode === 'calendar'
                    ? 'text-black font-extrabold'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  PnL Calendar
                </button>
              </div>
            </div>

            {/* Search and Animated Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border">
              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <label htmlFor="trade-ledger-search" className="sr-only">
                  Search trades by ticker or notes
                </label>
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="trade-ledger-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search ticker or notes..."
                  aria-label="Search trades by ticker or notes"
                  className="w-full bg-canvas border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-brand"
                />
                {
                  searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      aria-label="Clear search query"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )
                }
              </div>

              {/* Custom Animated Outcome Filter */}
              <AnimatedSelect
                value={outcomeFilter}
                onChange={(val) => {
                  setOutcomeFilter(val);
                  setCurrentPage(1);
                }}
                options={OUTCOME_OPTIONS}
                prefix={<Filter className="w-3 h-3" />}
              />

              {/* Custom Animated Grade Filter */}
              <AnimatedSelect
                value={gradeFilter}
                onChange={(val) => {
                  setGradeFilter(val);
                  setCurrentPage(1);
                }}
                options={GRADE_OPTIONS}
              />

              {/* Custom Animated Session Filter */}
              <AnimatedSelect
                value={sessionFilter}
                onChange={(val) => {
                  setSessionFilter(val);
                  setCurrentPage(1);
                }}
                options={SESSION_OPTIONS}
              />
            </div>
          </div >

          {/* Main View Area */}
          {
            viewMode === 'calendar' ? (
              <TradeCalendar
                trades={filteredTrades}
                onSelectTrade={(t) => setSelectedTradeForDetail(t)}
                onEditTrade={(t) => setSelectedTradeForEdit(t)}
                currencySymbol={currencySymbol}
              />
            ) : (
              <div className="card-glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-canvas/80 border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider select-none">
                      <tr>
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-3">Mode & Lev</th>
                        <th className="py-3 px-3">Action / Dir</th>
                        <th className="py-3 px-3 text-center">Setup Grade</th>
                        <th className="py-3 px-3 text-right">Entry / Exit</th>
                        <th className="py-3 px-3 text-right">Size / Alloc</th>
                        <th className="py-3 px-3 text-right">Net P&L ({currencySymbol})</th>
                        <th className="py-3 px-3 text-right">R-Multiple</th>
                        <th className="py-3 px-3 text-center">Session</th>
                        <th className="py-3 px-3">Discipline & Tags</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTrades.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-14 text-center">
                            {trades.length === 0 ? (
                              <div className="max-w-sm mx-auto space-y-3">
                                <div className="w-10 h-10 rounded-2xl bg-canvas border border-border flex items-center justify-center text-text-muted mx-auto shadow-xs">
                                  <BookOpen className="w-5 h-5 text-brand" />
                                </div>
                                <h4 className="text-sm font-bold text-text-primary text-balance">No Trade Records in Ledger</h4>
                                <p className="text-xs text-text-muted leading-relaxed text-pretty max-w-xs mx-auto">
                                  Your journal is currently empty. Execute trades through the Pre-Trade Discipline Gate to track risk parameters, setup grades, and realized P&L.
                                </p>
                                {onNavigateToTerminal && (
                                  <button
                                    type="button"
                                    onClick={onNavigateToTerminal}
                                    className="px-3.5 py-1.5 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Log First Trade in Gate
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="max-w-sm mx-auto space-y-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-canvas border border-border flex items-center justify-center text-text-muted mx-auto shadow-xs">
                                  <Filter className="w-5 h-5 text-text-muted" />
                                </div>
                                <h4 className="text-sm font-bold text-text-primary text-balance">No Matching Trades Found</h4>
                                <p className="text-xs text-text-muted leading-relaxed text-pretty max-w-xs mx-auto">
                                  No trade entries match your current search query or active filter criteria.
                                </p>
                                <button
                                  type="button"
                                  onClick={resetAllFilters}
                                  className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-brand/40 text-xs font-semibold text-text-primary transition-colors inline-flex items-center gap-1.5 shadow-xs"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-brand" />
                                  Reset All Filters
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedTrades.map((t) => {
                          const isFut = isFuturesTrade(t);
                          const isSp = isSpotTrade(t);
                          const isWin = t.tradeResult === 'Win' || (t.pnlDollar && t.pnlDollar > 0);
                          const isLoss = t.tradeResult === 'Loss' || (t.pnlDollar && t.pnlDollar < 0);
                          const isOpen = t.status === 'Open';

                          return (
                            <tr
                              key={t.id}
                              className="hover:bg-card-hover/60 transition-colors group"
                            >
                              {/* Asset */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <CryptoIcon symbol={t.symbol} size="sm" />
                                  <div>
                                    <span className="font-mono font-bold text-text-primary text-xs block">
                                      {t.symbol}
                                    </span>
                                    <span className="text-[11px] font-mono text-text-muted block mt-0.5">
                                      {typeof t.timestamp === 'number' && Number.isFinite(t.timestamp) && t.timestamp > 0
                                        ? new Date(t.timestamp).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                        })
                                        : 'Recent'}{' '}
                                      • {t.timeframe}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Mode & Lev */}
                              <td className="py-3 px-3">
                                <span
                                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isFut
                                    ? 'bg-blue-500/15 text-blue-400'
                                    : 'bg-emerald-500/15 text-emerald-400'
                                    }`}
                                >
                                  {isFut ? `PERP ${t.leverage}x` : 'SPOT'}
                                </span>
                              </td>

                              {/* Action / Dir */}
                              <td className="py-3 px-3">
                                {isFut ? (
                                  <span
                                    className={`flex items-center gap-1 font-bold text-xs ${t.direction === 'Long' ? 'text-trade-green' : 'text-trade-red'
                                      }`}
                                  >
                                    {t.direction === 'Long' ? (
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    ) : (
                                      <ArrowDownRight className="w-3.5 h-3.5" />
                                    )}
                                    {t.direction}
                                  </span>
                                ) : isSp ? (
                                  <span className="font-semibold text-text-primary text-[11px]">
                                    {t.spotAction}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>

                              {/* Setup Grade */}
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`font-mono text-xs font-black ${getGradeStyle(t.setupGrade).text}`}
                                >
                                  {t.setupGrade}
                                </span>
                              </td>

                              {/* Entry / Exit */}
                              <td className="py-3 px-3 text-right font-mono tabular-nums">
                                <span className="font-bold text-text-primary text-xs block">
                                  ${Number(t.entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </span>
                                <span className="text-[11px] text-text-muted block mt-0.5">
                                  {t.exitPrice
                                    ? `$${Number(t.exitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                    : isOpen
                                      ? 'Active Open'
                                      : '-'}
                                </span>
                              </td>

                              {/* Size / Allocation */}
                              <td className="py-3 px-3 text-right font-mono tabular-nums">
                                {isFut ? (
                                  <>
                                    <span className="font-bold text-text-primary text-xs block">
                                      ${t.notionalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[11px] text-text-muted block mt-0.5">
                                      {t.calculatedPositionSize} units
                                    </span>
                                  </>
                                ) : isSp ? (
                                  <>
                                    <span className="font-bold text-text-primary text-xs block">
                                      ${t.allocationDollar?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[11px] text-text-muted block mt-0.5">
                                      {t.tokenQuantity} {t.symbol}
                                    </span>
                                  </>
                                ) : (
                                  '-'
                                )}
                              </td>

                              {/* Net PnL ($) */}
                              <td className="py-3 px-3 text-right font-mono tabular-nums">
                                {isOpen ? (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
                                    ACTIVE
                                  </span>
                                ) : (
                                  <span
                                    className={`text-xs font-bold ${isWin ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-primary'
                                      }`}
                                  >
                                    {t.pnlDollar !== undefined
                                      ? `${t.pnlDollar >= 0 ? '+' : ''}$${t.pnlDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : '-'}
                                  </span>
                                )}
                              </td>

                              {/* R-Multiple */}
                              <td className="py-3 px-3 text-right font-mono tabular-nums">
                                {t.pnlR !== undefined ? (
                                  <span
                                    className={`font-bold text-xs ${isWin ? 'text-trade-green' : isLoss ? 'text-trade-red' : 'text-text-secondary'
                                      }`}
                                  >
                                    {t.pnlR >= 0 ? '+' : ''}
                                    {t.pnlR}R
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-xs">-</span>
                                )}
                              </td>

                              {/* Session */}
                              <td className="py-3 px-3 text-center">
                                <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md bg-canvas text-text-secondary">
                                  {t.session}
                                </span>
                              </td>

                              {/* Discipline & Mistakes */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {t.mandatoryRulesPassed ? (
                                    <span
                                      title="Passed all mandatory strategy rules before execution"
                                      className="flex items-center gap-1 text-[11px] font-bold text-trade-green bg-trade-green/15 px-2 py-0.5 rounded-md"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Disciplined
                                    </span>
                                  ) : (
                                    <span
                                      title="Mandatory checklist rules were bypassed or broken"
                                      className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      Rule Violation
                                    </span>
                                  )}

                                  {t.executionErrors &&
                                    t.executionErrors.map((err) =>
                                      err !== 'None' ? (
                                        <span
                                          key={err}
                                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-rose-500" />
                                          {err}
                                        </span>
                                      ) : null
                                    )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Inspect Detail */}
                                  <button
                                    onClick={() => setSelectedTradeForDetail(t)}
                                    title="Inspect full trade execution gate & chart"
                                    aria-label={`Inspect ${t.symbol} trade details`}
                                    className="min-w-[28px] min-h-[28px] flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit / Close Active Trade */}
                                  <button
                                    onClick={() => setSelectedTradeForEdit(t)}
                                    title="Edit trade record / Realize exit"
                                    aria-label={`Edit ${t.symbol} trade entry`}
                                    className="min-w-[28px] min-h-[28px] flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-card transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Share Trade Card */}
                                  <button
                                    onClick={() => setSelectedTradeForShare(t)}
                                    title="Export verified trade performance card (PNG)"
                                    aria-label={`Share ${t.symbol} trade card`}
                                    className="min-w-[28px] min-h-[28px] flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-card transition-colors"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteClick(t.id, t.symbol)}
                                    title="Delete trade"
                                    aria-label={`Delete ${t.symbol} trade record`}
                                    className="min-w-[28px] min-h-[28px] flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-trade-red hover:bg-card transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls Bar */}
                {filteredTrades.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-canvas/40 border-t border-border text-xs">
                    <span className="text-[11px] text-text-muted font-mono">
                      Showing <strong className="text-text-primary font-bold">{(validPage - 1) * pageSize + 1}</strong>–<strong className="text-text-primary font-bold">{Math.min(validPage * pageSize, filteredTrades.length)}</strong> of <strong className="text-text-primary font-bold">{filteredTrades.length}</strong> trades
                    </span>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={validPage === 1}
                          aria-label="Previous page"
                          className="px-2.5 py-1 rounded-lg bg-card border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-[11px] font-mono text-text-muted px-2">
                          Page {validPage} of {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={validPage === totalPages}
                          aria-label="Next page"
                          className="px-2.5 py-1 rounded-lg bg-card border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          {/* Trade Detail Modal */}
          {
            selectedTradeForDetail && (
              <TradeDetailModal
                trade={selectedTradeForDetail}
                onClose={() => setSelectedTradeForDetail(null)}
                currencySymbol={currencySymbol}
                onShare={(t) => {
                  setSelectedTradeForDetail(null);
                  setSelectedTradeForShare(t);
                }}
              />
            )
          }

          {/* Trade Edit Modal */}
          {
            selectedTradeForEdit && (
              <TradeEditModal
                isOpen={!!selectedTradeForEdit}
                trade={selectedTradeForEdit}
                onClose={() => setSelectedTradeForEdit(null)}
                onSave={onUpdateTrade}
                onDelete={onDeleteTrade}
                currencySymbol={currencySymbol}
              />
            )
          }

          {/* Share Trade Modal (Lazy Loaded) */}
          {
            selectedTradeForShare && (
              <Suspense fallback={null}>
                <ShareTradeModal
                  trade={selectedTradeForShare}
                  onClose={() => setSelectedTradeForShare(null)}
                />
              </Suspense>
            )
          }

      {/* Custom Delete Confirmation Modal */ }
      <ConfirmDeleteModal
        isOpen={!!tradeToDelete}
        onClose={() => setTradeToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={tradeToDelete?.symbol}
      />
    </div >
  );
};
