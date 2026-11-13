---
name: TradeGate Crypto
description: Institutional cryptocurrency trading journal, execution gate, and performance terminal styled with the official Binance design system
colors:
  primary: "#FCD535"
  primary-hover: "#F0B90B"
  canvas-dark: "#181A20"
  card-dark: "#1E2329"
  card-hover-dark: "#2B313A"
  border-dark: "#2B313A"
  border-muted-dark: "#363D47"
  text-primary-dark: "#EAECEF"
  text-secondary-dark: "#848E9C"
  text-muted-dark: "#5E6673"
  canvas-light: "#FAFAFA"
  card-light: "#FFFFFF"
  card-hover-light: "#F5F5F5"
  border-light: "#EAECEF"
  border-muted-light: "#D0D5DD"
  text-primary-light: "#181A20"
  text-secondary-light: "#474D57"
  text-muted-light: "#707A8A"
  brand-text-light: "#946C00"
  bullish: "#0ECB81"
  bullish-light: "#0ECB81"
  bearish: "#F6465D"
  bearish-light: "#F6465D"
  session-asia: "#FFFFFF"
  session-london: "#3B82F6"
  session-ny-am: "#EF4444"
  session-ny-pm: "#F87171"
  shadow-dark: "rgba(0, 0, 0, 0.35)"
typography:
  display:
    fontFamily: "BinancePlex, IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "BinancePlex, IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "BinancePlex, IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "BinancePlex, IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, JetBrains Mono, SFMono-Regular, Consolas, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  micro:
    fontFamily: "IBM Plex Mono, JetBrains Mono, SFMono-Regular, Consolas, Menlo, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  nano:
    fontFamily: "IBM Plex Mono, JetBrains Mono, SFMono-Regular, Consolas, Menlo, monospace"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card:
    backgroundColor: "{colors.card-dark}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: TradeGate Crypto

## Overview

**Creative North Star: "The Sovereign Execution Terminal — Binance Edition"**

TradeGate Crypto is engineered for high-conviction cryptocurrency traders who require tactical discipline, rapid ergonomics, and institutional clarity. The visual language adopts the official Binance design system—balancing extreme data density with zero visual noise, utilizing Binance's iconic dark canvas grounding (`#181A20`), container surfaces (`#1E2329`), vibrant Binance yellow accent (`#FCD535` / `#F0B90B`), and signature trading green (`#0ECB81`) and red (`#F6465D`).

The interface operates strictly in **Operate Mode**: every pixel exists to serve pre-trade discipline, risk verification, and performance analysis. Layouts maintain rigorous horizontal rhythm and tabular precision. Ambient brand glows are used sparingly—reserved for verified gate unlocks, active session badges, and high-tier setup grades.

**Key Characteristics:**
- **Binance Typography:** UI hierarchy powered by `IBM Plex Sans` (the open standard counterpart to proprietary `BinancePlex`) and numeric/tabular data powered by `IBM Plex Mono` / `JetBrains Mono` with tabular numerals.
- **Strict Semantic Separation:** Financial gains and losses use high-contrast Binance Green (`#0ECB81`) and Red (`#F6465D`) tokens, while structural controls remain disciplined in Binance Yellow (`#FCD535` / `#F0B90B`).
- **Tabular Monospace Alignment:** Every price, PnL value, position size, and R-multiple renders in `IBM Plex Mono` with tabular numerals.
- **Enforced Gate Feedback:** Interactive checklist items physically transform with green tints upon verification; the execution trigger states are unambiguously locked or unlocked.
- **Acoustic & Tactile Feedback:** Zero external audio dependencies; pure Web Audio API synthesis produces subtle micro-ticks, gate arpeggios, and avionic HUD sweeps.

## Colors

The palette is anchored by official Binance dark/light neutrals, punctuated by energetic Binance Yellow, with strict Binance green/red semantic returns.

### Primary
- **Binance Yellow** (`#FCD535` in dark / `#F0B90B` in light): The core brand energy, reserved for active navigation tabs, live strategy indicators, A+ setup tiers, and primary execution triggers.
- **Binance Gold** (`#F0B90B`): Interactive hover state for primary yellow buttons and badges in dark mode; primary button in light mode.

