import { BaseCurrency } from '../types/strategy';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  type: 'fiat' | 'crypto';
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  // Major Fiat Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', type: 'fiat', decimals: 2 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', type: 'fiat', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', type: 'fiat', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', type: 'fiat', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', type: 'fiat', decimals: 0 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', type: 'fiat', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', type: 'fiat', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', type: 'fiat', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', type: 'fiat', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', type: 'fiat', decimals: 2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', type: 'fiat', decimals: 0 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', type: 'fiat', decimals: 2 },

  // Official Crypto Assets (USDC removed per request, no made-up symbols)
  { code: 'USDT', symbol: 'USDT', name: 'Tether (USDT)', type: 'crypto', decimals: 2 },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin (BTC)', type: 'crypto', decimals: 6 },
  { code: 'ETH', symbol: 'ETH', name: 'Ethereum (ETH)', type: 'crypto', decimals: 4 },
  { code: 'SOL', symbol: 'SOL', name: 'Solana (SOL)', type: 'crypto', decimals: 4 },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PHP: '₱',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'S$',
  INR: '₹',
  BRL: 'R$',
  KRW: '₩',
  CHF: 'CHF',
  USDT: 'USDT ',
  BTC: '₿',
  ETH: 'ETH ',
  SOL: 'SOL ',
};

// Backward-compatibility alias
export const CRYPTO_CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;

export const CURRENCY_LABELS: Record<string, string> = {
  USD: 'USD ($) • US Dollar',
  PHP: 'PHP (₱) • Philippine Peso',
  EUR: 'EUR (€) • Euro',
  GBP: 'GBP (£) • British Pound',
  JPY: 'JPY (¥) • Japanese Yen',
  CAD: 'CAD (CA$) • Canadian Dollar',
  AUD: 'AUD (A$) • Australian Dollar',
  SGD: 'SGD (S$) • Singapore Dollar',
  INR: 'INR (₹) • Indian Rupee',
  BRL: 'BRL (R$) • Brazilian Real',
  KRW: 'KRW (₩) • South Korean Won',
  CHF: 'CHF (CHF) • Swiss Franc',
  USDT: 'USDT • Tether',
  BTC: 'BTC (₿) • Bitcoin',
  ETH: 'ETH • Ethereum',
  SOL: 'SOL • Solana',
};

// Backward-compatibility alias
export const CRYPTO_CURRENCY_LABELS = CURRENCY_LABELS;

/**
 * Baseline exchange rate relative to 1 USD.
 * (1 unit of currency = X USD)
 */
export const BASE_RATES_IN_USD: Record<string, number> = {
  USD: 1.0,
  USDT: 1.0,
  PHP: 0.0171,   // 1 USD ≈ 58.50 PHP
  EUR: 1.087,    // 1 EUR ≈ 1.087 USD
  GBP: 1.282,    // 1 GBP ≈ 1.282 USD
  JPY: 0.00645,  // 1 USD ≈ 155 JPY
  CAD: 0.725,    // 1 CAD ≈ 0.725 USD
  AUD: 0.658,    // 1 AUD ≈ 0.658 USD
  SGD: 0.746,    // 1 SGD ≈ 0.746 USD
  INR: 0.0118,   // 1 USD ≈ 84.75 INR
  BRL: 0.174,    // 1 USD ≈ 5.75 BRL
  KRW: 0.00072,  // 1 USD ≈ 1390 KRW
  CHF: 1.136,    // 1 CHF ≈ 1.136 USD
  BTC: 96000.0,  // 1 BTC ≈ $96,000 USD
  ETH: 2750.0,   // 1 ETH ≈ $2,750 USD
  SOL: 185.0,    // 1 SOL ≈ $185 USD
};

const RATES_STORAGE_KEY = 'tradegate_exchange_rates';

/**
 * Returns cached live exchange rates if available, falling back to baseline rates.
 */
export function getExchangeRates(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...BASE_RATES_IN_USD, ...parsed };
      }
    }
  } catch { }
  return BASE_RATES_IN_USD;
}

/**
 * Converts a numeric amount from one currency to another using exchange rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD'
): number {
  if (!amount || isNaN(amount)) return 0;
  const from = (fromCurrency || 'USD').toUpperCase().trim();
  const to = (toCurrency || 'USD').toUpperCase().trim();
  if (from === to) return amount;

  const rates = getExchangeRates();
  const fromRate = rates[from] || BASE_RATES_IN_USD[from] || 1.0;
  const toRate = rates[to] || BASE_RATES_IN_USD[to] || 1.0;

  // Convert to USD baseline, then from USD to target currency
  const amountInUSD = amount * fromRate;
  const converted = amountInUSD / toRate;

  // Rounding aligned to currency precision
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === to);
  const decimals = config ? config.decimals : 2;

  if (decimals === 0) {
    return Math.round(converted);
  }
  return Number(converted.toFixed(decimals));
}

/**
 * Checks whether a given currency code is crypto.
 */
export function isCryptoCurrency(currency?: string): boolean {
  if (!currency) return false;
  const clean = currency.toUpperCase().trim();
  return ['USDT', 'BTC', 'ETH', 'SOL'].includes(clean);
}

export function getCurrencySymbol(currency?: BaseCurrency | string): string {
  if (!currency) return '$';
  const clean = currency.toUpperCase().trim();
  if (CURRENCY_SYMBOLS[clean]) return CURRENCY_SYMBOLS[clean];
  return clean.length <= 4 ? `${clean} ` : '$';
}

export function formatCryptoAmount(
  amount: number,
  currency: string = 'USD',
  maxDecimals?: number
): string {
  const clean = (currency || 'USD').toUpperCase().trim();
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === clean);
  const symbol = getCurrencySymbol(clean);
  const defaultDecimals = config ? config.decimals : 2;
  const decimals = maxDecimals !== undefined ? maxDecimals : defaultDecimals;

  const isNeg = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Math.min(2, decimals),
    maximumFractionDigits: decimals,
  }).format(absAmount);

  return `${isNeg ? '-' : ''}${symbol}${formatted}`;
}

export const formatCurrencyAmount = formatCryptoAmount;

export function formatNumberOnly(
  amount: number,
  currency: string = 'USD',
  maxDecimals?: number
): string {
  const clean = (currency || 'USD').toUpperCase().trim();
  const config = SUPPORTED_CURRENCIES.find((c) => c.code === clean);
  const defaultDecimals = config ? config.decimals : 2;
  const decimals = maxDecimals !== undefined ? maxDecimals : defaultDecimals;

  const isNeg = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Math.min(2, decimals),
    maximumFractionDigits: decimals,
  }).format(absAmount);

  return `${isNeg ? '-' : ''}${formatted}`;
}
