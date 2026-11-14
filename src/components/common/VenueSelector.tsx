import React, { useState, useEffect } from 'react';
import { VenueCustodyTag } from '../../types/trade';
import { playMicroTick } from '../../utils/audioTelemetry';
import { VenueIcon, NetworkIcon } from './VenueIcon';
import {
  Building2,
  Cpu,
  Shield,
  Plus,
  Pencil,
  Check,
  X,
  Sparkles,
  Globe,
} from 'lucide-react';

export interface VenueOption {
  id: string;
  name: string;
  category: 'CEX' | 'DEX' | 'Wallet' | 'Network';
  description?: string;
  network?: string;
}

export const TOP_POPULAR_VENUES: VenueOption[] = [
  { id: 'Binance', name: 'Binance', category: 'CEX', description: 'Global Leading CEX' },
  { id: 'Coinbase', name: 'Coinbase', category: 'CEX', description: 'US & Global CEX' },
  { id: 'Bybit', name: 'Bybit', category: 'CEX', description: 'Global Derivatives & Spot CEX' },
  { id: 'OKX', name: 'OKX', category: 'CEX', description: 'Global CEX & Web3 Hub' },
  { id: 'Kraken', name: 'Kraken', category: 'CEX', description: 'Global EUR/USD CEX' },
  { id: 'Raydium / Jupiter', name: 'Raydium / Jupiter', category: 'DEX', description: 'Solana DEX & Aggregator', network: 'Solana' },
  { id: 'Uniswap (EVM)', name: 'Uniswap (EVM)', category: 'DEX', description: 'Ethereum / L2s AMM', network: 'EVM' },
  { id: 'Hyperliquid Spot', name: 'Hyperliquid Spot', category: 'DEX', description: 'On-chain Orderbook Spot L1', network: 'Hyperliquid' },
  { id: 'Solana Network', name: 'Solana Network', category: 'Network', description: 'Solana High-Speed L1', network: 'Solana' },
  { id: 'Base Network', name: 'Base Network', category: 'Network', description: 'Coinbase Base Layer 2', network: 'Base' },
  { id: 'Hardware / Cold Wallet', name: 'Hardware / Cold Wallet', category: 'Wallet', description: 'Ledger / Trezor / Cold Storage' },
];

