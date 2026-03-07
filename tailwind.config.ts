import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Design system: light theme
        bg: "#f9fafb",
        surface: "#ffffff",
        "surface-dark": "#f3f4f6",
        "text-primary": "#111827",
        "text-secondary": "#4b5563",
        "text-muted": "#6b7280",
        border: "#e5e7eb",
        "border-strong": "#d1d5db",
        // Primary gradient (indigo → purple)
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#4f46e5",
        },
        accent: {
          purple: "#7c3aed",
          indigo: "#4f46e5",
        },
        // Semantic (kept for existing components)
        blue: "#4f46e5",
        "blue-dim": "#eef2ff",
        "blue-hover": "#4338ca",
        gold: "#d97706",
        "gold-dim": "#fffbeb",
        green: "#059669",
        "green-dim": "#ecfdf5",
        red: "#dc2626",
        "red-dim": "#fef2f2",
        // Legacy/glass
        glass: {
          border: "rgba(255, 255, 255, 0.5)",
          bg: "rgba(255, 255, 255, 0.7)",
          glow: "rgba(79, 70, 229, 0.2)",
        },
        cyber: {
          blue: "#2563eb",
          purple: "#7c3aed",
          pink: "#db2777",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-md": ["1.875rem", { lineHeight: "1.25" }],
        "display-sm": ["1.5rem", { lineHeight: "1.3" }],
      },
      spacing: {
        "0": "0",
        "1": "8px",
        "2": "16px",
        "3": "24px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
        "8": "64px",
        "10": "80px",
        "12": "96px",
        "16": "128px",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        glow: "0 0 20px -5px rgba(79, 70, 229, 0.3)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        mesh: "radial-gradient(at 40% 20%, rgba(79, 70, 229, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(124, 58, 237, 0.08) 0px, transparent 50%)",
      },
      animation: {
        "mesh-shift": "mesh-shift 15s ease-in-out infinite alternate",
        "glow-pulse": "glow-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "mesh-shift": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "100% 100%" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
