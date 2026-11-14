import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ShieldAlert,
  BookOpen,
  BarChart3,
  Sliders,
  Settings,
  Plus,
  Wallet,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ChevronRight,
  Check,
  Command,
  X,
  ArrowRight,
} from 'lucide-react';
import { TabKey } from '../layout/Sidebar';
import { StrategyProfile } from '../../types/strategy';
import { StrategyLogo } from './StrategyLogo';
import { formatCurrencyAmount } from '../../utils/currency';
import {
  playMicroTick,
  playSuccessChime,
  playModalClose,
  isAudioEnabled,
  toggleAudioEnabled,
} from '../../utils/audioTelemetry';
import { useTheme } from '../../context/ThemeContext';
import { useModalA11y } from '../../hooks/useModalA11y';

interface TerminalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  strategies: StrategyProfile[];
  activeStrategy: StrategyProfile | null;
  onSelectStrategy: (id: string) => void;
  onOpenDepositModal: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Playbooks';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon?: React.FC<{ className?: string }>;
  customIcon?: React.ReactNode;
  action: () => void;
  badge?: string;
  isActive?: boolean;
}

export const TerminalCommandPalette: React.FC<TerminalCommandPaletteProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  strategies,
  activeStrategy,
  onSelectStrategy,
  onOpenDepositModal,
}) => {
  const modalRef = useModalA11y(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const [audioActive, setAudioActive] = useState<boolean>(() => isAudioEnabled());

  useEffect(() => {
    const handleAudioChange = () => {
      setAudioActive(isAudioEnabled());
    };
    window.addEventListener('tradegate_audio_changed', handleAudioChange);
    return () => {
      window.removeEventListener('tradegate_audio_changed', handleAudioChange);
    };
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const items: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [
      // Navigation
      {
        id: 'nav-terminal',
        category: 'Navigation',
        title: 'Pre-Trade Discipline Gate & Journal',
        subtitle: 'Enforce mandatory checklist rules and execute orders',
        shortcut: '1',
        icon: ShieldAlert,
        isActive: activeTab === 'terminal',
        action: () => {
          onSelectTab('terminal');
          onClose();
        },
      },
      {
        id: 'nav-history',
        category: 'Navigation',
        title: 'Entries & Ledger History',
        subtitle: 'Review historical trades, calendar, and execution audit cards',
        shortcut: '2',
        icon: BookOpen,
        isActive: activeTab === 'history',
        action: () => {
          onSelectTab('history');
          onClose();
        },
      },
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Performance & Risk Metrics',
        subtitle: 'Win rate, profit factor, equity curve, and session analysis',
        shortcut: '3',
        icon: BarChart3,
        isActive: activeTab === 'dashboard',
        action: () => {
          onSelectTab('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-strategies',
        category: 'Navigation',
        title: 'Strategy Playbooks & Confluence Hub',
        subtitle: 'Configure rules, weights, and conviction tiers',
        shortcut: '4',
        icon: Sliders,
        isActive: activeTab === 'strategies',
        action: () => {
          onSelectTab('strategies');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        category: 'Navigation',
        title: 'System Settings & Data Management',
        subtitle: 'Backups, data resets, base currency, and storage',
        shortcut: '5',
        icon: Settings,
        isActive: activeTab === 'settings',
        action: () => {
          onSelectTab('settings');
          onClose();
        },
      },

      // Quick Actions
      {
        id: 'act-new-trade',
        category: 'Actions',
        title: 'Log New Trade in Pre-Trade Gate',
        subtitle: 'Jump straight to execution gate to verify rules',
        shortcut: 'N',
        icon: Plus,
        action: () => {
          onSelectTab('terminal');
          onClose();
        },
      },
      {
        id: 'act-deposit',
        category: 'Actions',
        title: 'Adjust Capital / Deposit / Withdraw',
        subtitle: 'Record balance adjustments and capital injections',
        shortcut: 'B',
        icon: Wallet,
        action: () => {
          onClose();
          onOpenDepositModal();
        },
      },
      {
        id: 'act-audio',
        category: 'Actions',
        title: audioActive ? 'Mute Audio Telemetry' : 'Enable Audio Telemetry',
        subtitle: 'Toggle tactile Web Audio synthesizer clicks and gate chords',
        shortcut: 'M',
        icon: audioActive ? Volume2 : VolumeX,
        badge: audioActive ? 'ON' : 'MUTED',
        action: () => {
          const next = toggleAudioEnabled();
          setAudioActive(next);
        },
      },
      {
        id: 'act-theme',
        category: 'Actions',
        title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: 'Toggle visual appearance with instant contrast parity',
        shortcut: 'D',
        icon: isDark ? Sun : Moon,
        badge: isDark ? 'DARK' : 'LIGHT',
        action: () => {
          toggleTheme();
        },
      },

      // Strategies
      ...strategies.map((strat) => ({
        id: `strat-${strat.id}`,
        category: 'Playbooks' as const,
        title: strat.name,
        subtitle: `${formatCurrencyAmount(strat.accountBalance, strat.baseCurrency)} • ${strat.defaultRiskValue}% Risk • ${strat.rules.length} Rules`,
        icon: ArrowRight,
        customIcon: <StrategyLogo strategy={strat} size="sm" />,
        badge: strat.executionMode.toUpperCase(),
        isActive: activeStrategy?.id === strat.id,
        action: () => {
          onSelectStrategy(strat.id);
          playSuccessChime();
          onClose();
        },
      })),
    ];

    return list;
  }, [
    activeTab,
    strategies,
    activeStrategy,
    audioActive,
    isDark,
    onSelectTab,
    onClose,
    onOpenDepositModal,
    onSelectStrategy,
    toggleTheme,
  ]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
        (item.shortcut && item.shortcut.toLowerCase() === lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [items, query]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems, selectedIndex]);

  // Ensure highlighted element is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard traversal inside the open modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      playMicroTick();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      playMicroTick();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, filteredItems.length)) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        playMicroTick();
        current.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      playModalClose();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Terminal Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playModalClose();
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-canvas/40">
          <Command className="w-4 h-4 text-brand shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, playbook, or shortcut... (Esc to exit)"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            aria-label="Search terminal commands"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            aria-activedescendant={filteredItems[selectedIndex] ? `palette-item-${filteredItems[selectedIndex].id}` : undefined}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-text-muted hover:text-text-primary rounded-md"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-canvas border border-border text-[10px] font-mono text-text-muted">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          aria-label="Commands"
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-6 h-6 text-text-muted mx-auto opacity-50" />
              <p className="text-xs font-semibold text-text-secondary">No terminal actions found</p>
              <p className="text-[11px] text-text-muted">Try searching for &quot;Gate&quot;, &quot;Ledger&quot;, or &quot;Perps&quot;</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  id={`palette-item-${item.id}`}
                  data-index={idx}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    playMicroTick();
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${isSelected
                    ? 'bg-brand/12 text-text-primary shadow-xs ring-1 ring-brand/30'
                    : 'hover:bg-card-hover text-text-secondary hover:text-text-primary'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.customIcon ? (
                      <div className="shrink-0">{item.customIcon}</div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected
                          ? 'bg-brand text-black font-bold'
                          : 'bg-canvas border border-border text-text-muted'
                          }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-text-primary dark:text-brand font-bold' : ''}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-canvas border border-border text-text-muted uppercase">
                            {item.badge}
                          </span>
                        )}
                        {item.isActive && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded-md bg-canvas border border-border text-[10px] font-mono text-text-muted font-bold min-w-[20px] text-center">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-brand shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Tactical Cockpit Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-canvas/40 flex items-center justify-between text-[11px] font-mono text-text-muted select-none">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-bold text-text-secondary">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-bold text-text-secondary">↵</kbd> select
            </span>
            <span className="hidden sm:inline">
              <kbd className="font-bold text-text-secondary">1-5</kbd> tabs
            </span>
            <span className="hidden sm:inline">
              <kbd className="font-bold text-text-secondary">M</kbd> mute
            </span>
          </div>
          <span className="text-[10px] text-text-muted">SOVEREIGN EXECUTION HUD</span>
        </div>
      </div>
    </div>
  );
};