### Neutral
- **Binance Canvas** (`#181A20` dark / `#FAFAFA` light): The foundation canvas layer. Absorbs ambient light and gives cards floating structural separation.
- **Binance Card Surface** (`#1E2329` dark / `#FFFFFF` light): Container surface for trade forms, checklists, and bento KPI cards.
- **Binance Card Hover** (`#2B313A` dark / `#F5F5F5` light): Subtle highlight for table rows, clickable list items, and menu buttons.
- **Binance Hairline Border** (`#2B313A` dark / `#EAECEF` light): 1px structural boundary that defines cards without heavy drop-shadows.
- **Binance Text Primary** (`#EAECEF` dark / `#181A20` light): Main headlines, active prices, and primary labels.
- **Binance Text Secondary** (`#848E9C` dark / `#474D57` light): Form input labels, table secondary values, and timestamps.
- **Binance Text Muted** (`#5E6673` dark / `#707A8A` light): Inactive states, placeholder text, and footnote metadata.

### Semantic
- **Binance Bullish Green** (`#0ECB81`): Winning trades, verified mandatory rules, and positive P&L returns.
- **Binance Bearish Red** (`#F6465D`): Discipline violations, stop losses, closed losses, and gate lock alerts.

### Operational Roles & Hierarchy
- **Setup Confidence Tiers (Grades):**
  - **Grade A+**: Binance Yellow (`#FCD535`) — Elite conviction, all mandatory rules passed, maximum confluence points.
  - **Grade A**: Binance Green (`#0ECB81`) — Solid disciplined setup, high confluence.
  - **Grade B**: Electric Blue (`#3B82F6`) — Disciplined execution, moderate confluence.
  - **Grade C**: Binance Red (`#F6465D`) — Marginal setup, gate violation, or forced bypass.
- **Rule Domain Categories:**
  - **HTF Bias**: Indigo (`#6366F1`)
  - **Execution**: Binance Yellow (`#F0B90B`)
  - **Risk**: Binance Red (`#F6465D`)
  - **Market Context**: Purple (`#A855F7`)
  - **On-Chain**: Teal (`#14B8A6`)
  - **General**: Neutral Slate (`#5E6673`)
- **Market Liquidity Sessions (Preserved):**
  - **Asia**: Pure White (`#FFFFFF`)
  - **London**: Sovereign Blue (`#3B82F6`)
  - **New York AM**: Institutional Red (`#EF4444`)
  - **New York PM**: Sunset Light Red (`#F87171`)
- **Spot Actions:**
  - **BUY / ACCUMULATE**: Binance Green (`#0ECB81`)
  - **DCA ADD**: Teal (`#14B8A6`)
  - **PARTIAL TP**: Binance Yellow (`#F0B90B`)
  - **FULL EXIT**: Blue (`#3B82F6`)

### Named Rules
**The 10% Amber Rule.** Amber Gold (`#F59E0B`) is an operational beacon. It must never coat more than 10% of any viewport. If everything glows gold, nothing stands out.  
**The Strict Semantic Isolation Rule.** Emerald and Rose are reserved strictly for financial outcome and rule compliance. They are never used for decorative button borders or routine navigation.  
**The Borderless Pill Standard.** Status badges, session pills, and category tags must never carry 1px borders. Use tonal background tinting (`bg-*/15 text-*`) to preserve clean typographic hierarchy without visual clutter.

## Typography

**Display & UI Font:** Inter (with `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto` fallbacks)  
**Financial & Monospace Font:** JetBrains Mono (with `SFMono-Regular`, `Consolas`, `Menlo` fallbacks)

**Character:** Inter provides neutral, highly legible Swiss-grotesque UI scaffolding, while JetBrains Mono injects authoritative, cryptographic terminal weight to all numeric figures.

### Hierarchy
- **Display** (800 Extrabold, `1.5rem` / `24px`, line-height `1.2`, tracking `-0.02em`): Workspace headers and top-level branding.
- **Headline** (700 Bold, `1.125rem` / `18px`, line-height `1.3`): Bento card titles, section headings, and modal titles.
- **Title** (700 Bold, `0.875rem` / `14px`, line-height `1.4`): Checklist rule labels, strategy names, and table section titles.
- **Body** (500 Medium, `0.75rem` / `12px`, line-height `1.5`): General UI copy, descriptions, and notes. Max line length 65ch.
- **Label / Data** (700 Bold Mono, `0.6875rem` / `11px`, line-height `1`, tracking `0.02em`): Monospace prices, percentage changes, session badges, and status pills.
- **Micro** (700 Bold Mono, `0.625rem` / `10px`, line-height `1`, tracking `0.02em`): Compact table metadata, tag counters, and secondary technical pills.
- **Nano** (700 Bold Mono, `0.5625rem` / `9px`, line-height `1`, tracking `0.04em`): REQUIRED and weight pills in dense checklist rules.

