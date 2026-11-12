import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StrategyProfile } from '../../types/strategy';
import {
  TradeDirection,
  MarginType,
  SpotAction,
  VenueCustodyTag,
} from '../../types/trade';
import { CryptoIcon } from '../common/CryptoIcon';
import { CurrencyBadge } from '../common/CurrencyDisplay';
import { searchCryptoAssets, CryptoAsset } from '../../data/cryptoAssets';
import { calculateFuturesMetrics, calculateSpotMetrics } from '../../utils/cryptoMath';
import { getCurrencySymbol, isCryptoCurrency } from '../../utils/currency';
import { getFavoriteTickers, toggleFavoriteTicker, isFavoriteTicker } from '../../utils/cryptoFavorites';
import { playMicroTick, playDirectionToggle } from '../../utils/audioTelemetry';
import { useLivePrices } from '../../hooks/useLivePrices';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronDown,
  AlertTriangle,
  Star,
} from 'lucide-react';

export interface TradeEntryFormProps {
  strategy: StrategyProfile;
  activeExecutionType: 'futures' | 'spot';
  setActiveExecutionType: (type: 'futures' | 'spot') => void;
  liveBalance: number;

  // Futures Fields
  futuresSymbol: string;
  setFuturesSymbol: (val: string) => void;
  direction: TradeDirection;
  setDirection: (val: TradeDirection) => void;
  leverage: number;
  setLeverage: (val: number) => void;
  marginType: MarginType;
  setMarginType: (val: MarginType) => void;
  entryPrice: number;
  setEntryPrice: (val: number) => void;
  stopLossPrice: number;
  setStopLossPrice: (val: number) => void;
  takeProfitPrice: number;
  setTakeProfitPrice: (val: number) => void;
  riskPercentage: number;
  setRiskPercentage: (val: number) => void;

  // Spot Fields
  spotSymbol: string;
  setSpotSymbol: (val: string) => void;
  spotAction: SpotAction;
  setSpotAction: (val: SpotAction) => void;
  spotEntryPrice: number;
  setSpotEntryPrice: (val: number) => void;
  spotAllocation: number;
  setSpotAllocation: (val: number) => void;
  spotTargetSellPrice: number;
  setSpotTargetSellPrice: (val: number) => void;
  spotStopLossPrice: number;
  setSpotStopLossPrice: (val: number) => void;
  spotVenue: VenueCustodyTag;
  setSpotVenue: (val: VenueCustodyTag) => void;
}

const LEVERAGE_PRESETS = [1, 3, 5, 10, 20, 50];
const SPOT_ACTIONS: SpotAction[] = ['BUY / ACCUMULATE', 'DCA ADD', 'PARTIAL TP', 'FULL EXIT'];
const SPOT_VENUES: VenueCustodyTag[] = [
  'CEX Spot',
  'Hardware / Cold Wallet',
  'Solana DEX',
  'EVM DEX',
  'Hyperliquid Spot',
];