export const ALL_PRESET_VENUES: VenueOption[] = [
  // CEX Exchanges
  { id: 'Binance', name: 'Binance', category: 'CEX', description: 'Global Leading CEX' },
  { id: 'Coinbase', name: 'Coinbase', category: 'CEX', description: 'US & Global CEX' },
  { id: 'Bybit', name: 'Bybit', category: 'CEX', description: 'Global Derivatives & Spot CEX' },
  { id: 'OKX', name: 'OKX', category: 'CEX', description: 'Global CEX & Web3 Hub' },
  { id: 'Kraken', name: 'Kraken', category: 'CEX', description: 'Global EUR/USD CEX' },
  { id: 'KuCoin', name: 'KuCoin', category: 'CEX', description: 'Global Altcoin CEX' },
  { id: 'Bitget', name: 'Bitget', category: 'CEX', description: 'Global Copy & Spot CEX' },
  { id: 'Gate.io', name: 'Gate.io', category: 'CEX', description: 'Global Token Listing CEX' },
  { id: 'MEXC', name: 'MEXC', category: 'CEX', description: 'High-Volume Altcoin CEX' },
  { id: 'HTX / Huobi', name: 'HTX / Huobi', category: 'CEX', description: 'Global CEX Platform' },
  { id: 'Deribit', name: 'Deribit', category: 'CEX', description: 'Institutional Derivatives & Spot' },

  // DEX & On-Chain Protocols
  { id: 'Raydium / Jupiter', name: 'Raydium / Jupiter', category: 'DEX', description: 'Solana DEX & Aggregator', network: 'Solana' },
  { id: 'Uniswap (EVM)', name: 'Uniswap (EVM)', category: 'DEX', description: 'Ethereum, Arbitrum, Base DEX', network: 'EVM' },
  { id: 'Hyperliquid Spot', name: 'Hyperliquid Spot', category: 'DEX', description: 'On-chain Orderbook L1 Spot', network: 'Hyperliquid' },
  { id: 'PancakeSwap', name: 'PancakeSwap', category: 'DEX', description: 'BNB Chain / Multi-chain AMM', network: 'BNB' },
  { id: 'Aerodrome (Base)', name: 'Aerodrome (Base)', category: 'DEX', description: 'Base Leading DEX Hub', network: 'Base' },
  { id: 'Pump.fun', name: 'Pump.fun', category: 'DEX', description: 'Solana Bonding Curve Launchpad', network: 'Solana' },
  { id: 'Curve Finance', name: 'Curve Finance', category: 'DEX', description: 'Deep Liquidity Stable/AMM', network: 'EVM' },
  { id: 'Osmosis', name: 'Osmosis', category: 'DEX', description: 'Cosmos Interchain DEX Hub', network: 'Cosmos' },

  // Networks & Blockchains
  { id: 'Solana Network', name: 'Solana Network', category: 'Network', description: 'Solana High-Speed Layer 1', network: 'Solana' },
  { id: 'Base Network', name: 'Base Network', category: 'Network', description: 'Coinbase Base Layer 2', network: 'Base' },
  { id: 'Ethereum / EVM', name: 'Ethereum / EVM', category: 'Network', description: 'Ethereum Mainnet & EVM Chains', network: 'EVM' },
  { id: 'Arbitrum Network', name: 'Arbitrum Network', category: 'Network', description: 'Arbitrum Nitro Rollup L2', network: 'Arbitrum' },
  { id: 'BNB Chain', name: 'BNB Chain', category: 'Network', description: 'BNB Smart Chain (BSC)', network: 'BNB' },
  { id: 'Sui Network', name: 'Sui Network', category: 'Network', description: 'Sui Move High-Throughput L1', network: 'Sui' },
  { id: 'TON Network', name: 'TON Network', category: 'Network', description: 'The Open Network Ecosystem', network: 'TON' },

  // Wallets & Custody
  { id: 'Hardware / Cold Wallet', name: 'Hardware / Cold Wallet', category: 'Wallet', description: 'Ledger / Trezor / Cold Storage' },
  { id: 'Ledger', name: 'Ledger', category: 'Wallet', description: 'Ledger Nano / Stax Hardware' },
  { id: 'Trezor', name: 'Trezor', category: 'Wallet', description: 'Trezor Safe / Model T Hardware' },
  { id: 'Tangem', name: 'Tangem', category: 'Wallet', description: 'Tangem NFC Card Cold Storage' },
  { id: 'Phantom / Backpack', name: 'Phantom / Backpack', category: 'Wallet', description: 'Solana Multi-chain Wallet', network: 'Solana' },
  { id: 'MetaMask / Rabby', name: 'MetaMask / Rabby', category: 'Wallet', description: 'EVM Leading Web3 Wallets', network: 'EVM' },
  { id: 'Trust Wallet', name: 'Trust Wallet', category: 'Wallet', description: 'Multi-chain Mobile & Extension' },
];

export interface VenueSelectorProps {
  value: VenueCustodyTag | string;
  onChange: (val: VenueCustodyTag) => void;
  className?: string;
  label?: string;
  showHelper?: boolean;
}

type VenueCategoryTab = 'popular' | 'cex' | 'dex' | 'network' | 'wallet' | 'custom';

