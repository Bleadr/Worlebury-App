import type { Config } from "tailwindcss";

// ---------------------------------------------------------------------------
// THEME: Worlebury brand guidelines v1.0 — Charcoal (#1E2124) + Off-white
// (#F7F5F1) carry the brand, Bronze (#B8863B) is a restrained accent used
// sparingly. Spectral (serif) is the wordmark/heading face, Archivo (grotesk)
// is UI/labels/body. Every component reads these via the CSS variables in
// src/app/globals.css, so updating brand colours in future is a one-file change.
// ---------------------------------------------------------------------------
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          dark: "var(--accent-dark)",
          tint: "var(--accent-tint)",
        },
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
