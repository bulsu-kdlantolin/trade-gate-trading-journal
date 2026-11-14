export type CryptoExecutionMode = 'futures' | 'spot' | 'hybrid';

export type BaseCurrency =
  | 'USD'
  | 'PHP'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'INR'
  | 'BRL'
  | 'KRW'
  | 'CHF'
  | 'USDT'
  | 'SOL'
  | 'BTC'
  | 'ETH'
  | (string & {});

export type RiskModelType = 'Percentage' | 'FixedDollar';

export type TimeframeTag =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1H'
  | '2H'
  | '4H'
  | '1D'
  | '1W'
  | (string & {});

export type SessionTag = 'Asia' | 'London' | 'NY AM' | 'NY PM' | (string & {});

export type RuleType = 'Mandatory' | 'Confluence';

export interface StrategyRule {
  id: string;
  label: string;
  type: RuleType;
  weight: number; // Mandatory rules have weight 0, confluence rules have weight 1..N
  category?: 'HTF Bias' | 'Execution' | 'Risk' | 'Market Context' | 'On-Chain' | 'General';
}

export interface BalanceAdjustment {
  id: string;
  strategyId: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  note?: string;
  timestamp: number;
}

export interface StrategyProfile {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string; // Custom image (data:..., https://...), preset badge (preset:...), or crypto symbol (crypto:...)
  executionMode: CryptoExecutionMode;
  baseCurrency: BaseCurrency;
  accountBalance: number;
  riskModel: RiskModelType;
  defaultRiskValue: number; // e.g. 1.0 for 1%, or 100 for $100
  timeframes: TimeframeTag[];
  sessions: SessionTag[];
  rules: StrategyRule[];
  minConfluenceForGradeA: number;
  minConfluenceForGradeB: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Pre-seeded institutional Crypto Strategy Profiles
 */
export const DEFAULT_CRYPTO_STRATEGIES: StrategyProfile[] = [
  {
    id: 'strat_ict_crypto_perps',
    name: 'ICT Silver Bullet & Session Liquidity',
    description: 'Killzone displacement, FVG retests, and liquidity sweep setups on Perpetual Futures.',
    avatarUrl: 'preset:lightning',
    executionMode: 'futures',
    baseCurrency: 'USDT',
    accountBalance: 25000,
    riskModel: 'Percentage',
    defaultRiskValue: 1.0,
    timeframes: ['15m', '5m', '1m'],
    sessions: ['Asia', 'London', 'NY AM', 'NY PM'],
    rules: [
      { id: 'ict_rule_1', label: 'HTF Liquidity Swept (Daily/4H)', type: 'Mandatory', weight: 0, category: 'HTF Bias' },
      { id: 'ict_rule_2', label: '15m MSS with Displacement (Required)', type: 'Mandatory', weight: 0, category: 'Execution' },
      { id: 'ict_rule_3', label: '5m FVG / OTE 0.62–0.79 Fib Retest', type: 'Confluence', weight: 2, category: 'Execution' },
      { id: 'ict_rule_4', label: 'CVD / Funding Rate Alignment', type: 'Confluence', weight: 2, category: 'Market Context' },
      { id: 'ict_rule_5', label: 'SMT Divergence (BTC vs ETH/SOL)', type: 'Confluence', weight: 1, category: 'Market Context' }
    ],
    minConfluenceForGradeA: 4,
    minConfluenceForGradeB: 2,
    createdAt: 1718000000000,
    updatedAt: 1718000000000
  },
  {
    id: 'strat_orderflow_scalp',
    name: 'Orderflow & Volume Profile Scalp',
    description: 'Volume profile value area sweeps, delta absorption, and liquidation cascade scalps.',
    avatarUrl: 'preset:target',
    executionMode: 'futures',
    baseCurrency: 'USDT',
    accountBalance: 15000,
    riskModel: 'Percentage',
    defaultRiskValue: 1.5,
    timeframes: ['5m', '3m', '1m'],
    sessions: ['NY AM', 'London'],
    rules: [
      { id: 'of_rule_1', label: 'Session VAH/VAL Sweep', type: 'Mandatory', weight: 0, category: 'HTF Bias' },
      { id: 'of_rule_2', label: 'POC Reclaim Confirmed', type: 'Mandatory', weight: 0, category: 'Execution' },
      { id: 'of_rule_3', label: 'Delta Absorption at Key Level', type: 'Confluence', weight: 2, category: 'Execution' },
      { id: 'of_rule_4', label: 'Liquidation Heatmap Magnet Alignment', type: 'Confluence', weight: 2, category: 'Market Context' }
    ],
    minConfluenceForGradeA: 4,
    minConfluenceForGradeB: 2,
    createdAt: 1718005000000,
    updatedAt: 1718005000000
  },
  {
    id: 'strat_htf_narrative_spot',
    name: 'HTF Narrative & Spot Accumulation',
    description: 'High-conviction spot bag building, weekly structure reclaims, and tokenomic confluence.',
    avatarUrl: 'crypto:BTC',
    executionMode: 'spot',
    baseCurrency: 'USDT',
    accountBalance: 50000,
    riskModel: 'Percentage',
    defaultRiskValue: 5.0,
    timeframes: ['1W', '1D', '4H'],
    sessions: ['Asia', 'London', 'NY AM'],
    rules: [
      { id: 'spot_rule_1', label: 'Weekly/Daily Structure Reclaim', type: 'Mandatory', weight: 0, category: 'HTF Bias' },
      { id: 'spot_rule_2', label: 'Token Unlock Schedule Checked', type: 'Mandatory', weight: 0, category: 'Risk' },
      { id: 'spot_rule_3', label: 'BTC.D Trend Confluence', type: 'Confluence', weight: 2, category: 'Market Context' },
      { id: 'spot_rule_4', label: 'Staggered DCA & Take-Profit Tranches Set', type: 'Confluence', weight: 2, category: 'Execution' }
    ],
    minConfluenceForGradeA: 4,
    minConfluenceForGradeB: 2,
    createdAt: 1718010000000,
    updatedAt: 1718010000000
  },
  {
    id: 'strat_onchain_dex_solana',
    name: 'On-Chain DEX & Solana Momentum',
    description: 'Fast-moving DEX launches, Raydium liquidity velocity, and smart wallet copy-trading.',
    avatarUrl: 'crypto:SOL',
    executionMode: 'spot',
    baseCurrency: 'SOL',
    accountBalance: 5000,
    riskModel: 'Percentage',
    defaultRiskValue: 3.0,
    timeframes: ['15m', '5m', '1m'],
    sessions: ['Asia', 'London', 'NY AM', 'NY PM'],
    rules: [
      { id: 'dex_rule_1', label: 'Liquidity Locked & Mint Revoked', type: 'Mandatory', weight: 0, category: 'Risk' },
      { id: 'dex_rule_2', label: 'Top 10 Holders < 25% (No Dev Bundles)', type: 'Mandatory', weight: 0, category: 'Risk' },
      { id: 'dex_rule_3', label: 'Smart Money Wallet Inflow Tracked', type: 'Confluence', weight: 2, category: 'On-Chain' },
      { id: 'dex_rule_4', label: 'Initial Principal Out at 2x Rule Set', type: 'Confluence', weight: 2, category: 'Execution' }
    ],
    minConfluenceForGradeA: 4,
    minConfluenceForGradeB: 2,
    createdAt: 1718015000000,
    updatedAt: 1718015000000
  }
];