export const TradeEntryForm: React.FC<TradeEntryFormProps> = ({
  strategy,
  activeExecutionType,
  setActiveExecutionType,
  liveBalance,

  // Futures
  futuresSymbol,
  setFuturesSymbol,
  direction,
  setDirection,
  leverage,
  setLeverage,
  marginType,
  setMarginType,
  entryPrice,
  setEntryPrice,
  stopLossPrice,
  setStopLossPrice,
  takeProfitPrice,
  setTakeProfitPrice,
  riskPercentage,
  setRiskPercentage,

  // Spot
  spotSymbol,
  setSpotSymbol,
  spotAction,
  setSpotAction,
  spotEntryPrice,
  setSpotEntryPrice,
  spotAllocation,
  setSpotAllocation,
  spotTargetSellPrice,
  setSpotTargetSellPrice,
  spotStopLossPrice,
  setSpotStopLossPrice,
  spotVenue,
  setSpotVenue,
}) => {
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live market price feed
  const { getPrice, formatLivePrice } = useLivePrices();

  // Favorites & category filter state
  const [favoriteTickers, setFavoriteTickers] = useState<string[]>(() => getFavoriteTickers());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | 'Favorites'>('All');

  useEffect(() => {
    const handleFavsUpdate = () => {
      setFavoriteTickers(getFavoriteTickers());
    };
    window.addEventListener('tradegate_favorites_updated', handleFavsUpdate);
    return () => window.removeEventListener('tradegate_favorites_updated', handleFavsUpdate);
  }, []);

  const handleToggleFavorite = (ticker: string) => {
    const updated = toggleFavoriteTicker(ticker);
    setFavoriteTickers(updated);
  };

  const currencySymbol = getCurrencySymbol(strategy.baseCurrency);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAssetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filtered autocomplete assets with favorites automatically on top
  const filteredAssets = useMemo(() => {
    let list = searchCryptoAssets(assetSearchQuery, activeExecutionType, favoriteTickers);
    if (activeCategoryFilter === 'Favorites') {
      list = list.filter((a) => isFavoriteTicker(a.baseTicker, favoriteTickers));
    }
    return list;
  }, [assetSearchQuery, activeExecutionType, favoriteTickers, activeCategoryFilter]);

  // Derived metrics calculations
  const futuresMetrics = useMemo(() => {
    return calculateFuturesMetrics({
      accountBalance: liveBalance,
      riskPercentage,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      leverage,
      direction,
      marginType,
    });
  }, [liveBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, leverage, direction, marginType]);

  const isLiquidationBeforeSL = useMemo(() => {
    if (!futuresMetrics.isValid || stopLossPrice <= 0 || futuresMetrics.estLiquidationPrice <= 0) {
      return false;
    }
    if (direction === 'Long') {
      return futuresMetrics.estLiquidationPrice >= stopLossPrice;
    } else {
      return futuresMetrics.estLiquidationPrice <= stopLossPrice;
    }
  }, [futuresMetrics, stopLossPrice, direction]);

  const spotMetrics = useMemo(() => {
    return calculateSpotMetrics({
      accountBalance: liveBalance,
      allocationDollar: spotAllocation,
      entryPrice: spotEntryPrice,
      targetSellPrice: spotTargetSellPrice,
      stopLossPrice: spotStopLossPrice,
      spotAction,
    });
  }, [liveBalance, spotAllocation, spotEntryPrice, spotTargetSellPrice, spotStopLossPrice, spotAction]);

  // Mathematical boundary constraints
  const isSlInverted = useMemo(() => {
    if (entryPrice <= 0 || stopLossPrice <= 0) return false;
    return direction === 'Long' ? stopLossPrice >= entryPrice : stopLossPrice <= entryPrice;
  }, [entryPrice, stopLossPrice, direction]);

  const isTpInverted = useMemo(() => {
    if (entryPrice <= 0 || takeProfitPrice <= 0) return false;
    return direction === 'Long' ? takeProfitPrice <= entryPrice : takeProfitPrice >= entryPrice;
  }, [entryPrice, takeProfitPrice, direction]);

  const isSpotTargetInverted = useMemo(() => {
    if (spotEntryPrice <= 0 || spotTargetSellPrice <= 0) return false;
    return spotTargetSellPrice <= spotEntryPrice;
  }, [spotEntryPrice, spotTargetSellPrice]);

  const isSpotSlInverted = useMemo(() => {
    if (spotEntryPrice <= 0 || spotStopLossPrice <= 0) return false;
    return spotStopLossPrice >= spotEntryPrice;
  }, [spotEntryPrice, spotStopLossPrice]);

  const handleSelectAsset = (asset: CryptoAsset) => {
    playMicroTick();
    if (activeExecutionType === 'futures') {
      setFuturesSymbol(asset.symbol);
      const liveP = getPrice(asset.baseTicker);
      if (liveP && (!entryPrice || entryPrice === 0)) {
        setEntryPrice(liveP);
      }
    } else {
      setSpotSymbol(asset.baseTicker);
      const liveP = getPrice(asset.baseTicker);
      if (liveP && (!spotEntryPrice || spotEntryPrice === 0)) {
        setSpotEntryPrice(liveP);
      }
    }
    setIsAssetDropdownOpen(false);
    setAssetSearchQuery('');
  };

  const isHybrid = strategy.executionMode === 'hybrid';

  return (
    <div className="space-y-4">
      {/* If strategy is Hybrid, show clean segmented control */}
      {isHybrid && (
        <div className="relative grid grid-cols-2 p-1 bg-canvas border border-border rounded-xl select-none">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-200 ease-out shadow-xs pointer-events-none ${activeExecutionType === 'futures'
              ? 'left-1 bg-blue-500/20'
              : 'left-[calc(50%+3px)] bg-emerald-500/20'
              }`}
          />
          <button
            type="button"
            onClick={() => {
              playMicroTick();
              setActiveExecutionType('futures');
            }}
            className={`relative z-10 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 text-center ${activeExecutionType === 'futures'
              ? 'text-blue-700 dark:text-blue-400'
              : 'text-text-muted hover:text-text-primary'
              }`}
          >
            Perpetual Futures (Perps)
          </button>
          <button
            type="button"
            onClick={() => {
              playMicroTick();
              setActiveExecutionType('spot');
            }}
            className={`relative z-10 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 text-center ${activeExecutionType === 'spot'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-text-muted hover:text-text-primary'
              }`}
          >
            Spot Holdings
          </button>
        </div>
      )}

      {/* ─────────────────── A. FUTURES MODE ─────────────────── */}
      {activeExecutionType === 'futures' && (
        <div className="space-y-4">
          {/* Asset Pair Autocomplete & Search */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Trading Pair
            </label>
            <div
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className={`flex items-center justify-between bg-canvas border border-border hover:border-brand/40 rounded-xl px-3 py-2 cursor-pointer transition-all duration-150 ${isAssetDropdownOpen ? 'border-brand shadow-xs' : ''
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CryptoIcon symbol={futuresSymbol || 'BTC'} size="sm" />
                <span className="font-mono font-bold text-xs sm:text-sm text-text-primary">
                  {futuresSymbol || 'Select Crypto Perp Pair'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono">
                  PERP
                </span>
                {getPrice(futuresSymbol) ? (
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 tabular-nums inline-flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ${formatLivePrice(futuresSymbol)}
                  </span>
                ) : null}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isAssetDropdownOpen ? 'rotate-180 text-brand' : ''
                  }`}
              />
            </div>

            {/* Dropdown Menu */}
            {isAssetDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl p-2.5 z-50 animate-dropdown backdrop-blur-md">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    aria-label="Search top 100 crypto perpetual pairs"
                    placeholder="Search top 100 perps (BTC, ETH, SOL, XRP)..."
                    className="w-full bg-canvas border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-hidden focus:outline-none focus:ring-0 focus:border-brand"
                    autoFocus
                  />
                </div>

                {/* Filter Pills (All vs Favorites) */}
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('All')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors ${activeCategoryFilter === 'All'
                      ? 'bg-brand text-black font-bold'
                      : 'bg-canvas text-text-muted hover:text-text-primary'
                      }`}
                  >
                    Top 100 Perps
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('Favorites')}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors ${activeCategoryFilter === 'Favorites'
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-canvas text-text-muted hover:text-amber-400'
                      }`}
                  >
                    <Star className={`w-3 h-3 ${favoriteTickers.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
                    Favorites ({favoriteTickers.length})
                  </button>
                </div>

                {/* Assets List (Favorites automatically at top) */}
                <div className="max-h-60 overflow-y-auto space-y-0.5 scroll-smooth pr-1">
                  {filteredAssets.length === 0 ? (
                    <div className="py-6 text-center text-xs text-text-muted">
                      {activeCategoryFilter === 'Favorites'
                        ? 'No favorites yet! Click the star next to any coin to add it.'
                        : `No perp assets found matching "${assetSearchQuery}"`}
                    </div>
                  ) : (
                    filteredAssets.map((asset) => {
                      const isFav = isFavoriteTicker(asset.baseTicker, favoriteTickers);
                      return (
                        <div
                          key={asset.symbol}
                          onClick={() => handleSelectAsset(asset)}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-card-hover text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(asset.baseTicker);
                              }}
                              title={isFav ? `Remove ${asset.baseTicker} from favorites` : `Star ${asset.baseTicker} as favorite`}
                              aria-label={isFav ? `Remove ${asset.baseTicker} from favorites` : `Star ${asset.baseTicker} as favorite`}
                              className="p-1 rounded-md text-text-muted hover:text-amber-400 transition-colors shrink-0"
                            >
                              <Star
                                className={`w-3.5 h-3.5 transition-colors ${isFav ? 'text-amber-400 fill-amber-400' : 'text-text-muted group-hover:text-amber-300'
                                  }`}
                              />
                            </button>
                            <CryptoIcon symbol={asset.baseTicker} size="sm" />
                            <div className="min-w-0 truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-text-primary">
                                  {asset.symbol}
                                </span>
                              </div>
                              <span className="text-[10px] text-text-muted truncate block">
                                {asset.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            {getPrice(asset.baseTicker) ? (
                              <span className="font-mono font-bold text-xs text-emerald-400 tabular-nums">
                                ${formatLivePrice(asset.baseTicker)}
                              </span>
                            ) : null}
                            <span className="text-[10px] font-mono font-bold text-text-muted">
                              #{asset.rank}
                            </span>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-canvas text-text-secondary font-mono">
                              {asset.category}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Direction & Margin Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direction Selection */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Trade Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playDirectionToggle('Long');
                    setDirection('Long');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${direction === 'Long'
                    ? 'bg-trade-green/15 border-trade-green text-trade-green ring-1 ring-trade-green/30 shadow-xs'
                    : 'bg-canvas border-border text-text-muted hover:border-trade-green/40 hover:text-trade-green'
                    }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playDirectionToggle('Short');
                    setDirection('Short');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${direction === 'Short'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-500 ring-1 ring-rose-500/30 shadow-xs'
                    : 'bg-canvas border-border text-text-muted hover:border-rose-500/40 hover:text-rose-500'
                    }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Short
                </button>
              </div>
            </div>

            {/* Margin Type with Sliding Indicator */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Margin Type</label>
              <div className="relative grid grid-cols-2 p-1 bg-canvas rounded-xl border border-border select-none">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-card border border-border transition-all duration-200 ease-out shadow-xs pointer-events-none ${marginType === 'Isolated'
                    ? 'left-1'
                    : 'left-[calc(50%+3px)]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    playMicroTick();
                    setMarginType('Isolated');
                  }}
                  className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 text-center ${marginType === 'Isolated'
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Isolated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMicroTick();
                    setMarginType('Cross');
                  }}
                  className={`relative z-10 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 text-center ${marginType === 'Cross'
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                    }`}
                >
                  Cross
                </button>
              </div>
            </div>
          </div>

          {/* Leverage Selector Pills */}
          <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label htmlFor="custom-leverage-input" className="text-xs font-medium text-text-secondary">
                    Leverage
                  </label>
                  <span className="font-mono font-bold text-xs text-brand">{leverage}x</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {LEVERAGE_PRESETS.map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => {
                        playMicroTick();
                        setLeverage(lev);
                      }}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${leverage === lev
                        ? 'bg-brand/15 border-brand text-brand ring-1 ring-brand/30 shadow-xs'
                        : 'bg-canvas border-border text-text-muted hover:border-brand/40 hover:text-text-primary'
                        }`}
                    >
                      {lev}x
                    </button>
                  ))}
                  <div className="w-20">
                    <input
                      id="custom-leverage-input"
                      type="number"
                      min="1"
                      max="125"
                      value={leverage}
                      onChange={(e) => setLeverage(Math.min(125, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                      placeholder="Custom"
                      aria-label="Custom leverage multiplier"
                      className="w-full h-[32px] sm:h-[30px] min-h-[30px] bg-canvas border border-border hover:border-border-muted rounded-xl px-2 text-xs font-mono font-bold text-center text-text-primary outline-hidden focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
            </div>

            {/* Execution Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="futures-entry-price" className="text-xs font-medium text-text-secondary flex items-center gap-1.5 whitespace-nowrap">
                    <span>Entry Price</span>
                    <CurrencyBadge currency={strategy.baseCurrency} />
                  </label>
                </div>
                <input
                  id="futures-entry-price"
                  type="number"
                  step="any"
                  min="0"
                  value={entryPrice || ''}
                  onChange={(e) => setEntryPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand"
                />
              </div>

              <div>
                <label htmlFor="futures-stop-loss" className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Stop Loss</span>
                  <CurrencyBadge currency={strategy.baseCurrency} />
                </label>
                <input
                  id="futures-stop-loss"
                  type="number"
                  step="any"
                  min="0"
                  value={stopLossPrice || ''}
                  onChange={(e) => setStopLossPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className={`w-full bg-canvas border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand transition-colors ${isSlInverted ? 'border-rose-500 text-rose-300' : 'border-border'
                    }`}
                />
                {isSlInverted && (
                  <p className="text-[11px] text-rose-400 font-medium mt-1">
                    SL must be {direction === 'Long' ? 'below' : 'above'} Entry
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="futures-take-profit" className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Take Profit</span>
                  <CurrencyBadge currency={strategy.baseCurrency} />
                </label>
                <input
                  id="futures-take-profit"
                  type="number"
                  step="any"
                  min="0"
                  value={takeProfitPrice || ''}
                  onChange={(e) => setTakeProfitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className={`w-full bg-canvas border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand transition-colors ${isTpInverted ? 'border-rose-500 text-rose-300' : 'border-border'
                    }`}
                />
                {isTpInverted && (
                  <p className="text-[11px] text-rose-400 font-medium mt-1">
                    TP must be {direction === 'Long' ? 'above' : 'below'} Entry
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="futures-risk-percentage" className="block text-xs font-medium text-text-secondary mb-1">
                  Risk (% of Balance)
                </label>
                <input
                  id="futures-risk-percentage"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={riskPercentage || ''}
                  onChange={(e) => setRiskPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="1.0"
                  className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand"
                />
              </div>
            </div>

            {/* Derived Live Metrics Bar */}
            <div className="bg-canvas border border-border rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-text-muted uppercase font-bold block">Margin Required</span>
                <span className="font-mono font-bold text-sm text-text-primary tabular-nums inline-flex items-center gap-1">
                  {isCryptoCurrency(strategy.baseCurrency) ? (
                    <>
                      <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                      <span>{futuresMetrics.marginRequiredDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </>
                  ) : (
                    <span>{currencySymbol.trim()}{futuresMetrics.marginRequiredDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-text-muted uppercase font-bold block">Risk Amount</span>
                <span className="font-mono font-bold text-sm text-rose-400 tabular-nums inline-flex items-center gap-1">
                  {isCryptoCurrency(strategy.baseCurrency) ? (
                    <>
                      <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                      <span>{futuresMetrics.riskAmountDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </>
                  ) : (
                    <span>{currencySymbol.trim()}{futuresMetrics.riskAmountDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  )}
                  <span className="text-[11px] text-text-muted">({riskPercentage}%)</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] text-text-muted uppercase font-bold block">Target R:R</span>
                <span className="font-mono font-bold text-sm text-trade-green tabular-nums">
                  {futuresMetrics.targetRiskReward > 0 ? `1 : ${futuresMetrics.targetRiskReward.toFixed(2)}R` : '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-text-muted uppercase font-bold block">Est. Liquidation</span>
                <span
                  className={`font-mono font-bold text-sm tabular-nums inline-flex items-center gap-1 ${isLiquidationBeforeSL ? 'text-rose-500' : 'text-amber-500'
                    }`}
                >
                  {futuresMetrics.estLiquidationPrice > 0 ? (
                    isCryptoCurrency(strategy.baseCurrency) ? (
                      <>
                        <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                        <span>{futuresMetrics.estLiquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    ) : (
                      <span>{currencySymbol.trim()}{futuresMetrics.estLiquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-4 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-text-muted uppercase font-bold">Notional Size</span>
                <div className="font-mono text-xs tabular-nums text-right">
                  <span className="font-bold text-text-primary inline-flex items-center gap-1">
                    {isCryptoCurrency(strategy.baseCurrency) ? (
                      <>
                        <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                        <span>{futuresMetrics.notionalPositionDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    ) : (
                      <span>{currencySymbol.trim()}{futuresMetrics.notionalPositionDollar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  </span>{' '}
                  <span className="text-[10px] text-text-muted">
                    ({futuresMetrics.positionSizeTokens} {futuresSymbol.replace(/USDT.*$/i, '') || 'units'})
                  </span>
                </div>
              </div>
            </div>

            {/* Liquidation Safety Warning */}
            {isLiquidationBeforeSL && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="space-y-0.5">
                  <span className="font-bold uppercase tracking-wider text-[11px] block text-balance">
                    Liquidation Precedes Stop Loss
                  </span>
                  <p className="text-[11px] text-text-secondary leading-relaxed text-pretty">
                    At {leverage}x leverage, estimated liquidation is{' '}
                    <strong className="text-rose-400 font-mono tabular-nums inline-flex items-center gap-0.5">
                      {isCryptoCurrency(strategy.baseCurrency) ? (
                        <>
                          <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                          <span>{futuresMetrics.estLiquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </>
                      ) : (
                        <span>{currencySymbol.trim()}{futuresMetrics.estLiquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </strong>
                    , which triggers before your stop loss at{' '}
                    <strong className="text-text-primary font-mono tabular-nums inline-flex items-center gap-0.5">
                      {isCryptoCurrency(strategy.baseCurrency) ? (
                        <>
                          <CryptoIcon symbol={strategy.baseCurrency} size="xs" />
                          <span>{stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </>
                      ) : (
                        <span>{currencySymbol.trim()}{stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </strong>. Lower
                    your leverage to ensure your stop loss protects your capital first.
                  </p>
                </div>
              </div>
            )}
          </div>
      )}

          {/* ─────────────────── B. SPOT MODE ─────────────────── */}
          {activeExecutionType === 'spot' && (
            <div className="space-y-4">
              {/* Asset Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Spot Crypto Asset
                </label>
                <div
                  onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                  className={`flex items-center justify-between bg-canvas border border-border hover:border-brand/40 rounded-xl px-3 py-2 cursor-pointer transition-all duration-150 ${isAssetDropdownOpen ? 'border-brand shadow-xs' : ''
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CryptoIcon symbol={spotSymbol || 'SOL'} size="sm" />
                    <span className="font-mono font-bold text-xs sm:text-sm text-text-primary">
                      {spotSymbol || 'Select Spot Asset'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
                      SPOT
                    </span>
                    {getPrice(spotSymbol) ? (
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 tabular-nums inline-flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ${formatLivePrice(spotSymbol)}
                      </span>
                    ) : null}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isAssetDropdownOpen ? 'rotate-180 text-brand' : ''
                      }`}
                  />
                </div>

                {/* Dropdown Menu */}
                {isAssetDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl p-2.5 z-50 animate-dropdown backdrop-blur-md">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={assetSearchQuery}
                        onChange={(e) => setAssetSearchQuery(e.target.value)}
                        aria-label="Search top 100 crypto spot assets"
                        placeholder="Search top 100 spot crypto (BTC, ETH, SOL, XRP)..."
                        className="w-full bg-canvas border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-hidden focus:outline-none focus:ring-0 focus:border-brand"
                        autoFocus
                      />
                    </div>

                    {/* Filter Pills (All vs Favorites) */}
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryFilter('All')}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors ${activeCategoryFilter === 'All'
                          ? 'bg-brand text-black font-bold'
                          : 'bg-canvas text-text-muted hover:text-text-primary'
                          }`}
                      >
                        Top 100 Spot
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryFilter('Favorites')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors ${activeCategoryFilter === 'Favorites'
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-canvas text-text-muted hover:text-amber-400'
                          }`}
                      >
                        <Star className={`w-3 h-3 ${favoriteTickers.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
                        Favorites ({favoriteTickers.length})
                      </button>
                    </div>

                    {/* Assets List (Favorites automatically at top) */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 scroll-smooth pr-1">
                      {filteredAssets.length === 0 ? (
                        <div className="py-6 text-center text-xs text-text-muted">
                          {activeCategoryFilter === 'Favorites'
                            ? 'No favorites yet! Click the star next to any coin to add it.'
                            : `No spot assets found matching "${assetSearchQuery}"`}
                        </div>
                      ) : (
                        filteredAssets.map((asset) => {
                          const isFav = isFavoriteTicker(asset.baseTicker, favoriteTickers);
                          return (
                            <div
                              key={asset.baseTicker}
                              onClick={() => handleSelectAsset(asset)}
                              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-card-hover text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(asset.baseTicker);
                                  }}
                                  title={isFav ? `Remove ${asset.baseTicker} from favorites` : `Star ${asset.baseTicker} as favorite`}
                                  aria-label={isFav ? `Remove ${asset.baseTicker} from favorites` : `Star ${asset.baseTicker} as favorite`}
                                  className="p-1 rounded-md text-text-muted hover:text-amber-400 transition-colors shrink-0"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 transition-colors ${isFav ? 'text-amber-400 fill-amber-400' : 'text-text-muted group-hover:text-amber-300'
                                      }`}
                                  />
                                </button>
                                <CryptoIcon symbol={asset.baseTicker} size="sm" />
                                <div className="min-w-0 truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-xs text-text-primary">
                                      {asset.baseTicker}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-text-muted truncate block">
                                    {asset.name}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 pl-2">
                                {getPrice(asset.baseTicker) ? (
                                  <span className="font-mono font-bold text-xs text-emerald-400 tabular-nums">
                                    ${formatLivePrice(asset.baseTicker)}
                                  </span>
                                ) : null}
                                <span className="text-[10px] font-mono font-bold text-text-muted">
                                  #{asset.rank}
                                </span>
                                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-canvas text-text-secondary font-mono">
                                  {asset.category}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Spot Action Selection */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Spot Execution Action</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPOT_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        playMicroTick();
                        setSpotAction(action);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center truncate ${spotAction === action
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/30 shadow-xs'
                        : 'bg-canvas border-border text-text-muted hover:border-emerald-500/40 hover:text-emerald-400'
                        }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custody Venue Tag */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Custody Venue / Network
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPOT_VENUES.map((venue) => (
                    <button
                      key={venue}
                      type="button"
                      onClick={() => {
                        playMicroTick();
                        setSpotVenue(venue);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${spotVenue === venue
                        ? 'bg-card border-brand text-brand font-bold shadow-xs'
                        : 'bg-canvas border-border text-text-muted hover:text-text-primary'
                        }`}
                    >
                      {venue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spot Execution Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="spot-entry-price" className="text-xs font-medium text-text-secondary flex items-center gap-1.5 whitespace-nowrap">
                      <span>Entry Price</span>
                      <CurrencyBadge currency={strategy.baseCurrency} />
                    </label>
                  </div>
                  <input
                    id="spot-entry-price"
                    type="number"
                    step="any"
                    min="0"
                    value={spotEntryPrice || ''}
                    onChange={(e) => setSpotEntryPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand"
                  />
                </div>

                <div>
                  <label htmlFor="spot-capital-allocation" className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5 whitespace-nowrap">
                    <span>Allocation</span>
                    <CurrencyBadge currency={strategy.baseCurrency} />
                  </label>
                  <input
                    id="spot-capital-allocation"
                    type="number"
                    step="any"
                    min="0"
                    value={spotAllocation || ''}
                    onChange={(e) => setSpotAllocation(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand"
                  />
                </div>

                <div>
                  <label htmlFor="spot-target-sell" className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5 whitespace-nowrap">
                    <span>Target Sell Price</span>
                    <CurrencyBadge currency={strategy.baseCurrency} />
                  </label>
                  <input
                    id="spot-target-sell"
                    type="number"
                    step="any"
                    min="0"
                    value={spotTargetSellPrice || ''}
                    onChange={(e) => setSpotTargetSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className={`w-full bg-canvas border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand transition-colors ${isSpotTargetInverted ? 'border-rose-500 text-rose-300' : 'border-border'
                      }`}
                  />
                  {isSpotTargetInverted && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">
                      Target must be above Entry
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="spot-stop-loss" className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5 whitespace-nowrap">
                    <span>Invalidation SL</span>
                    <CurrencyBadge currency={strategy.baseCurrency} />
                    <span className="text-text-muted font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    id="spot-stop-loss"
                    type="number"
                    step="any"
                    min="0"
                    value={spotStopLossPrice || ''}
                    onChange={(e) => setSpotStopLossPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className={`w-full bg-canvas border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary focus:border-brand transition-colors ${isSpotSlInverted ? 'border-rose-500 text-rose-300' : 'border-border'
                      }`}
                  />
                  {isSpotSlInverted && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">
                      Invalidation SL must be below Entry
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Allocation Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-text-muted uppercase font-bold">Quick Size:</span>
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      playMicroTick();
                      setSpotAllocation(Number(((liveBalance * pct) / 100).toFixed(2)));
                    }}
                    className="px-2 py-0.5 rounded-lg border border-border bg-canvas hover:border-brand/40 text-text-muted hover:text-text-primary text-[10px] font-mono font-bold transition-all"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Derived Live Spot Metrics Bar */}
              <div className="bg-canvas border border-border rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Token Quantity</span>
                  <span className="font-mono font-bold text-sm text-text-primary tabular-nums">
                    {spotMetrics.tokenQuantity} {spotSymbol}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Portfolio Weight</span>
                  <span className="font-mono font-bold text-sm text-brand tabular-nums">
                    {spotMetrics.portfolioWeightPct}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Projected ROI</span>
                  <span className="font-mono font-bold text-sm text-trade-green tabular-nums">
                    +{spotMetrics.projectedRoiPct}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Target Multiple</span>
                  <span className="font-mono font-extrabold text-sm text-text-primary tabular-nums">
                    {spotMetrics.targetMultiple}x
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Target R:R</span>
                  <span className="font-mono font-bold text-sm text-trade-green tabular-nums">
                    {spotMetrics.targetRiskReward ? `1 : ${spotMetrics.targetRiskReward}R` : 'Uncapped / Open Target'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
};
