import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        elyon: {
          950: "#0B0F13",
          900: "#12181F",
          800: "#1B232C",
          700: "#2A3540",
          500: "#5B6B78",
          300: "#A9B6BE",
          100: "#EDF1F3",
          accent: "#C9A227",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
