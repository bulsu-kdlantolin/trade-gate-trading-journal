import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useStrategies } from './hooks/useStrategies';
import { useTradeJournal } from './hooks/useTradeJournal';
import { useBalanceAdjustments } from './hooks/useBalanceAdjustments';
import { Sidebar, TabKey } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { PreTradeGate } from './components/terminal/PreTradeGate';
import { StrategyProfile, BaseCurrency, BalanceAdjustment } from './types/strategy';
import { TradeRecord, isFuturesTrade } from './types/trade';
import { convertCurrency } from './utils/currency';
import { initLivePriceService } from './services/livePriceService';
import { storage } from './utils/storage';
import { playTabSwitch, playCommandPaletteOpen } from './utils/audioTelemetry';
import { LoadingScreen } from './components/common/LoadingScreen';
import {
  ShieldAlert,
  BookOpen,
  BarChart3,
  Sliders,
  Settings,
} from 'lucide-react';

// Code-split heavy secondary views so initial landing bundle stays lightweight (<50kB)
const TradeTable = lazy(() =>
  import('./components/history/TradeTable').then((m) => ({ default: m.TradeTable }))
);
const AnalyticsDashboard = lazy(() =>
  import('./components/dashboard/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))
);
const StrategiesHub = lazy(() =>
  import('./components/setup/StrategiesHub').then((m) => ({ default: m.StrategiesHub }))
);
const SettingsHub = lazy(() =>
  import('./components/setup/SettingsHub').then((m) => ({ default: m.SettingsHub }))
);
const DepositWithdrawModal = lazy(() =>
  import('./components/common/DepositWithdrawModal').then((m) => ({ default: m.DepositWithdrawModal }))
);
const TerminalCommandPalette = lazy(() =>
  import('./components/common/TerminalCommandPalette').then((m) => ({ default: m.TerminalCommandPalette }))
);

const ViewSkeleton = () => (
  <div className="card-glass rounded-2xl p-6 sm:p-8 space-y-4 animate-pulse">
    <div className="h-6 w-48 bg-card-hover rounded-xl" />
    <div className="h-4 w-72 bg-card-hover/60 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
      <div className="h-28 bg-card-hover/40 rounded-xl" />
      <div className="h-28 bg-card-hover/40 rounded-xl" />
      <div className="h-28 bg-card-hover/40 rounded-xl" />
    </div>
  </div>
);

const MOBILE_NAV_ITEMS: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'terminal', label: 'Gate', icon: ShieldAlert },
  { key: 'history', label: 'Ledger', icon: BookOpen },
  { key: 'dashboard', label: 'Metrics', icon: BarChart3 },
  { key: 'strategies', label: 'Playbooks', icon: Sliders },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function App() {
  const {
    strategies,
    activeStrategy,
    activeStrategyId,
    setActiveStrategyId,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    resetToDefaultStrategies,
    importBackupStrategies,
    isLoading: isStrategiesLoading,
  } = useStrategies();

  const {
    trades,
    allTrades,
    metrics,
    logTrade,
    updateTrade,
    deleteTrade,
    clearAllTrades,
    resetToDefaultTrades,
    importTrades,
    isLoading: isTradesLoading,
  } = useTradeJournal(activeStrategyId);

  const { netAdjustments, addAdjustment, reloadAdjustments } = useBalanceAdjustments(activeStrategy?.id);

  // App initialization boot screen state
  const [isInitialBoot, setIsInitialBoot] = useState(true);

  // Continuous background synchronization of live market exchange rates and crypto prices
  useEffect(() => {
    initLivePriceService(30000);
  }, []);

  // App Layout States
  const [activeTab, setActiveTab] = useState<TabKey>('terminal');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Tactical Keyboard Shortcuts (Cockpit Ergonomics)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Cockpit Command Palette Hotkey: Cmd+K / Ctrl+K or "?" (when not in input)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playCommandPaletteOpen();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (!isInput && e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        playCommandPaletteOpen();
        setIsCommandPaletteOpen(true);
        return;
      }

      // If Command Palette or other modal is open, defer to modal handlers
      if (isCommandPaletteOpen || isDepositModalOpen) return;

      // 2. Direct Tab Switching via number keys [1] - [5] (when not in input)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tabMap: Record<string, TabKey> = {
          '1': 'terminal',
          '2': 'history',
          '3': 'dashboard',
          '4': 'strategies',
          '5': 'settings',
        };
        if (tabMap[e.key]) {
          e.preventDefault();
          playTabSwitch();
          setActiveTab(tabMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCommandPaletteOpen, isDepositModalOpen]);

  // Keep visited tabs mounted so form state, filters, scroll positions, and selected items
  // are never lost when navigating between views (only resetting upon full site reload)
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(() => new Set<TabKey>(['terminal']));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Real-time live adjusted strategy capital: Initial Balance + Realized P&L + Net Adjustments
  const liveBalance = (activeStrategy?.accountBalance || 0) + (metrics.netPnlDollar || 0) + netAdjustments;

  // Full backup restore handler
  const handleImportBackup = async (data: { strategies: StrategyProfile[]; trades: TradeRecord[] }) => {
    if (data.strategies.length > 0) {
      await importBackupStrategies(data.strategies);
    }
    if (data.trades.length > 0) {
      await importTrades(data.trades);
    }
  };

  // Reset all to starter profiles
  const handleResetAllData = async () => {
    await resetToDefaultStrategies();
    await resetToDefaultTrades();
  };

  // Update strategy currency preference and auto-convert account balances & trade metrics
  const handleUpdateStrategyCurrency = async (newCurrency: BaseCurrency, applyToAll: boolean = true) => {
    localStorage.setItem('tradegate_preferred_currency', newCurrency);

    const targetStrategies = applyToAll ? strategies : (activeStrategy ? [activeStrategy] : []);
    const updatedTradesList = [...allTrades];
    let anyTradesChanged = false;

    for (const strat of targetStrategies) {
      const oldCurrency = (strat.baseCurrency || 'USD') as BaseCurrency;
      if (oldCurrency !== newCurrency) {
        // 1. Auto-convert starting account balance
        const convertedBalance = convertCurrency(strat.accountBalance, oldCurrency, newCurrency);

        // 2. Auto-convert fixed dollar risk if applicable
        const convertedRiskValue = strat.riskModel === 'FixedDollar'
          ? convertCurrency(strat.defaultRiskValue, oldCurrency, newCurrency)
          : strat.defaultRiskValue;

        await updateStrategy(strat.id, {
          baseCurrency: newCurrency,
          accountBalance: convertedBalance,
          defaultRiskValue: convertedRiskValue,
        });

        // 4. Auto-convert all trades belonging to this strategy
        for (let i = 0; i < updatedTradesList.length; i++) {
          const t = updatedTradesList[i];
          if (t.strategyId === strat.id) {
            anyTradesChanged = true;
            const updatedTrade = { ...t };
            if (updatedTrade.accountBalance) {
              updatedTrade.accountBalance = convertCurrency(updatedTrade.accountBalance, oldCurrency, newCurrency);
            }
            if (updatedTrade.pnlDollar !== undefined) {
              updatedTrade.pnlDollar = convertCurrency(updatedTrade.pnlDollar, oldCurrency, newCurrency);
            }
            if (isFuturesTrade(updatedTrade)) {
              if (updatedTrade.riskAmountDollar !== undefined) {
                updatedTrade.riskAmountDollar = convertCurrency(updatedTrade.riskAmountDollar, oldCurrency, newCurrency);
              }
            } else {
              if (updatedTrade.allocationDollar !== undefined) {
                updatedTrade.allocationDollar = convertCurrency(updatedTrade.allocationDollar, oldCurrency, newCurrency);
              }
            }
            updatedTradesList[i] = updatedTrade;
          }
        }
      }
    }

    if (anyTradesChanged) {
      await importTrades(updatedTradesList);
    }

    // Auto-convert stored balance adjustments (deposits/withdrawals)
    try {
      const storedAdjustments = (await storage.get<BalanceAdjustment[]>('tradegate_crypto_balance_adjustments')) || [];
      if (storedAdjustments.length > 0) {
        let adjustmentsChanged = false;
        const converted = storedAdjustments.map((adj) => {
          if (applyToAll || (activeStrategy && adj.strategyId === activeStrategy.id)) {
            const parentStrat = strategies.find((s) => s.id === adj.strategyId);
            const oldCurr = (parentStrat?.baseCurrency || 'USD') as BaseCurrency;
            if (oldCurr !== newCurrency) {
              adjustmentsChanged = true;
              return {
                ...adj,
                amount: convertCurrency(adj.amount, oldCurr, newCurrency),
              };
            }
          }
          return adj;
        });
        if (adjustmentsChanged) {
          await storage.set('tradegate_crypto_balance_adjustments', converted);
          await reloadAdjustments();
        }
      }
    } catch { }
  };

  const handleNavigateToStrategies = () => {
    setActiveTab('strategies');
    window.dispatchEvent(new CustomEvent('tradegate_open_create_strategy'));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-primary">
      {/* Keyboard-accessible Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-brand focus:text-black focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand"
      >
        Skip to main content
      </a>

      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Status Header */}
        <TopHeader
          strategies={strategies}
          activeStrategy={activeStrategy}
          onSelectStrategy={setActiveStrategyId}
          onOpenDepositModal={() => setIsDepositModalOpen(true)}
          onNavigateToStrategies={handleNavigateToStrategies}
          liveBalance={liveBalance}
        />

        {/* Main Workspace Container */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 focus:outline-none"
        >
          <div className="max-w-[1600px] mx-auto">
            {visitedTabs.has('terminal') && (
              <div className={activeTab === 'terminal' ? 'block animate-view-fade' : 'hidden'}>
                <PreTradeGate
                  strategy={activeStrategy}
                  liveBalance={liveBalance}
                  onTradeLogged={logTrade}
                  onNavigateToProfiles={handleNavigateToStrategies}
                  isActive={activeTab === 'terminal'}
                />
              </div>
            )}

            {visitedTabs.has('history') && (
              <div className={activeTab === 'history' ? 'block animate-view-fade' : 'hidden'}>
                <Suspense fallback={<ViewSkeleton />}>
                  <TradeTable
                    trades={trades}
                    activeStrategy={activeStrategy}
                    onDeleteTrade={deleteTrade}
                    onUpdateTrade={updateTrade}
                    onNavigateToTerminal={() => setActiveTab('terminal')}
                  />
                </Suspense>
              </div>
            )}

            {visitedTabs.has('dashboard') && (
              <div className={activeTab === 'dashboard' ? 'block animate-view-fade' : 'hidden'}>
                <Suspense fallback={<ViewSkeleton />}>
                  <AnalyticsDashboard
                    trades={trades}
                    activeStrategy={activeStrategy}
                    onNavigateToTerminal={() => setActiveTab('terminal')}
                  />
                </Suspense>
              </div>
            )}

            {visitedTabs.has('strategies') && (
              <div className={activeTab === 'strategies' ? 'block animate-view-fade' : 'hidden'}>
                <Suspense fallback={<ViewSkeleton />}>
                  <StrategiesHub
                    strategies={strategies}
                    activeStrategy={activeStrategy}
                    onSelectStrategy={setActiveStrategyId}
                    onSaveStrategy={async (data) => {
                      if ('id' in data && data.id) {
                        await updateStrategy(data.id, data);
                      } else {
                        await addStrategy(data as Omit<StrategyProfile, 'id' | 'createdAt' | 'updatedAt'>);
                      }
                    }}
                    onDeleteStrategy={deleteStrategy}
                    onResetDefaultStrategies={resetToDefaultStrategies}
                  />
                </Suspense>
              </div>
            )}

            {visitedTabs.has('settings') && (
              <div className={activeTab === 'settings' ? 'block animate-view-fade' : 'hidden'}>
                <Suspense fallback={<ViewSkeleton />}>
                  <SettingsHub
                    strategies={strategies}
                    allTrades={allTrades}
                    activeStrategy={activeStrategy}
                    onImportBackup={handleImportBackup}
                    onResetAllData={handleResetAllData}
                    onClearAllTrades={clearAllTrades}
                    onUpdateStrategyCurrency={handleUpdateStrategyCurrency}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Accessible on Mobile < md) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 md:hidden px-1 safe-area-pb"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                playTabSwitch();
                setActiveTab(item.key);
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-h-[44px] transition-colors relative ${isActive
                ? 'text-[#946C00] dark:text-brand font-bold'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-brand mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Capital Adjustment Modal (+ Funds) */}
      {isDepositModalOpen && (
        <Suspense fallback={null}>
          <DepositWithdrawModal
            isOpen={isDepositModalOpen}
            onClose={() => setIsDepositModalOpen(false)}
            strategy={activeStrategy}
            currentBalance={liveBalance}
            onAddAdjustment={addAdjustment}
            onResetBalance={async (newBalance) => {
              if (activeStrategy) {
                await updateStrategy(activeStrategy.id, { accountBalance: newBalance });
              }
            }}
          />
        </Suspense>
      )}

      {/* Cockpit Command Palette HUD (⌘K or ?) */}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <TerminalCommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            strategies={strategies}
            activeStrategy={activeStrategy}
            onSelectStrategy={setActiveStrategyId}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
          />
        </Suspense>
      )}

      {/* Institutional Boot Loading Screen */}
      {isInitialBoot && (
        <LoadingScreen
          isReady={!isStrategiesLoading && !isTradesLoading}
          onFinished={() => setIsInitialBoot(false)}
        />
      )}
    </div>
  );
}
export default App;
