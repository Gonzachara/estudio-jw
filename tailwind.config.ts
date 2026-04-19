import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        n: {
          bg:         "var(--n-bg)",
          card:       "var(--n-card)",
          border:     "var(--n-border)",
          text:       "var(--n-text)",
          text2:      "var(--n-text2)",
          text3:      "var(--n-text3)",
          accent:     "var(--n-accent)",
          "accent-bg":"var(--n-accent-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.25s ease both",
        "slide-up": "slideUp 0.3s ease both",
        "scale-in": "scaleIn 0.2s ease both",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                                    to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(10px)" },     to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.97)" },          to: { opacity: "1", transform: "scale(1)" } },
      },
    },
  },
  plugins: [],
};

export default config;
