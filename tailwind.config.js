/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // ← habilita dark mode por classe
  theme: {
    extend: {
      colors: {
        background: "#0f1117",
        sidebar: "#1a1d24",
        card: "#1a1d24",
        "card-hover": "#22252d",
        border: "rgba(255, 255, 255, 0.1)",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