### Named Rules
**The Tabular Numerals Doctrine.** Any element displaying an asset price, dollar balance, leverage multiplier, or R-multiple must declare `font-mono tabular-nums`. Digits must align vertically across tables and cards without jitter.

## Layout

The workspace utilizes a full-viewport, 12-column responsive layout (`max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6`).

- **Responsive Breakpoints:**
  - `xs: 420px`: Custom anti-collision breakpoint preventing header wrap and badge collision on compact smartphones.
  - `sm: 640px`: Small tablet and horizontal mobile adjustments.
  - `md: 768px`: Desktop sidebar conversion and 12-column grid activation.
  - `lg: 1024px`: Extended telemetry readouts and calendar grid expansion.
  - `xl: 1280px`: Full data-dense multi-column layout.
  - `2xl: 1536px`: Widescreen canvas optimization.
- **Sidebar (Fixed Left):** Compact `w-64` shell (collapsible to `w-16`) with active indicator border bars and instant keyboard access.
- **Status Header (Top Sticky):** Height `64px` (`h-16`) with backdrop blur (`backdrop-blur-md`), strategy selector popover, live balance pill, active crypto session pills (`ASIA`, `LONDON`, `NY AM`, `NY PM`), and market clocks.
- **Pre-Trade Gate Workspace:** Asymmetrical 12-column grid:
  - **Left 5 Columns (`md:col-span-5`):** The Discipline Gate. Must precede execution; holds checklist rules and setup grade badge.
  - **Right 7 Columns (`md:col-span-7`):** Trade Execution & Details. Holds risk sizing engine, outcome selectors, chart screenshot attach, and execution receipts.
- **Mobile Ergonomics:**
  - The 11-column desktop ledger in `TradeTable` flips automatically to high-density touch cards on viewports under 768px (`md`).
  - Guaranteed 32px safe tap clearance (`safe-area-pb pb-24`) above the fixed mobile bottom navigation dock.

## Elevation & Depth

TradeGate Crypto uses **Layered Glass & Structural Hairlines** rather than heavy ambient dropshadows.

- **Base Canvas:** Flat, absorbent pitch canvas (`#090A0F` dark / `#F8FAFC` light).
- **Elevated Panels:** Subtle 1px hairline border (`#1F2430` dark / `#E2E8F0` light) with `.card-glass` surface (`#11131A` dark with `rgba(0,0,0,0.35)` shadow).
- **Popovers & Modals:** Elevated z-index with `backdrop-blur-md`, `border border-border`, and `shadow-2xl`.
- **Motion Polish:** Dropdowns and popovers animate using cubic-bezier easing (`@keyframes dropdownMotionIn`, `0.16s cubic-bezier(0.16, 1, 0.3, 1)`).

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.35)` dark / `rgba(0, 0, 0, 0.05)` light): Baseline card separation.
- **Elevated Popover** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.50)`): Dropdown menus, modal sheets, command palette HUD, and tooltips.

### Named Rules
**The Hairline Dominance Rule.** Structural depth is communicated through crisp 1px borders, not muddy shadows. Surfaces rest flat until lifted by interactive focus or open state.

## Shapes

- **Base Cards & Containers:** `rounded-2xl` (16px radius) with 1px border stroke.
- **Buttons & Form Inputs:** `rounded-xl` (12px radius) with 1px hairline stroke.
- **Status Chips & Pills:** `rounded-lg` (8px radius) or `rounded-full` (9999px) for mode pills (`PERP`, `SPOT`, `HYBRID`).
- **Checkboxes:** Tactile square checkboxes (`rounded-md`, 4px radius) with explicit `CheckSquare` / `Square` icons.

## Components

