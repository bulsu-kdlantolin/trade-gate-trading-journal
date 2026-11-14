import React, { useState, useMemo } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { TradeRecord, SpotTradeRecord, isSpotTrade, TradeResult } from '../../types/trade';
import { CryptoIcon } from '../common/CryptoIcon';
import { VenueIcon } from '../common/VenueIcon';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { useLivePrices } from '../../hooks/useLivePrices';
import { normalizeSymbolToTicker } from '../../services/livePriceService';
import { getGradeStyle } from '../../utils/gradeStyles';
import { getSpotActionStyle } from '../../utils/badgeStyles';
import { useToast } from '../../context/ToastContext';
import { playMicroTick, playSuccessChime, playModalOpen, playModalClose, playDangerAction } from '../../utils/audioTelemetry';
import {
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  ShieldCheck,
  Building2,
  Target,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SpotCurrentHoldingsProps {
  trades: TradeRecord[];
  activeStrategy: StrategyProfile | null;
  onUpdateTrade: (id: string, updates: Partial<TradeRecord>) => Promise<unknown>;
  onOpenDetail: (trade: TradeRecord) => void;
  onOpenEdit: (trade: TradeRecord) => void;
  onNavigateToTerminal?: () => void;
}

interface AggregatedAsset {
  symbol: string;
  baseTicker: string;
  totalQuantity: number;
  totalCostBasis: number;
  avgEntryPrice: number;
  livePrice: number;
  currentValue: number;
  unrealizedPnlDollar: number;
  unrealizedPnlPct: number;
  portfolioWeight: number;
  venues: string[];
  tranches: SpotTradeRecord[];
  firstEntryTimestamp: number;
  latestEntryTimestamp: number;
  highestTarget?: number;
  invalidationSl?: number;
}

export const SpotCurrentHoldings: React.FC<SpotCurrentHoldingsProps> = React.memo(({
  trades,
  activeStrategy,
  onUpdateTrade,
  onOpenDetail,
  onOpenEdit,
  onNavigateToTerminal,
}) => {
  const toast = useToast();
  const { getPrice, formatLivePrice, isRefreshing, refreshNow } = useLivePrices();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'tranches'>('grouped');
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});

  // Exit / Take Profit Modal State
  const [tradeToExit, setTradeToExit] = useState<SpotTradeRecord | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  // Filter only open spot trades
  const openSpotTrades = useMemo(() => {
    return trades.filter((t): t is SpotTradeRecord => isSpotTrade(t) && t.status === 'Open');
  }, [trades]);

  // Aggregate holdings by unique symbol / token
  const aggregatedAssets = useMemo(() => {
    const map = new Map<string, {
      symbol: string;
      baseTicker: string;
      totalQuantity: number;
      totalCostBasis: number;
      venues: Set<string>;
      tranches: SpotTradeRecord[];
      firstEntry: number;
      latestEntry: number;
      highestTarget?: number;
      invalidationSl?: number;
    }>();

    openSpotTrades.forEach((t) => {
      const ticker = normalizeSymbolToTicker(t.symbol);
      const qty = typeof t.tokenQuantity === 'number' && Number.isFinite(t.tokenQuantity) ? t.tokenQuantity : 0;
      const cost = typeof t.allocationDollar === 'number' && Number.isFinite(t.allocationDollar)
        ? t.allocationDollar
        : qty * t.entryPrice;

      const existing = map.get(ticker) || {
        symbol: t.symbol,
        baseTicker: ticker,
        totalQuantity: 0,
        totalCostBasis: 0,
        venues: new Set<string>(),
        tranches: [],
        firstEntry: t.timestamp || Date.now(),
        latestEntry: t.timestamp || Date.now(),
        highestTarget: t.targetSellPrice,
        invalidationSl: t.stopLossPrice,
      };

      existing.totalQuantity += qty;
      existing.totalCostBasis += cost;
      if (t.venueTag) existing.venues.add(t.venueTag);
      existing.tranches.push(t);
      if (t.timestamp < existing.firstEntry) existing.firstEntry = t.timestamp;
      if (t.timestamp > existing.latestEntry) existing.latestEntry = t.timestamp;
      if (t.targetSellPrice && (!existing.highestTarget || t.targetSellPrice > existing.highestTarget)) {
        existing.highestTarget = t.targetSellPrice;
      }
      if (t.stopLossPrice && (!existing.invalidationSl || t.stopLossPrice < existing.invalidationSl)) {
        existing.invalidationSl = t.stopLossPrice;
      }

      map.set(ticker, existing);
    });

    // Compute live values and unrealized PnLs
    const list: AggregatedAsset[] = [];
    let grandTotalHoldingsValue = 0;

    map.forEach((item) => {
      const livePrice = getPrice(item.baseTicker) ?? item.totalCostBasis / (item.totalQuantity || 1);
      const currentValue = item.totalQuantity * livePrice;
      grandTotalHoldingsValue += currentValue;
    });

    map.forEach((item) => {
      const avgEntryPrice = item.totalQuantity > 0 ? item.totalCostBasis / item.totalQuantity : 0;
      const livePrice = getPrice(item.baseTicker) ?? avgEntryPrice;
      const currentValue = item.totalQuantity * livePrice;
      const unrealizedPnlDollar = currentValue - item.totalCostBasis;
      const unrealizedPnlPct = item.totalCostBasis > 0 ? (unrealizedPnlDollar / item.totalCostBasis) * 100 : 0;
      const portfolioWeight = grandTotalHoldingsValue > 0 ? (currentValue / grandTotalHoldingsValue) * 100 : 0;

      list.push({
        symbol: item.symbol,
        baseTicker: item.baseTicker,
        totalQuantity: item.totalQuantity,
        totalCostBasis: item.totalCostBasis,
        avgEntryPrice,
        livePrice,
        currentValue,
        unrealizedPnlDollar,
        unrealizedPnlPct,
        portfolioWeight,
        venues: Array.from(item.venues),
        tranches: item.tranches.sort((a, b) => b.timestamp - a.timestamp),
        firstEntryTimestamp: item.firstEntry,
        latestEntryTimestamp: item.latestEntry,
        highestTarget: item.highestTarget,
        invalidationSl: item.invalidationSl,
      });
    });

    // Sort by largest holding value descending
    return list.sort((a, b) => b.currentValue - a.currentValue);
  }, [openSpotTrades, getPrice]);

  // Overall Portfolio Totals
  const portfolioSummary = useMemo(() => {
    let totalHoldingsMarketValue = 0;
    let totalCostBasis = 0;

    aggregatedAssets.forEach((a) => {
      totalHoldingsMarketValue += a.currentValue;
      totalCostBasis += a.totalCostBasis;
    });

    const totalUnrealizedPnlDollar = totalHoldingsMarketValue - totalCostBasis;
    const totalUnrealizedPnlPct = totalCostBasis > 0 ? (totalUnrealizedPnlDollar / totalCostBasis) * 100 : 0;
    const accountBalance = activeStrategy?.accountBalance || 0;
    const liquidCash = Math.max(0, accountBalance - totalCostBasis);

    return {
      totalHoldingsMarketValue,
      totalCostBasis,
      totalUnrealizedPnlDollar,
      totalUnrealizedPnlPct,
      accountBalance,
      liquidCash,
      assetCount: aggregatedAssets.length,
      totalTranches: openSpotTrades.length,
    };
  }, [aggregatedAssets, activeStrategy, openSpotTrades.length]);

  // Unique venues for filter
  const allVenues = useMemo(() => {
    const s = new Set<string>();
    openSpotTrades.forEach((t) => {
      if (t.venueTag) s.add(t.venueTag);
    });
    return Array.from(s);
  }, [openSpotTrades]);

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    return aggregatedAssets.filter((a) => {
      const matchSearch =
        !searchQuery ||
        a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.baseTicker.toLowerCase().includes(searchQuery.toLowerCase());

      const matchVenue =
        venueFilter === 'all' || a.venues.some((v) => v.toLowerCase() === venueFilter.toLowerCase());

      return matchSearch && matchVenue;
    });
  }, [aggregatedAssets, searchQuery, venueFilter]);

  // Filtered Tranches list (when in tranches view mode)
  const filteredTranches = useMemo(() => {
    return openSpotTrades.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchVenue =
        venueFilter === 'all' || (t.venueTag && t.venueTag.toLowerCase() === venueFilter.toLowerCase());

      return matchSearch && matchVenue;
    });
  }, [openSpotTrades, searchQuery, venueFilter]);

  // Toggle asset accordion expansion
  const toggleExpand = (ticker: string) => {
    playMicroTick();
    setExpandedAssets((prev) => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  // Open Exit Modal
  const handleOpenExitModal = (trade: SpotTradeRecord) => {
    playModalOpen();
    const live = getPrice(trade.symbol) ?? trade.entryPrice;
    setExitPriceInput(String(live));
    setTradeToExit(trade);
  };

  // Execute Spot Exit / Take Profit
  const handleConfirmExit = async () => {
    if (!tradeToExit) return;
    const exitPrice = parseFloat(exitPriceInput);
    if (!exitPrice || exitPrice <= 0 || !isFinite(exitPrice)) {
      toast.error('Invalid Price', 'Please enter a valid exit price above 0.');
      return;
    }

    setIsSubmittingExit(true);
    try {
      const qty = tradeToExit.tokenQuantity || 1;
      const cost = tradeToExit.allocationDollar || qty * tradeToExit.entryPrice;
      const exitValue = qty * exitPrice;
      const pnlDollar = Number((exitValue - cost).toFixed(2));
      const pnlPercentage = cost > 0 ? Number(((pnlDollar / cost) * 100).toFixed(2)) : 0;
      const tradeResult: TradeResult = pnlDollar > 0 ? 'Win' : pnlDollar < 0 ? 'Loss' : 'Breakeven';

      await onUpdateTrade(tradeToExit.id, {
        status: 'Closed',
        exitPrice,
        exitTimestamp: new Date().toISOString(),
        pnlDollar,
        pnlPercentage,
        tradeResult,
      });

      playSuccessChime();
      toast.success(
        `Spot Exit Recorded: ${tradeToExit.symbol}`,
        `Realized PnL: ${pnlDollar >= 0 ? '+' : ''}$${pnlDollar.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage}%)`
      );
      setTradeToExit(null);
    } catch (err: unknown) {
      toast.error('Exit Failed', err instanceof Error ? err.message : 'Unable to record exit.');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  const isNetPositive = portfolioSummary.totalUnrealizedPnlDollar >= 0;

  return (
    <div className="space-y-4">
      {/* ─── SPOT PORTFOLIO SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Holdings Market Value */}
        <div className="card-glass rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Spot Holdings Value</span>
            <Wallet className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-text-primary tracking-tight">
              <CurrencyDisplay
                amount={portfolioSummary.totalHoldingsMarketValue}
                currency={activeStrategy?.baseCurrency}
                size="xl"
              />
            </p>
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-text-muted mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Market Valuation</span>
            </div>
          </div>
        </div>

        {/* 2. Total Cost Basis (Allocated Capital) */}
        <div className="card-glass rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Invested Capital</span>
            <Coins className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-text-primary tracking-tight">
              <CurrencyDisplay
                amount={portfolioSummary.totalCostBasis}
                currency={activeStrategy?.baseCurrency}
                size="xl"
              />
            </p>
            <span className="text-[10.5px] font-mono text-text-muted block mt-1">
              Cost Basis Across {portfolioSummary.assetCount} {portfolioSummary.assetCount === 1 ? 'Coin' : 'Coins'}
            </span>
          </div>
        </div>

        {/* 3. Unrealized Floating PnL */}
        <div className="card-glass rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Unrealized PnL</span>
            {isNetPositive ? (
              <TrendingUp className="w-4 h-4 text-trade-green" />
            ) : (
              <TrendingDown className="w-4 h-4 text-trade-red" />
            )}
          </div>
          <div>
            <p
              className={`text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight flex items-center gap-1 ${isNetPositive ? 'text-trade-green' : 'text-trade-red'
                }`}
            >
              {isNetPositive ? (
                <ArrowUpRight className="w-5 h-5 shrink-0 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-5 h-5 shrink-0 stroke-[2.5]" />
              )}
              <CurrencyDisplay
                amount={portfolioSummary.totalUnrealizedPnlDollar}
                currency={activeStrategy?.baseCurrency}
                showSign={true}
                size="xl"
              />
            </p>
            <span
              className={`text-[10.5px] font-mono font-bold block mt-1 ${isNetPositive ? 'text-trade-green' : 'text-trade-red'
                }`}
            >
              {portfolioSummary.totalUnrealizedPnlPct >= 0 ? '+' : ''}
              {portfolioSummary.totalUnrealizedPnlPct.toFixed(2)}% ROI
            </span>
          </div>
        </div>

        {/* 4. Active Assets & Tranches Count */}
        <div className="card-glass rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Portfolio Breadth</span>
            <Layers className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-text-primary tracking-tight">
              {portfolioSummary.assetCount} <span className="text-xs font-semibold text-text-muted">Assets</span>
            </p>
            <span className="text-[10.5px] font-mono text-text-muted block mt-1">
              {portfolioSummary.totalTranches} Active Accumulation {portfolioSummary.totalTranches === 1 ? 'Tranche' : 'Tranches'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── CONTROLS BAR: SEARCH, VENUE FILTER, VIEW TOGGLE ─── */}
      <div className="card-glass rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coin (BTC, SOL, ETH)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-canvas border border-border text-xs text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Custody Venue Filter */}
          {allVenues.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => { playMicroTick(); setVenueFilter('all'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${venueFilter === 'all'
                  ? 'bg-brand text-black font-bold shadow-xs'
                  : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
                  }`}
              >
                All Venues
              </button>
              {allVenues.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { playMicroTick(); setVenueFilter(v); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 inline-flex items-center gap-1.5 ${venueFilter === v
                    ? 'bg-brand text-black font-bold shadow-xs'
                    : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
                    }`}
                >
                  <VenueIcon venue={v} size="xs" />
                  <span>{v}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Toggle: Grouped by Asset vs All Tranches */}
        <div className="flex items-center gap-2">
          <div className="relative inline-flex p-0.5 rounded-xl bg-canvas border border-border select-none">
            <div
            className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-lg bg-card shadow-xs transition-all duration-200 ease-out pointer-events-none ${viewMode === 'grouped' ? 'left-0.5' : 'left-[calc(50%+1px)]'
                }`}
                />
                <button
                  type="button"
                  onClick={() => { playMicroTick(); setViewMode('grouped'); }}
                  className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'grouped' ? 'text-text-primary font-bold' : 'text-text-muted hover:text-text-primary'
                    }`}
          >
          By Coin ({aggregatedAssets.length})
        </button>
        <button
          type="button"
          onClick={() => { playMicroTick(); setViewMode('tranches'); }}
          className={`relative z-10 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${viewMode === 'tranches' ? 'text-text-primary font-bold' : 'text-text-muted hover:text-text-primary'
            }`}
        >
          All Tranches ({openSpotTrades.length})
        </button>
      </div>

      {/* Refresh live prices button */}
      <button
        type="button"
        onClick={() => { playMicroTick(); refreshNow(); }}
        disabled={isRefreshing}
        title="Refresh continuous live market prices"
        aria-label="Refresh live crypto prices"
        className="p-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-muted hover:text-brand transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand' : ''}`} />
      </button>
    </div>
      </div >

  {/* ─── HOLDINGS CONTENT ─── */ }
{
  openSpotTrades.length === 0 ? (
    /* Empty State */
    <div className="card-glass rounded-2xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center text-brand mx-auto shadow-xs">
        <Coins className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-text-primary text-balance">No Active Spot Holdings</h3>
      <p className="text-xs text-text-muted leading-relaxed text-pretty max-w-sm mx-auto">
        You currently have no open spot accumulation positions in this strategy profile. Execute spot buys through the Pre-Trade Discipline Gate to track live valuations, custody venues, and unrealized returns.
      </p>
      <div className="pt-2">
        {onNavigateToTerminal && (
          <button
            type="button"
            onClick={onNavigateToTerminal}
            className="px-4 py-2 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Accumulate Spot via Discipline Gate
          </button>
        )}
      </div>
    </div>
  ) : filteredAssets.length === 0 && filteredTranches.length === 0 ? (
    /* No Match Search State */
    <div className="card-glass rounded-2xl p-8 text-center max-w-md mx-auto space-y-2.5 shadow-xs">
      <p className="text-xs font-semibold text-text-primary">No Matching Holdings Found</p>
      <p className="text-[11px] text-text-muted">No spot holdings match your search query or venue filter.</p>
      <button
        type="button"
        onClick={() => { setSearchQuery(''); setVenueFilter('all'); }}
        className="px-3 py-1 rounded-xl bg-card border border-border text-xs text-brand font-semibold hover:border-brand/40 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  ) : viewMode === 'grouped' ? (
    /* ─── GROUPED BY COIN VIEW ─── */
    <div className="space-y-3">
      {filteredAssets.map((asset) => {
        const isPos = asset.unrealizedPnlDollar >= 0;
        const isExpanded = !!expandedAssets[asset.baseTicker];

        return (
          <div
            key={asset.baseTicker}
            className="card-glass rounded-2xl overflow-hidden border border-border hover:border-brand/40 transition-all shadow-xs"
          >
            {/* Main Asset Header Row */}
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Coin Icon, Symbol, Venues, Tranche Count */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <CryptoIcon symbol={asset.baseTicker} size="lg" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-mono text-base font-black text-text-primary tracking-tight">
                      {asset.symbol}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 uppercase">
                      SPOT
                    </span>
                    {asset.tranches.length > 1 && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-canvas border border-border text-text-muted">
                        {asset.tranches.length} Tranches
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-muted mt-1 flex-wrap">
                    <span className="font-mono font-bold text-text-secondary">
                      {asset.totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.baseTicker}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {asset.venues.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-canvas border border-border text-text-secondary shadow-2xs"
                        >
                          <VenueIcon venue={v} size="xs" />
                          <span>{v}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle: Financial Metrics (Avg Entry, Live Price, Market Value, Unrealized PnL) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                {/* Avg Entry Price */}
                <div>
                  <span className="text-[10px] font-sans font-medium text-text-muted uppercase tracking-wider block">
                    Avg Entry
                  </span>
                  <span className="font-bold text-text-primary text-xs sm:text-sm tabular-nums block mt-0.5">
                    <CurrencyDisplay amount={asset.avgEntryPrice} currency={activeStrategy?.baseCurrency} />
                  </span>
                </div>

                {/* Live Market Price */}
                <div>
                  <span className="text-[10px] font-sans font-medium text-text-muted uppercase tracking-wider block">
                    Live Price
                  </span>
                  <span className="font-bold text-text-primary text-xs sm:text-sm tabular-nums inline-flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    ${formatLivePrice(asset.baseTicker)}
                  </span>
                </div>

                {/* Position Market Value */}
                <div>
                  <span className="text-[10px] font-sans font-medium text-text-muted uppercase tracking-wider block">
                    Current Value
                  </span>
                  <span className="font-bold text-text-primary text-xs sm:text-sm tabular-nums block mt-0.5">
                    <CurrencyDisplay amount={asset.currentValue} currency={activeStrategy?.baseCurrency} />
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    Cost: <CurrencyDisplay amount={asset.totalCostBasis} currency={activeStrategy?.baseCurrency} size="xs" />
                  </span>
                </div>

                {/* Unrealized PnL ($ & %) */}
                <div>
                  <span className="text-[10px] font-sans font-medium text-text-muted uppercase tracking-wider block">
                    Floating PnL
                  </span>
                  <span
                    className={`font-black text-xs sm:text-sm tabular-nums block mt-0.5 ${isPos ? 'text-trade-green' : 'text-trade-red'
                      }`}
                  >
                    {isPos ? '+' : ''}
                    <CurrencyDisplay
                      amount={asset.unrealizedPnlDollar}
                      currency={activeStrategy?.baseCurrency}
                      showSign={true}
                    />
                  </span>
                  <span
                    className={`text-[10px] font-bold block ${isPos ? 'text-trade-green' : 'text-trade-red'}`}
                  >
                    {isPos ? '+' : ''}{asset.unrealizedPnlPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Right: Actions & Expand Button */}
              <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0">
                {/* Add DCA button */}
                {onNavigateToTerminal && (
                  <button
                    type="button"
                    onClick={onNavigateToTerminal}
                    title={`Accumulate more ${asset.symbol} in Pre-Trade Gate`}
                    className="px-2.5 py-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">DCA Add</span>
                  </button>
                )}

                {/* Exit / Take Profit */}
                <button
                  type="button"
                  onClick={() => handleOpenExitModal(asset.tranches[0])}
                  className="px-3 py-1.5 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Take Profit / Exit</span>
                </button>

                {/* Accordion expand if multiple tranches */}
                {asset.tranches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(asset.baseTicker)}
                    title={isExpanded ? 'Collapse tranches' : 'Expand all purchase tranches'}
                    className="p-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Individual Purchase Tranches (if accordion open) */}
            {isExpanded && asset.tranches.length > 1 && (
              <div className="bg-canvas/60 border-t border-border p-4 space-y-2.5 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                  Individual Purchase Tranches ({asset.tranches.length})
                </span>
                <div className="space-y-2">
                  {asset.tranches.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-brand/15 text-text-primary dark:text-brand font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${getSpotActionStyle(t.spotAction)}`}>
                              {t.spotAction}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getGradeStyle(t.setupGrade).badge}`}>
                              Grade {t.setupGrade}
                            </span>
                            <span className="text-text-muted text-[11px]">
                              {t.timestamp ? new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-text-primary font-bold mt-0.5">
                            {t.tokenQuantity} {asset.baseTicker} @ <CurrencyDisplay amount={t.entryPrice} currency={activeStrategy?.baseCurrency} />
                            <span className="text-text-muted font-normal ml-2">
                              (Cost: <CurrencyDisplay amount={t.allocationDollar} currency={activeStrategy?.baseCurrency} size="xs" />)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(t)}
                          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors"
                          title="Inspect Checklist & Notes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenExitModal(t)}
                          className="px-2.5 py-1 rounded-lg bg-brand/15 border border-brand/40 text-text-primary dark:text-brand hover:bg-brand hover:text-black font-bold text-[11px] transition-all"
                        >
                          Exit Tranche
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    /* ─── ALL TRANCHES DETAILED LIST VIEW ─── */
    <div className="space-y-2.5">
      {filteredTranches.map((t) => {
        const live = getPrice(t.symbol) ?? t.entryPrice;
        const currentVal = (t.tokenQuantity || 0) * live;
        const cost = t.allocationDollar || (t.tokenQuantity || 0) * t.entryPrice;
        const pnl = currentVal - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        const isPos = pnl >= 0;

        return (
          <div
            key={t.id}
            className="card-glass rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:border-brand/40 transition-all shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CryptoIcon symbol={t.symbol} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-extrabold text-text-primary">{t.symbol}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${getSpotActionStyle(t.spotAction)}`}>
                    {t.spotAction}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getGradeStyle(t.setupGrade).badge}`}>
                    Grade {t.setupGrade}
                  </span>
                  {t.venueTag && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-canvas border border-border text-text-secondary shadow-2xs">
                      <VenueIcon venue={t.venueTag} size="xs" />
                      <span>{t.venueTag}</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-text-muted block mt-0.5">
                  {t.timestamp ? new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  {t.timeframe && ` • ${t.timeframe}`}
                  {t.session && ` • ${t.session}`}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
              <div>
                <span className="text-[10px] font-sans text-text-muted uppercase block">Quantity</span>
                <span className="font-bold text-text-primary">
                  {t.tokenQuantity} {normalizeSymbolToTicker(t.symbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-text-muted uppercase block">Entry / Live</span>
                <span className="font-bold text-text-primary">
                  <CurrencyDisplay amount={t.entryPrice} currency={activeStrategy?.baseCurrency} />
                </span>
                <span className="text-[10px] text-text-muted block">
                  Live: ${formatLivePrice(t.symbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-text-muted uppercase block">Value / Cost</span>
                <span className="font-bold text-text-primary">
                  <CurrencyDisplay amount={currentVal} currency={activeStrategy?.baseCurrency} />
                </span>
                <span className="text-[10px] text-text-muted block">
                  Cost: <CurrencyDisplay amount={cost} currency={activeStrategy?.baseCurrency} size="xs" />
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-text-muted uppercase block">Unrealized PnL</span>
                <span className={`font-black ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                  {isPos ? '+' : ''}
                  <CurrencyDisplay amount={pnl} currency={activeStrategy?.baseCurrency} showSign={true} />
                </span>
                <span className={`text-[10px] font-bold block ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                  {isPos ? '+' : ''}{pnlPct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => onOpenDetail(t)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors"
                title="Inspect Trade Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenExitModal(t)}
                className="px-3 py-1.5 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold transition-all shadow-xs"
              >
                Take Profit / Exit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )
}

{/* ─── TAKE PROFIT / EXIT MODAL DIALOG ─── */ }
{
  tradeToExit && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spot-exit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => { playModalClose(); setTradeToExit(null); }}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <CryptoIcon symbol={tradeToExit.symbol} size="md" />
            <div>
              <h3 id="spot-exit-modal-title" className="text-sm font-bold text-text-primary">
                Record Spot Exit / Take Profit
              </h3>
              <p className="text-xs text-text-secondary">{tradeToExit.symbol} Spot Holding</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { playModalClose(); setTradeToExit(null); }}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Holding Overview */}
        <div className="bg-canvas border border-border rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-[10px] font-sans text-text-muted block">Tokens Held</span>
            <span className="font-bold text-text-primary">
              {tradeToExit.tokenQuantity} {normalizeSymbolToTicker(tradeToExit.symbol)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-text-muted block">Entry Price</span>
            <span className="font-bold text-text-primary">
              <CurrencyDisplay amount={tradeToExit.entryPrice} currency={activeStrategy?.baseCurrency} />
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-text-muted block">Allocated Cost</span>
            <span className="font-bold text-text-primary">
              <CurrencyDisplay amount={tradeToExit.allocationDollar} currency={activeStrategy?.baseCurrency} />
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-text-muted block">Target TP</span>
            <span className="font-bold text-brand">
              {tradeToExit.targetSellPrice ? (
                <CurrencyDisplay amount={tradeToExit.targetSellPrice} currency={activeStrategy?.baseCurrency} />
              ) : (
                'Not Set'
              )}
            </span>
          </div>
        </div>

        {/* Exit Price Input */}
        <div className="space-y-1.5">
          <label htmlFor="spot-exit-price" className="block text-xs font-semibold text-text-primary">
            Exit Price ({activeStrategy?.baseCurrency || 'USD'})
          </label>
          <div className="relative">
            <input
              id="spot-exit-price"
              type="number"
              step="any"
              min="0"
              value={exitPriceInput}
              onChange={(e) => setExitPriceInput(e.target.value)}
              placeholder="0.00"
              className="w-full bg-canvas border border-border focus:border-brand rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const live = getPrice(tradeToExit.symbol);
                if (live) setExitPriceInput(String(live));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-brand hover:underline px-1.5 py-0.5 rounded bg-brand/10"
            >
              Use Live Price (${formatLivePrice(tradeToExit.symbol)})
            </button>
          </div>
        </div>

        {/* Live Projected Realized PnL Preview */}
        {(() => {
          const p = parseFloat(exitPriceInput) || 0;
          const cost = tradeToExit.allocationDollar || (tradeToExit.tokenQuantity || 0) * tradeToExit.entryPrice;
          const exitVal = (tradeToExit.tokenQuantity || 0) * p;
          const realized = exitVal - cost;
          const realizedPct = cost > 0 ? (realized / cost) * 100 : 0;
          const isProfit = realized >= 0;

          return (
            <div className="p-3 rounded-xl bg-canvas border border-border flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Realized PnL:</span>
              <div className="text-right">
                <span className={`font-black text-sm block ${isProfit ? 'text-trade-green' : 'text-trade-red'}`}>
                  {isProfit ? '+' : ''}
                  <CurrencyDisplay amount={realized} currency={activeStrategy?.baseCurrency} showSign={true} />
                </span>
                <span className={`text-[10px] font-bold block ${isProfit ? 'text-trade-green' : 'text-trade-red'}`}>
                  {isProfit ? '+' : ''}{realizedPct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => { playModalClose(); setTradeToExit(null); }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmittingExit}
            onClick={handleConfirmExit}
            className="px-4 py-2 rounded-xl bg-brand text-black hover:bg-brand-hover text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Exit &amp; Close Position</span>
          </button>
        </div>
      </div>
    </div>
  )
}
          </div >
          );
});
