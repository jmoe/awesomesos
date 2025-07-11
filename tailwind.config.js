/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sos-orange': '#FF6B35',
        'sos-blue': '#004E89',
        'sos-light': '#F7F9FB',
        'sos-dark': '#1D3557',
      },
    },
  },
  plugins: [],
}