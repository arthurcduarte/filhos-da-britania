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
        parchment: {
          DEFAULT: "#f0ead8",
          light: "#f8f4ec",
          dark: "#ddd4bc",
          deep: "#c4b99e",
        },
        ink: {
          DEFAULT: "#1c1814",
          light: "#3d3328",
          mid: "#6b5f4e",
        },
        sepia: {
          DEFAULT: "#8b7d6b",
          light: "#b0a493",
          dark: "#5a4d3d",
        },
        rust: {
          DEFAULT: "#7a3010",
          light: "#9b4020",
          dark: "#4d1e08",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        medieval: ["var(--font-medieval)", "serif"],
        body: ["var(--font-crimson)", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.45s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
