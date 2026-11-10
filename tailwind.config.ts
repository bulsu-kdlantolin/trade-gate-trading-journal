import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
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
        },
        trade: {
          green: "var(--tg-bullish)",
          "green-hover": "var(--tg-bullish-hover)",
          "green-bg": "var(--tg-bullish-bg)",
          red: "var(--tg-bearish)",
          "red-hover": "var(--tg-bearish-hover)",
          "red-bg": "var(--tg-bearish-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "Courier New", "monospace"],
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