export const VenueSelector: React.FC<VenueSelectorProps> = ({
  value,
  onChange,
  className = '',
  label = 'Exchange / Custody Venue & Network',
  showHelper = true,
}) => {
  const isPredefined = ALL_PRESET_VENUES.some((v) => v.id.toLowerCase() === (value || '').toLowerCase());

  const [activeTab, setActiveTab] = useState<VenueCategoryTab>(() => {
    if (!value) return 'popular';
    if (!isPredefined) return 'custom';
    const found = ALL_PRESET_VENUES.find((v) => v.id.toLowerCase() === value.toLowerCase());
    if (found?.category === 'CEX') return 'cex';
    if (found?.category === 'DEX') return 'dex';
    if (found?.category === 'Network') return 'network';
    if (found?.category === 'Wallet') return 'wallet';
    return 'popular';
  });

  const [customInput, setCustomInput] = useState<string>(() => {
    return !isPredefined && value ? value : '';
  });

  const [isTypingCustom, setIsTypingCustom] = useState<boolean>(() => !isPredefined && Boolean(value));

  // Sync custom input if value changes externally
  useEffect(() => {
    if (!ALL_PRESET_VENUES.some((v) => v.id.toLowerCase() === (value || '').toLowerCase()) && value) {
      setCustomInput(value);
      setIsTypingCustom(true);
    }
  }, [value]);

  const handleSelectVenue = (venueName: string) => {
    playMicroTick();
    setIsTypingCustom(false);
    onChange(venueName as VenueCustodyTag);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    if (val.trim()) {
      onChange(val.trim() as VenueCustodyTag);
    }
  };

  const displayedVenues =
    activeTab === 'popular'
      ? TOP_POPULAR_VENUES
      : activeTab === 'cex'
        ? ALL_PRESET_VENUES.filter((v) => v.category === 'CEX')
        : activeTab === 'dex'
          ? ALL_PRESET_VENUES.filter((v) => v.category === 'DEX')
          : activeTab === 'network'
            ? ALL_PRESET_VENUES.filter((v) => v.category === 'Network')
            : activeTab === 'wallet'
              ? ALL_PRESET_VENUES.filter((v) => v.category === 'Wallet')
              : [];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header Row: Label & Active Selection Pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-text-secondary">
            {label}
          </label>
          {showHelper && (
            <p className="text-[11px] text-text-muted mt-0.5">
              Select your exchange, on-chain DEX, network, or cold wallet — or enter a custom venue
            </p>
          )}
        </div>

        {value && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-brand/10 border border-brand/30 text-xs font-mono shadow-xs">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Active:</span>
            <VenueIcon venue={value} size="xs" />
            <span className="font-bold text-text-primary dark:text-brand truncate max-w-[170px]">
              {value}
            </span>
            {!isPredefined && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand text-black font-extrabold uppercase">
                Custom
              </span>
            )}
          </div>
        )}
      </div>

      {/* Category Tabs (Popular, CEX, DEX, Networks, Wallets, Custom) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setActiveTab('popular');
            setIsTypingCustom(false);
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'popular' && !isTypingCustom
              ? 'bg-brand text-black shadow-xs font-extrabold'
              : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
            }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Top Popular</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setActiveTab('cex');
            setIsTypingCustom(false);
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'cex' && !isTypingCustom
              ? 'bg-brand text-black shadow-xs font-extrabold'
              : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
            }`}
        >
          <Building2 className="w-3 h-3" />
          <span>CEX Exchanges</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setActiveTab('dex');
            setIsTypingCustom(false);
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'dex' && !isTypingCustom
              ? 'bg-brand text-black shadow-xs font-extrabold'
              : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
            }`}
        >
          <Cpu className="w-3 h-3" />
          <span>DEX Protocols</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setActiveTab('network');
            setIsTypingCustom(false);
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'network' && !isTypingCustom
              ? 'bg-brand text-black shadow-xs font-extrabold'
              : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
            }`}
        >
          <Globe className="w-3 h-3" />
          <span>Networks & L1/L2</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setActiveTab('wallet');
            setIsTypingCustom(false);
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'wallet' && !isTypingCustom
              ? 'bg-brand text-black shadow-xs font-extrabold'
              : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
            }`}
        >
          <Shield className="w-3 h-3" />
          <span>Cold Wallets</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setActiveTab('custom');
            setIsTypingCustom(true);
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${activeTab === 'custom' || isTypingCustom
            ? 'bg-brand text-black shadow-xs font-extrabold'
            : 'bg-canvas border border-border text-text-muted hover:text-text-primary'
            }`}
        >
          <Pencil className="w-3 h-3" />
          <span>+ Custom / Other</span>
        </button>
      </div>

      {/* Preset Chips Grid with Official Logos */}
      {!isTypingCustom && activeTab !== 'custom' && (
        <div className="flex flex-wrap gap-2 animate-dropdown">
          {displayedVenues.map((venue) => {
            const isSelected = (value || '').toLowerCase() === venue.id.toLowerCase();
            return (
              <button
                key={venue.id}
                type="button"
                onClick={() => handleSelectVenue(venue.id)}
                title={venue.description || venue.name}
                className = {`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all inline-flex items-center gap-2 group active:scale-[0.98] ${isSelected
                ? 'bg-brand/15 border-brand text-text-primary dark:text-brand font-bold ring-1 ring-brand/30 shadow-xs'
                : 'bg-canvas border-border text-text-secondary hover:text-text-primary hover:border-brand/40 shadow-2xs'
              }`
          }
              >
          <VenueIcon venue={venue.id} size="sm" network={venue.network} />
          <span>{venue.name}</span>
          {
              venue.network && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-card border border-border text-text-muted">
                  <NetworkIcon network={venue.network} size="xs" />
                  <span>{venue.network}</span>
                </span>
              )
            }
          { isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0 ml-0.5" />}
        </button>
      );
          })}

      {/* Quick trigger for other/custom */}
      <button
        type="button"
        onClick={() => {
          playMicroTick();
          setIsTypingCustom(true);
          setActiveTab('custom');
        }}
        className="px-3 py-1.5 rounded-xl border border-dashed border-border bg-canvas/60 text-text-muted hover:text-brand hover:border-brand/50 text-xs font-medium transition-all inline-flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Other Platform...</span>
      </button>
    </div>
  )
}

