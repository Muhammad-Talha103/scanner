/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false, // ✅ force disable dark mode (so theme stays same everywhere)
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
