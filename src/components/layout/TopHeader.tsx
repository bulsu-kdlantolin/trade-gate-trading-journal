import React, { useState, useEffect, useRef } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { getCurrentActiveSession, formatDeviceClock } from '../../utils/sessionClock';
import { SessionStatus } from '../../types/session';
import { getCurrencySymbol, isCryptoCurrency, formatCurrencyAmount } from '../../utils/currency';
import { CryptoIcon } from '../common/CryptoIcon';
import { ThemeToggleButton } from './ThemeToggleButton';
import {
  ChevronDown,
  Wallet,
  Plus,
  Clock,
  Check,
} from 'lucide-react';
import { TradeGateLogo } from '../common/TradeGateLogo';

interface TopHeaderProps {
  strategies: StrategyProfile[];
  activeStrategy: StrategyProfile | null;
  onSelectStrategy: (id: string) => void;
  onOpenDepositModal: () => void;
  liveBalance: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  strategies,
  activeStrategy,
  onSelectStrategy,
  onOpenDepositModal,
  liveBalance,
}) => {
  const [isStratOpen, setIsStratOpen] = useState(false);
  const stratRef = useRef<HTMLDivElement>(null);

  // Live real-time clock and active session
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeSession, setActiveSession] = useState<SessionStatus | null>(() => getCurrentActiveSession());

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now);
      setActiveSession(getCurrentActiveSession());
    };
    const timer = setInterval(update, 1000);
    window.addEventListener('tradegate_sessions_updated', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('tradegate_sessions_updated', update);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (stratRef.current && !stratRef.current.contains(e.target as Node)) {
        setIsStratOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currencySymbol = getCurrencySymbol(activeStrategy?.baseCurrency);

  const getModeBadge = (mode?: string) => {
    if (mode === 'futures') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase bg-blue-500/15 text-blue-400">
          PERPS
        </span>
      );
    }
    if (mode === 'spot') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase bg-emerald-500/15 text-emerald-400">
          SPOT
        </span>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md px-3 sm:px-4 lg:px-6 h-16 flex items-center transition-colors">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Brand Mark (mobile) + Strategy Selector & Balance */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="md:hidden shrink-0" title="TradeGate Crypto">
            <TradeGateLogo size="sm" variant="mark-only" />
          </div>

          {/* Strategy Profile Selector */}
          <div className="relative" ref={stratRef}>
            <button
              onClick={() => setIsStratOpen(!isStratOpen)}
              aria-haspopup="listbox"
              aria-expanded={isStratOpen}
              aria-label={`Active strategy: ${activeStrategy?.name || 'Select Strategy'}`}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-canvas border border-border hover:border-brand/40 text-left transition-all duration-150 ${isStratOpen ? 'border-brand/60 ring-2 ring-brand/15' : ''
                }`}
            >
              <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
              <span className="text-xs font-bold text-text-primary max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] truncate">
                {activeStrategy?.name || 'Select Strategy'}
              </span>
              {getModeBadge(activeStrategy?.executionMode)}
              <ChevronDown
                className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200 ${isStratOpen ? 'rotate-180 text-brand' : ''
                  }`}
              />
            </button>

            {/* Strategy Popover Menu */}
            {isStratOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-card border border-border rounded-2xl shadow-2xl p-1.5 z-50 animate-dropdown backdrop-blur-md">
                <div className="px-3 py-1.5 border-b border-border mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Isolated Strategies
                  </span>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {strategies.map((strat) => {
                    const isSelected = strat.id === activeStrategy?.id;
                    return (
                      <button
                        key={strat.id}
                        onClick={() => {
                          onSelectStrategy(strat.id);
                          setIsStratOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${isSelected
                          ? 'bg-brand/10 border border-brand/30 text-brand font-semibold'
                          : 'hover:bg-card-hover text-text-secondary hover:text-text-primary'
                          }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">{strat.name}</span>
                            {getModeBadge(strat.executionMode)}
                          </div>
                          <span className="text-[10px] text-text-muted font-mono block mt-0.5">
                            {formatCurrencyAmount(strat.accountBalance, strat.baseCurrency)} • {strat.defaultRiskValue}% Risk
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Capital Balance & Add Funds (Containerless) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <Wallet className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="text-[11px] text-text-muted font-sans hidden sm:inline">Balance:</span>
              <span className="font-bold tabular-nums text-text-primary inline-flex items-center gap-1">
                {isCryptoCurrency(activeStrategy?.baseCurrency) && (
                  <CryptoIcon symbol={activeStrategy!.baseCurrency} size="xs" />
                )}
                {formatCurrencyAmount(liveBalance, activeStrategy?.baseCurrency || 'USD')}
              </span>
              <span className="text-[10px] font-bold text-text-muted px-1.5 py-0.5 rounded bg-canvas border border-border hidden md:inline-flex items-center gap-1">
                {isCryptoCurrency(activeStrategy?.baseCurrency) && (
                  <CryptoIcon symbol={activeStrategy!.baseCurrency} size="xs" />
                )}
                {activeStrategy?.baseCurrency || 'USD'}
              </span>
            </div>
            <button
              onClick={onOpenDepositModal}
              title="Deposit or adjust capital"
              aria-label="Deposit or adjust capital"
              className="relative after:absolute after:-inset-2 p-1 rounded-lg text-brand hover:text-brand-hover hover:bg-card-hover transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Trading Session, Market Clock, Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto">
          {/* Trading Session (Beside time) */}
          <div
            title={activeSession ? `Active Trading Session: ${activeSession.name} (${activeSession.localRangeStr})` : 'All trading sessions are currently closed'}
            className="flex items-center gap-1.5 font-mono text-xs select-none"
          >
            <span className="text-[11px] text-text-muted font-sans hidden sm:inline">
              Trading Session:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: activeSession?.color || '#3B82F6' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2 border border-slate-400/50"
                  style={{ backgroundColor: activeSession?.color || '#3B82F6' }}
                />
              </span>
              <span className="font-bold text-text-primary text-[11px]">
                {activeSession ? activeSession.name : 'Closed'}
              </span>
            </div>
          </div>

          {/* Device Local Time (Containerless) */}
          <div
            title="Auto-detected device local time"
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono tabular-nums text-text-secondary select-none px-1"
          >
            <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-semibold text-text-primary text-[11px]">{formatDeviceClock(currentTime)}</span>
          </div>

          {/* Theme Toggle Button with Scattering & Spread Effect */}
          <ThemeToggleButton />
        </div>
      </div>
    </header >
  );
};

