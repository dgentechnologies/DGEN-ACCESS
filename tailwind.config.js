/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyber-purple': '#a855f7',
        'cyber-blue': '#3b82f6',
        'cyber-green': '#10b981',
        'cyber-red': '#ef4444',
      },
    },
  },
  plugins: [],
}
