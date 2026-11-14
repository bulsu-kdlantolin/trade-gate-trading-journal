import React, { useState, useEffect } from 'react';
import { CryptoIcon } from './CryptoIcon';
import {
  Zap,
  Crosshair,
  Flame,
  Shield,
  Rocket,
  BarChart2,
  Cpu,
  Gem,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { CryptoExecutionMode } from '../../types/strategy';

export interface StrategyLogoPreset {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
}

export const STRATEGY_PRESET_BADGES: StrategyLogoPreset[] = [
  {
    id: 'preset:lightning',
    label: 'Lightning',
    description: 'ICT / Killzone / Scalping',
    icon: Zap,
    bgClass: 'bg-amber-500/15 border-amber-500/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'preset:target',
    label: 'Target',
    description: 'Orderflow / Precision / Snipers',
    icon: Crosshair,
    bgClass: 'bg-cyan-500/15 border-cyan-500/30',
    textClass: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'preset:flame',
    label: 'Flame',
    description: 'Breakouts / Momentum / Hot Coins',
    icon: Flame,
    bgClass: 'bg-rose-500/15 border-rose-500/30',
    textClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'preset:vault',
    label: 'Vault',
    description: 'HTF Spot / Bag Building / Risk Gate',
    icon: Shield,
    bgClass: 'bg-emerald-500/15 border-emerald-500/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'preset:rocket',
    label: 'Rocket',
    description: 'High R:R / Moonshots / Run-ups',
    icon: Rocket,
    bgClass: 'bg-purple-500/15 border-purple-500/30',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'preset:chart',
    label: 'Chart',
    description: 'Price Action / Structure / Levels',
    icon: BarChart2,
    bgClass: 'bg-indigo-500/15 border-indigo-500/30',
    textClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'preset:brain',
    label: 'Quant',
    description: 'Systematic / Algorithmic / Rules',
    icon: Cpu,
    bgClass: 'bg-pink-500/15 border-pink-500/30',
    textClass: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'preset:gem',
    label: 'Conviction',
    description: 'Diamond Hands / Blue-chips',
    icon: Gem,
    bgClass: 'bg-sky-500/15 border-sky-500/30',
    textClass: 'text-sky-600 dark:text-sky-400',
  },
  {
    id: 'preset:sparkles',
    label: 'Alpha',
    description: 'Catalysts / Narratives / On-Chain',
    icon: Sparkles,
    bgClass: 'bg-yellow-500/15 border-yellow-500/30',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
];

export const STRATEGY_CRYPTO_PRESETS = [
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'AVAX',
  'DOGE',
];

export interface StrategyLogoProps {
  strategy?: {
    name?: string;
    avatarUrl?: string;
    executionMode?: CryptoExecutionMode;
  } | null;
  avatarUrl?: string;
  name?: string;
  executionMode?: CryptoExecutionMode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showModeBadge?: boolean;
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-5 h-5 rounded-md text-[9px]',
    cryptoSize: 'xs' as const,
    iconSize: 'w-3 h-3',
  },
  sm: {
    container: 'w-7 h-7 rounded-lg text-[10px]',
    cryptoSize: 'sm' as const,
    iconSize: 'w-3.5 h-3.5',
  },
  md: {
    container: 'w-9 h-9 rounded-xl text-xs',
    cryptoSize: 'md' as const,
    iconSize: 'w-4.5 h-4.5',
  },
  lg: {
    container: 'w-12 h-12 rounded-xl text-sm',
    cryptoSize: 'lg' as const,
    iconSize: 'w-6 h-6',
  },
  xl: {
    container: 'w-16 h-16 rounded-2xl text-base',
    cryptoSize: 'xl' as const,
    iconSize: 'w-8 h-8',
  },
};

export const StrategyLogo: React.FC<StrategyLogoProps> = ({
  strategy,
  avatarUrl: propAvatarUrl,
  name: propName,
  executionMode: propMode,
  size = 'md',
  className = '',
  showModeBadge = false,
}) => {
  const avatar = propAvatarUrl ?? strategy?.avatarUrl ?? '';
  const name = propName ?? strategy?.name ?? 'ST';
  const mode = propMode ?? strategy?.executionMode ?? 'futures';

  const [imgError, setImgError] = useState(false);

  // Reset img error if avatar source changes
  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  // Extract initials (up to 2 letters)
  const getInitials = (str: string) => {
    if (!str) return 'ST';
    const words = str.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Determine fallback background styling based on execution mode
  const getFallbackStyles = () => {
    switch (mode) {
      case 'spot':
        return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
      case 'hybrid':
        return 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400';
      case 'futures':
      default:
        return 'bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-400';
    }
  };

  // 1. Direct Image URL / Base64 upload
  const isDirectImage =
    avatar &&
    (avatar.startsWith('data:image/') ||
      avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('blob:'));

  if (isDirectImage && !imgError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-xs ${config.container} ${className}`}
      >
        <img
          src={avatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        {showModeBadge && (
          <span
            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card ${
              mode === 'spot' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          />
        )}
      </div>
    );
  }

  // 2. Preset Crypto Token badge (e.g. crypto:BTC)
  if (avatar && avatar.startsWith('crypto:')) {
    const symbol = avatar.replace('crypto:', '').trim().toUpperCase();
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 border border-border/60 bg-canvas rounded-xl shadow-xs p-0.5 ${config.container} ${className}`}
      >
        <CryptoIcon symbol={symbol} size={config.cryptoSize} />
        {showModeBadge && (
          <span
            className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card ${
              mode === 'spot' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          />
        )}
      </div>
    );
  }

  // 3. Preset Trading Icon badge (e.g. preset:lightning)
  if (avatar && avatar.startsWith('preset:')) {
    const preset = STRATEGY_PRESET_BADGES.find((p) => p.id === avatar);
    if (preset) {
      const PresetIcon = preset.icon;
      return (
        <div
          className={`relative inline-flex items-center justify-center shrink-0 border shadow-xs ${preset.bgClass} ${preset.textClass} ${config.container} ${className}`}
        >
          <PresetIcon className={config.iconSize} strokeWidth={2.2} />
          {showModeBadge && (
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card ${
                mode === 'spot' ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
          )}
        </div>
      );
    }
  }

  // 4. Fallback Monogram Avatar
  const initials = getInitials(name);
  const fallbackStyle = getFallbackStyles();

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 font-mono font-black tracking-tight select-none shadow-xs ${fallbackStyle} ${config.container} ${className}`}
    >
      <span>{initials}</span>
      {showModeBadge && (
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card ${
            mode === 'spot' ? 'bg-emerald-500' : 'bg-blue-500'
          }`}
        />
      )}
    </div>
  );
};
