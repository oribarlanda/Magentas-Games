import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0F1117",
          surface: "#1A1D27",
          border: "#2A2D3E",
          accent: "#6C63FF",
          accentHover: "#5A52E0",
          text: "#E8E9F0",
          muted: "#8B8FA8",
          easy: "#22C55E",
          medium: "#EAB308",
          hard: "#F97316",
          expert: "#A855F7",
        },
      },
      animation: {
        "bounce-in": "bounceIn 0.4s cubic-bezier(0.36,0.07,0.19,0.97)",
        shake: "shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)",
        "fade-in": "fadeIn 0.3s ease",
        "slide-up": "slideUp 0.4s ease",
      },
      keyframes: {
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
