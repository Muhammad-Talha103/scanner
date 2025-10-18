/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "never", // ✅ use "never" instead of false for strict disable
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
