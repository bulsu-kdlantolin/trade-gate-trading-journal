---
name: TradeGate Crypto
description: Institutional cryptocurrency trading journal, execution gate, and performance terminal
colors:
  primary: "#F59E0B"
  primary-hover: "#D97706"
  canvas-dark: "#090A0F"
  card-dark: "#11131A"
  card-hover-dark: "#181B24"
  border-dark: "#1F2430"
  border-muted-dark: "#2E3648"
  text-primary-dark: "#F8FAFC"
  text-secondary-dark: "#94A3B8"
  text-muted-dark: "#8E9DAE"
  canvas-light: "#F8FAFC"
  card-light: "#FFFFFF"
  card-hover-light: "#F1F5F9"
  border-light: "#E2E8F0"
  border-muted-light: "#CBD5E1"
  text-primary-light: "#0F172A"
  text-secondary-light: "#475569"
  text-muted-light: "#64748B"
  bullish: "#10B981"
  bullish-light: "#059669"
  bearish: "#F43F5E"
  bearish-light: "#E11D48"
  session-asia: "#FFFFFF"
  session-london: "#3B82F6"
  session-ny-am: "#3B82F6"
  session-ny-pm: "#F87171"
  shadow-dark: "rgba(0, 0, 0, 0.35)"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  micro:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, Menlo, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  nano:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, Menlo, monospace"
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

**Creative North Star: "The Sovereign Execution Terminal"**

TradeGate Crypto is engineered for high-conviction cryptocurrency traders who require tactical discipline, rapid ergonomics, and institutional clarity. The visual language balances extreme data density with zero visual noise, rejecting decorative gradients and novelty themes in favor of high-contrast hairlines, deep canvas grounding, and focused amber telemetry.

The interface operates strictly in **Operate Mode**: every pixel exists to serve pre-trade discipline, risk verification, and performance analysis. Layouts maintain rigorous horizontal rhythm and tabular precision. Ambient brand glows are used sparingly—reserved for verified gate unlocks, active session badges, and high-tier setup grades.

**Key Characteristics:**
- **High-Density Tactility:** Dense 12-column grids with compact padding (8px to 16px) prioritizing scanability.
- **Strict Semantic Separation:** Financial gains and losses use high-contrast Emerald and Rose tokens, while structural controls remain disciplined in Neutral and Amber Gold.
- **Tabular Monospace Alignment:** Every price, PnL value, position size, and R-multiple renders in JetBrains Mono with tabular numerals.
- **Enforced Gate Feedback:** Interactive checklist items physically transform with emerald tints upon verification; the execution trigger states are unambiguously locked or unlocked.
- **Acoustic & Tactile Feedback:** Zero external audio dependencies; pure Web Audio API synthesis produces subtle micro-ticks, gate arpeggios, and avionic HUD sweeps.

## Colors

The palette is anchored by deep space neutrals, punctuated by energetic Amber Gold, with strict emerald/rose semantic returns.

### Primary
- **Amber Gold** (`#F59E0B`): The core brand energy, reserved for active navigation tabs, live strategy indicators, A+ setup tiers, and primary execution triggers.
- **Amber Deep** (`#D97706`): Interactive hover state for primary amber buttons and badges.

### Neutral
- **Deep Pitch Canvas** (`#090A0F` dark / `#F8FAFC` light): The foundation canvas layer. Absorbs ambient light and gives cards floating structural separation.
- **Elevated Card Surface** (`#11131A` dark / `#FFFFFF` light): Container surface for trade forms, checklists, and bento KPI cards.
- **Interactive Surface Hover** (`#181B24` dark / `#F1F5F9` light): Subtle highlight for table rows, clickable list items, and menu buttons.
- **Subtle Hairline Border** (`#1F2430` dark / `#E2E8F0` light): 1px structural boundary that defines cards without heavy drop-shadows.
- **Slate Text Primary** (`#F8FAFC` dark / `#0F172A` light): Main headlines, active prices, and primary labels.
- **Slate Text Secondary** (`#94A3B8` dark / `#475569` light): Form input labels, table secondary values, and timestamps.
- **Slate Text Muted** (`#64748B` dark / `#94A3B8` light): Inactive states, placeholder text, and footnote metadata.

### Semantic
- **Bullish Emerald** (`#10B981` dark / `#059669` light): Winning trades, verified mandatory rules, and positive P&L returns.
- **Bearish Rose** (`#F43F5E` dark / `#E11D48` light): Discipline violations, stop losses, closed losses, and gate lock alerts.

### Operational Roles & Hierarchy
- **Setup Confidence Tiers (Grades):**
  - **Grade A+**: Amber Gold (`#F59E0B`) — Elite conviction, all mandatory rules passed, maximum confluence points.
  - **Grade A**: Emerald (`#10B981`) — Solid disciplined setup, high confluence.
  - **Grade B**: Electric Blue (`#3B82F6`) — Disciplined execution, moderate confluence.
  - **Grade C**: Bearish Rose (`#F43F5E`) — Marginal setup, gate violation, or forced bypass.
- **Rule Domain Categories:**
  - **HTF Bias**: Indigo (`#6366F1`)
  - **Execution**: Amber Gold (`#F59E0B`)
  - **Risk**: Rose (`#F43F5E`)
  - **Market Context**: Purple (`#A855F7`)
  - **On-Chain**: Teal (`#14B8A6`)
  - **General**: Neutral Slate (`#64748B`)
- **Market Liquidity Sessions:**
  - **Asia**: Slate / White Adaptive (`#F8FAFC` dark / `#0F172A` light)
  - **London**: Electric Blue (`#3B82F6`)
  - **New York AM**: Institutional Electric Blue (`#3B82F6`) — *Standardized to prevent false-alarm red signaling*
  - **New York PM**: Sunset Salmon (`#F87171`)
- **Spot Actions:**
  - **BUY / ACCUMULATE**: Emerald (`#10B981`)
  - **DCA ADD**: Teal (`#14B8A6`)
  - **PARTIAL TP**: Amber (`#F59E0B`)
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
