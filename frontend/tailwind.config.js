/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0b0f19", // Deep premium dark background
          card: "#131b2e",       // Slate blue card background
          accent: "#1e294b",     // Selected/hover bg
        },
        brand: {
          primary: "#6366f1",    // Indigo-500
          secondary: "#10b981",  // Emerald-500
          accent: "#06b6d4",     // Cyan-500
          purple: "#8b5cf6",     // Violet-500
        },
        text: {
          primary: "#f8fafc",    // Slate-50
          secondary: "#94a3b8",  // Slate-400
          muted: "#64748b",      // Slate-500
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.3)",
        glass: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-glow": "radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%)",
      }
    },
  },
  plugins: [],
}
