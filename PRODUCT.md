# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are active cryptocurrency traders, intraday perpetual futures scalpers (e.g. ICT, orderflow, volume profile), and spot portfolio accumulators. They trade 24/7 global crypto markets across multiple distinct strategies and venues, frequently balancing high-leverage execution with strict risk invalidation.

## Product Purpose

TradeGate Crypto exists to eliminate emotional, unvetted, and impulsive trade entries by putting an institutional-grade discipline gate directly in front of the trade logging workflow. Success means a trader adheres to their pre-defined rules, sizes positions mathematically according to risk tolerance, and maintains a clean, verified journal of performance across isolated strategies.

## Positioning

Unlike generic automated trading journals or exchange trackers that only record trades after the fact, TradeGate Crypto enforces a Pre-Trade Discipline Gate where required checklist rules, invalidation conditions, and risk sizing parameters must be satisfied to unlock execution recording. Trade capital, checklists, entries, and analytics are isolated per Strategy Profile rather than tied to custodial exchange accounts.

## Operating Context

- Used live during active market hours and regional liquidity sessions (Asia 00:00-08:00 UTC, London 07:00-15:00 UTC, New York AM 13:00-18:00 UTC, New York PM 18:00-22:00 UTC).
- Operates on desktop, laptop, and widescreen trading setups alongside TradingView, exchange interfaces (Hyperliquid, Binance, Bybit), and decentralized protocols.
- Runs 100% locally in the browser with zero cloud dependencies, maintaining complete financial privacy.

## Capabilities and Constraints

- **Isolated Strategy Profiles**: Independent capital balance tracking, customizable checklist rules (Mandatory vs Confluence with point weights), chart timeframe filters, and session allowances.
- **Crypto-Only Execution Modes**: Leveraged perpetual futures (`Crypto Perps`), spot portfolio accumulation (`Crypto Spot`), and inline toggling (`Crypto Hybrid`).
- **Pre-Trade Gate Engine**: Dynamic Setup Grading (`A+`, `A`, `B`, `C`), position sizing, notional value calculations, risk-to-reward ratios, and liquidation price estimation.
- **Discipline Enforcement**: Action buttons are locked until all mandatory rules pass; intentional overrides are explicitly recorded as discipline violations with error tags (FOMO, Moved SL, Over-leveraged, etc.).
- **Journal & Calendar Ledger**: Table and monthly net PnL calendar views with day drill-down, searching, and outcome filters.
- **Performance Analytics**: Realized PnL, win rates, profit factor, rule adherence correlation, session edge breakdown, and execution mistake leak audits.
- **Storage & Privacy Constraint**: 100% local persistence via client-side IndexedDB (`idb-keyval`) with localStorage fallback. Complete JSON system snapshot export/import and CSV spreadsheet download. No server tracking or external data leakage.

## Brand Commitments

- **Name**: TradeGate Crypto (TradeGate v2.0).
- **Aesthetic**: Institutional SaaS Terminal (Linear / Hyperliquid / Stripe inspired), tactile, high density, and functional.
- **Themes**: High-contrast Dark Mode (`#090A0F` pitch canvas, `#11131A` elevated panels, `#F59E0B` amber brand accent) and Clean Institutional Light Mode (`#F8FAFC` slate canvas, `#FFFFFF` cards, `#059669` / `#E11D48` returns).
- **Typography**: Inter for clear UI labels; JetBrains Mono for all numeric prices, PnL, leverage, and R-multiples (`tabular-nums`).

## Evidence on Hand

- Fully functional React 18 + Vite + TypeScript application code in `src/`.
- 4 pre-seeded realistic crypto strategy profiles (ICT Silver Bullet, Orderflow Scalp, HTF Narrative Spot, On-Chain DEX Momentum) and demo trade ledger in `src/data/seedData.ts`.
- Verified local storage engine in `src/utils/storage.ts` and crypto math engine in `src/utils/cryptoMath.ts`.

## Product Principles

1. **The Gate Precedes the Log**: Discipline is enforced before capital is deployed; execution compliance outranks retrospective rationalization.
2. **Strategy Isolation over Account Mingling**: A trader's edge lives in specific setups and playbooks; performance and capital must be measured per strategy profile, not lumped into a single broker balance.
3. **Zero Latency & Total Privacy**: Financial trades, playbooks, and screenshots belong strictly to the trader; everything persists on-device without telemetry or cloud exposure.
4. **Institutional Ergonomics**: Fast, keyboard-friendly, high-contrast, and dense without visual slop or generic boilerplate.