### Buttons
- **Shape:** Rounded rectangle (`rounded-xl`, 12px).
- **Primary Unlocked:** Amber Gold background (`#F59E0B`), pitch black bold text (`#000000`), active scale `scale-[0.99]`.
- **Primary Locked:** Muted card background, 40% opacity, `cursor-not-allowed`, padlock icon indicator.
- **Momentary Committed State:** Shifts to Emerald (`#34D399`) with checkmark icon for 1.8s upon trade journal commitment.
- **Secondary / Ghost:** Canvas background (`#090A0F`), hairline border (`#1F2430`), slate hover text.

### Inputs & Number Fields
- **Shape:** `rounded-xl` (12px), background `#090A0F`, 1px border `#1F2430`.
- **Typographic Treatment:** Neutral labels (`text-xs font-medium text-text-secondary`); input values render in bold monospace.
- **Spin Button Purge:** Native browser up/down stepper arrows are permanently hidden via CSS textfield appearance.
- **Focus:** 2px Amber Gold ring with 1px offset (`focus-visible:ring-2 focus-visible:ring-brand`).

### Animated Dropdown (`<AnimatedSelect />`)
- **Shape:** Compact pill with rotating chevron (`rotate-180` on open).
- **Menu:** Animated slide-down and fade (`animate-dropdown`), dark elevated container, checkmark on selected item.

### Checklist Rule Card
- **Rest State:** Canvas surface, hairline border, square checkbox icon, borderless category badge, and point weight.
- **Checked State:** Instant transition to emerald tint (`bg-emerald-500/10 border-emerald-500/40 text-text-primary`), checked square icon, emerald pill indicator.

### Brand Identity Mark (`<TradeGateLogo />`)
- **Archetype:** "The TG Monolith" (Modern Swiss Monogram).
- **Geometry:** Unbroken continuous ribbon path where the "T" lintel bar anchors the gate and loops into the sovereign terminal curve of the "G". Features an execution core dot (`#FBBF24`) inside the aperture.
- **Colorway:** Linear gradient `#FDE68A` (0%) → `#F59E0B` (45%) → `#D97706` (100%) encased in a dark titanium squircle (`#141721`, border `#262B3A`).
- **Variants:** `mark-only` (icon standalone) and `full` (icon + "TradeGate" wordmark + "CRYPTO" pill).

### Tactical Terminal Command HUD (`<TerminalCommandPalette />`)
- **Trigger:** Global hotkey `Cmd+K` / `Ctrl+K` or `?`.
- **Avionic Audio Sweep:** Pneumatic Web Audio frequency ramp (520Hz → 740Hz) on open.
- **Structure:** Carbon/titanium glass overlay with search input, direct `1-5` module navigation, quick actions (`N: New Trade`, `B: Balance Adjustment`, `M: Mute Audio`, `D: Toggle Theme`), and playbook switcher.

### Execution Commitment Receipt Stamp
- **Function:** Immediate post-commit feedback ribbon mounted at the top of the execution panel.
- **Data Payload:** Displays `#TG-XXXX` transaction hash, symbol, leverage/action, setup grade, risk allocation, and timestamp for 5 seconds before graceful departure.

## Do's and Don'ts

### Do:
- **Do** declare `tabular-nums font-mono` on all prices, balances, leverage, and P&L readouts.
- **Do** keep pills, tags, and status badges clean and borderless (`bg-*/15 text-*`) across all themes.
- **Do** use animated sliding indicator pills (`transition-all duration-200 ease-out`) on segmented switchers like Long/Short, Perps/Spot, and Table/Calendar.
- **Do** keep input labels neutral (`text-text-secondary`) without coloring Stop Loss labels red or Take Profit labels green.
- **Do** disable execution logging and display the Padlock icon until all mandatory strategy rules are checked.
- **Do** use `<AnimatedSelect />` with smooth motion transitions instead of native OS `<select>` elements.
- **Do** keep Dark Mode as the primary institutional terminal theme while maintaining full Light Mode contrast parity.

### Don't:
- **Don't** add borders to status pills, session tags, or setup grade badges.
- **Don't** use multi-color gradient fills on cards or text.
- **Don't** display raw database keys or prompt buzzwords in user-facing views.
- **Don't** permit default browser number input spin-arrows to appear.
- **Don't** place the trade execution form before the checklist; the Gate always precedes execution.
- **Don't** use ambient blur or opacity below accessible contrast thresholds (minimum 4.5:1 for body copy).
