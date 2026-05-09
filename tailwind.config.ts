import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD", 400: "#60A5FA",
          500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8", 800: "#1E40AF", 900: "#1E3A8A", 950: "#172554",
        },
        surface: "#F8FAFF",
        royal: {
          50:  "#F5F1FA", 100: "#E8DEF5", 200: "#C7B0E5", 400: "#7A5BC2",
          600: "#3D2380", 700: "#2D1B5E", 800: "#1F1342", 900: "#150C2E",
        },
        gilt: {
          50:  "#FAF6E8", 200: "#E8D49E", 400: "#D4B570",
          500: "#C9A961", 600: "#A88848", 700: "#806532",
        },
        ivory: {
          50:  "#FEFCF7", 100: "#FBF7EE", 200: "#F4ECDC", 300: "#EAE0CB",
        },
        ink: {
          400: "#5B4F6E", 600: "#3A3145", 800: "#1F1A2E", 900: "#0F0B1A",
        },
      },
      fontFamily: {
        sans:    ["var(--font-geist)",      "system-ui", "sans-serif"],
        serif:   ["var(--font-instrument)", "Georgia",   "serif"],
        display: ["var(--font-instrument)", "Georgia",   "serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(45,27,94,0.06), 0 1px 2px rgba(45,27,94,0.04)",
        "card-hover": "0 4px 12px rgba(45,27,94,0.10), 0 2px 4px rgba(45,27,94,0.06)",
        royal: "0 8px 32px rgba(45,27,94,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
