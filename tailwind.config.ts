import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "420px",
      },
      colors: {
        canvas: "var(--tg-canvas)",
        card: "var(--tg-card)",
        "card-hover": "var(--tg-card-hover)",
        border: "var(--tg-border)",
        "border-muted": "var(--tg-border-muted)",

        "text-primary": "var(--tg-text-primary)",
        "text-secondary": "var(--tg-text-secondary)",
        "text-muted": "var(--tg-text-muted)",

        brand: {
          DEFAULT: "var(--tg-brand)",
          hover: "var(--tg-brand-hover)",
          muted: "var(--tg-brand-muted)",
          yellow: "#FCD535",
          gold: "#F0B90B",
        },
        trade: {
          green: "var(--tg-bullish)",
          "green-hover": "var(--tg-bullish-hover)",
          "green-bg": "var(--tg-bullish-bg)",
          red: "var(--tg-bearish)",
          "red-hover": "var(--tg-bearish-hover)",
          "red-bg": "var(--tg-bearish-bg)",
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#22E297',
          500: '#0ECB81',
          600: '#0CA86B',
          700: '#088052',
          800: '#065F3D',
          900: '#064E3B',
          950: '#022C22',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FF6B7E',
          500: '#F6465D',
          600: '#D9384E',
          700: '#B8273B',
          800: '#991E2F',
          900: '#7E1D29',
          950: '#4C0510',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD535',
          400: '#FCD535',
          500: '#F0B90B',
          600: '#D9A006',
          700: '#B78403',
          800: '#926607',
          900: '#78530B',
          950: '#452E03',
        },
      },
      fontFamily: {
        sans: ["BinancePlex", "IBM Plex Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.25)",
        "card-light": "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;

