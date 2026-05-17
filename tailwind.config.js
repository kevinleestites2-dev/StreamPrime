/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pantheon: {
          black: '#0a0a0a',
          gold: '#FFD700',
          accent: '#DAA520',
          dark: '#1a1a1a',
        }
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(255, 215, 0, 0.3)',
        'gold-glow-lg': '0 0 30px rgba(255, 215, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
