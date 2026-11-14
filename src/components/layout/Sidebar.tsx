import React from 'react';
import {
  ShieldAlert,
  BookOpen,
  BarChart3,
  Sliders,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TradeGateLogo } from '../common/TradeGateLogo';
import { playTabSwitch, playMicroTick } from '../../utils/audioTelemetry';

export type TabKey = 'terminal' | 'history' | 'dashboard' | 'strategies' | 'settings';

interface SidebarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
}) => {
  const navItems = [
    {
      key: 'terminal' as TabKey,
      label: 'Journal & Gate',
      icon: ShieldAlert,
    },
    {
      key: 'history' as TabKey,
      label: 'Entries & Ledger',
      icon: BookOpen,
    },
    {
      key: 'dashboard' as TabKey,
      label: 'Performance',
      icon: BarChart3,
    },
    {
      key: 'strategies' as TabKey,
      label: 'Strategy Profiles',
      icon: Sliders,
    },
    {
      key: 'settings' as TabKey,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`relative z-30 hidden md:flex flex-col bg-card border-r border-border transition-all duration-200 ease-in-out shrink-0 select-none ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* Brand Header: Generous padding when expanded, perfectly centered when collapsed */}
      <div className={`pt-6 pb-4 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        {!isCollapsed ? (
          <TradeGateLogo size="md" variant="full" badgeText="CRYPTO" />
        ) : (
          <div className="flex items-center justify-center" title="TradeGate Crypto">
            <TradeGateLogo size="md" variant="mark-only" />
          </div>
        )}
      </div>

      {/* Navigation Links: Positioned lower down with comfortable breathing room */}
      <nav className="flex-1 pt-2 pb-4 px-3.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                playTabSwitch();
                setActiveTab(item.key);
              }}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${isActive
                  ? 'bg-brand/15 text-text-primary dark:text-brand font-bold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card-hover'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${isActive ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'
                  }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Minimal Collapse Trigger (Containerless) */}
      <div className="p-2">
        <button
          onClick={() => {
            playMicroTick();
            setIsCollapsed(!isCollapsed);
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors ${isCollapsed ? 'justify-center' : 'justify-between px-2.5'
            }`}
        >
          {!isCollapsed && <span className="text-[11px] font-medium">Collapse</span>}
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
});
