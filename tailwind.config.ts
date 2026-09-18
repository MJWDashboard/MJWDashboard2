import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: "#0a0d10",
          900: "#0f1418",
          800: "#161c22",
          700: "#1e262e",
          600: "#2a343e",
          500: "#3a4753",
          400: "#5a6b78",
          300: "#8394a1",
          200: "#b3c0ca",
          100: "#dbe3e8",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
        status: {
          notStarted: "#5a6b78",
          inProgress: "#06b6d4",
          waiting: "#eab308",
          complete: "#22c55e",
          risk: "#ef4444",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
