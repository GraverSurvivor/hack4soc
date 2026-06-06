import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1C3F",
          50: "#E8ECF4",
          100: "#C5CEE0",
          200: "#9EADC9",
          300: "#778CB2",
          400: "#5A749F",
          500: "#3D5C8C",
          600: "#2A4570",
          700: "#1A2F52",
          800: "#0F1C3F",
          900: "#0A1229",
        },
        violet: {
          DEFAULT: "#7C3AED",
          light: "#A78BFA",
          dark: "#5B21B6",
        },
        amber: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },
        story: {
          bg: "#FFF7ED",
          text: "#78350F",
          accent: "#F59E0B",
          paper: "#FEF3C7",
        },
        calm: {
          bg: "#F0F9FF",
          text: "#0C4A6E",
          accent: "#38BDF8",
          card: "#FFFFFF",
        },
        game: {
          bg: "#0F0A1E",
          text: "#E0E7FF",
          accent: "#A855F7",
          neon: "#22D3EE",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        story: ["var(--font-lora)", "Georgia", "serif"],
        calm: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        game: ["OpenDyslexic", "var(--font-space-grotesk)", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "xp-burst": "xpBurst 0.6s ease-out",
        flame: "flame 1s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        xpBurst: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.3)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        flame: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.1)" },
        },
      },
      boxShadow: {
        card: "0 4px 20px rgba(15, 28, 63, 0.08)",
        "card-hover": "0 8px 30px rgba(15, 28, 63, 0.15)",
        glow: "0 0 20px rgba(124, 58, 237, 0.3)",
        neon: "0 0 15px rgba(34, 211, 238, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