{/* Custom Platform Input Form */ }
{
  (isTypingCustom || activeTab === 'custom') && (
    <div className="bg-canvas border border-brand/40 rounded-xl p-3.5 space-y-2.5 animate-dropdown shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
          <Pencil className="w-3.5 h-3.5 text-brand" />
          <span>Custom Exchange, Venue, or Network</span>
        </span>
        <button
          type="button"
          onClick={() => {
            playMicroTick();
            setIsTypingCustom(false);
            setActiveTab('popular');
          }}
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
        >
          <span>Back to Presets</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            autoFocus={isTypingCustom}
            value={customInput}
            onChange={handleCustomInputChange}
            placeholder="Type platform or network (e.g. MEXC, Tangem, Osmosis, Curve, BitMEX...)"
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-medium focus:border-brand pr-8"
          />
          {customInput && (
            <button
              type="button"
              onClick={() => {
                setCustomInput('');
                handleSelectVenue('Binance');
              }}
              title="Clear custom input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (customInput.trim()) {
              onChange(customInput.trim() as VenueCustodyTag);
              playMicroTick();
            }
          }}
          className="px-3.5 py-2 bg-brand text-black font-bold text-xs rounded-xl hover:bg-brand-hover transition-colors shrink-0 shadow-xs"
        >
          Apply
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <span className="text-[10px] text-text-muted font-medium">Quick suggestions:</span>
        {
          ['MEXC', 'Tangem', 'Osmosis', 'Curve Finance', 'Deribit', 'Sui Network', 'Backpack'].map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => {
                setCustomInput(sug);
                onChange(sug as VenueCustodyTag);
                playMicroTick();
              }}
              className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-card border border-border text-text-secondary hover:text-brand hover:border-brand/40 transition-colors shadow-2xs"
            >
              <VenueIcon venue={sug} size="xs" />
              <span>{sug}</span>
            </button>
          ))
        }
      </div>
    </div>
  )
}
        </div >
        );
};
