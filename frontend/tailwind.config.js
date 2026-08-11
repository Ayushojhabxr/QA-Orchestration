/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        night: "#050816",
        abyss: "#0b1120",
        glow: "#5eead4",
        aurora: "#38bdf8",
        flare: "#f97316",
      },
      boxShadow: {
        glow: "0 0 30px rgba(94, 234, 212, 0.25)",
        panel: "0 20px 80px rgba(5, 8, 22, 0.45)",
      },
      fontFamily: {
        display: ["Sora", "Segoe UI", "sans-serif"],
        body: ["Space Grotesk", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
