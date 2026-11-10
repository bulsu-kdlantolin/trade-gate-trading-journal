# TradeGate Crypto — Institutional Trading Journal & Execution Terminal

TradeGate Crypto is a standalone, full-viewport, institutional-grade cryptocurrency trading journal and pre-trade discipline gate designed for perpetual futures and spot portfolio traders.

## Key Features

- **Isolated Strategy Profiles**: Capital balances, checklists, entries, and analytics are strictly isolated per Strategy Profile (not tied to broker API accounts).
- **Crypto-Only Execution Modes**:
  - `Crypto Futures (Perps)`: Leveraged perpetual contracts with dynamic margin, leverage pills, and live liquidation estimates.
  - `Crypto Spot & Holdings`: Spot accumulation, DCA tranches, custody venue tags, and portfolio weight metrics.
  - `Crypto Hybrid`: Seamless inline switching between PERP and SPOT entries.
- **Pre-Trade Discipline Gate**: Mandatory checklist validation, confluence scoring, and automated Setup Grading (`A+`, `A`, `B`, `C`).
- **Authentic Crypto Icons**: `<CryptoIcon />` with symbol normalization, curated vector logos, CDN fallbacks, and deterministic gradient monograms for on-chain memecoins.
- **Dual Institutional Theme**: High-contrast Dark Mode (Pro Terminal) and Light Mode (Clean Institutional).
- **Local-First Client Storage Engine**: Powered by IndexedDB with localStorage fallback for unlimited local storage of high-resolution chart screenshots and thousands of journaled trades.
- **Export & Sharing Suite**:
  - Share verified Trade Cards as PNG / Clipboard.
  - Export Strategy Playbooks as Markdown, PNG, and PDF.
  - Full system JSON backups and CSV Journal exports.

## Tech Stack

- **Framework**: React 18 + Vite + TypeScript (Strict Type Safety)
- **Styling**: Tailwind CSS with CSS Variable-based Semantic Design Tokens
- **Charts**: Recharts (Responsive Area Equity Curve)
- **Export**: html-to-image, jsPDF
- **Storage**: IndexedDB (idb-keyval) + localStorage fallback

## Getting Started

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm run dev

# Build for production
pnpm run build
```

