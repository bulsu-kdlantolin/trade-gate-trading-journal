import React from 'react';
import { CryptoIcon } from './CryptoIcon';
import { CircleFlag } from './CircleFlag';
import { isCryptoCurrency, getCurrencySymbol, formatNumberOnly } from '../../utils/currency';

export interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  decimals?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

/**
 * Standardized component for rendering currency amounts throughout TradeGate.
 * If currency is a cryptocurrency (e.g. USDT, BTC, ETH, SOL), renders the official SVG logo
 * followed by the formatted numeric amount, eliminating redundant "USDT" text strings.
 * If currency is fiat (e.g. USD, EUR, PHP), renders the appropriate currency symbol.
 */
export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = 'USD',
  showSign = false,
  size = 'xs',
  className = '',
  decimals,
  prefix,
  suffix,
}) => {
  const isCrypto = isCryptoCurrency(currency);
  const isNeg = amount < 0;
  const isPos = amount > 0;
  const sign = isNeg ? '-' : showSign && isPos ? '+' : '';
  const absAmount = Math.abs(amount);
  const formattedNum = formatNumberOnly(absAmount, currency, decimals);
  const sym = getCurrencySymbol(currency).trim();

  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${className}`}>
      {prefix}
      {sign && <span className="shrink-0">{sign}</span>}
      {isCrypto ? (
        <CryptoIcon symbol={currency} size={size} className="shrink-0" />
      ) : (
        <span className="font-mono shrink-0">{sym}</span>
      )}
      <span>{formattedNum}</span>
      {suffix}
    </span>
  );
};

export const CurrencyIconOrSymbol: React.FC<{
  currency?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  useFlag ?: boolean;
}> = ({ currency = 'USD', size = 'xs', className = '', useFlag = false }) => {
  if (isCryptoCurrency(currency)) {
    return <CryptoIcon symbol={currency} size={size} className={className} />;
  }
  if (useFlag) {
    return <CircleFlag country={currency} size={size} className={className} />;
  }
  return <span className={`font-mono ${className}`}>{getCurrencySymbol(currency).trim()}</span>;
};

/**
 * Parenthesized currency badge for input labels and table headers (e.g. "( ₮ )" or "( $ )").
 * Enforces strict inline-flex items-center alignment so that parentheses and the crypto SVG icon
 * or fiat currency symbol are centered along the exact same vertical midpoint with zero line breaks.
 */
export const CurrencyBadge: React.FC<{
  currency?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ currency = 'USD', size = 'xs', className = '' }) => {
  const isCrypto = isCryptoCurrency(currency);
  const sym = getCurrencySymbol(currency).trim();

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-text-muted text-[11px] font-normal shrink-0 select-none ${className}`}
      aria-label={`Currency: ${currency}`}
    >
      <span className="leading-none text-text-muted/75 font-sans">(</span>
      {isCrypto ? (
        <CryptoIcon symbol={currency} size={size} className="shrink-0" />
      ) : (
        <span className="font-mono text-[11px] leading-none">{sym}</span>
      )}
      <span className="leading-none text-text-muted/75 font-sans">)</span>
    </span>
  );
};


